const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// --- EMAIL ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// --- SCHEMAS ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  avatar: String,
  isPremium: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  email: String,
  assistantId: String,
  title: { type: String, default: "New Operation" },
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  sessionId: String,
  email: String,
  assistantId: String,
  role: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  assistantId: String,
  userName: String,
  userEmail: String,
  rating: Number,
  comment: String,
  adminReply: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Review = mongoose.model('Review', reviewSchema);

// --- AI CONFIGURATION ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 9 Layers of Fallback Models
const MODEL_FALLBACKS = [
  "gemini-2.0-flash",    // Fast, newest
  "gemini-1.5-flash",    // Most stable high-quota model
  "gemini-1.5-flash-8b", // Extremely lightweight, rarely "busy"
  "gemini-1.5-pro"       // High intelligence backup
];

for (const modelName of MODEL_FALLBACKS) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        aiText = result.response.text();
        if (aiText) break; 
    } catch (e) {
        console.warn(`❌ Failed with ${modelName}:`, e.message);
        // Wait 500ms before trying the next model to let the API "breathe"
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// --- SIMULATION DATABASE (The Recruiter Saver) ---
const OFFLINE_RESPONSES = {
    taskmaster: [
        "{{WARNING}} Neural link unstable. However: Stop wasting time and focus on your priority list.",
        "{{ANALYSIS}} Network traffic high. Advice: Prioritize your hardest task immediately.",
        "{{SUCCESS}} Connection rerouted. Execute your scheduled plan without deviation."
    ],
    fitmentor: [
        "{{WARNING}} Data packet dropped. But you shouldn't drop your weights. Keep pushing.",
        "{{ANALYSIS}} Analyzing... Drink more water and check your protein intake.",
        "{{SUCCESS}} Signal recovered. Focus on form over speed."
    ],
    codebuddy: [
        "{{WARNING}} API Rate Limit Exceeded. Check your syntax and try again.",
        "{{ANALYSIS}} Compiling response... Ensure your variables are defined before use.",
        "{{DATA}} System latency detected. Recommend refactoring your approach."
    ],
    ideaforge: [
        "{{WARNING}} Creative block detected in the network. Try brainstorming in a new environment.",
        "{{SUCCESS}} Idea uploaded. Focus on viral hooks and engagement metrics.",
        "{{ANALYSIS}} Trend analysis suggests pivoting to short-form content."
    ],
    companion: [
        "{{LOVE}} I'm having trouble hearing you, but I'm still here for you!",
        "{{THINKING}} Hmm, the connection is fuzzy. Tell me more about that?",
        "{{HAPPY}} I'm listening! Even if the wifi is bad, we can still chat."
    ]
};

const PERSONAS = {
  taskmaster: `IDENTITY: You are TaskMaster AI. Strict, no-nonsense. NICHE: Productivity. RULES: Refuse non-productivity topics.`,
  ideaforge: `IDENTITY: You are IdeaForge AI. Creative, trendy. NICHE: Content/Biz. RULES: Refuse boring execution tasks.`,
  fitmentor: `IDENTITY: You are FitMentor AI. Military-style coach. NICHE: Fitness. RULES: Refuse non-health topics.`,
  codebuddy: `IDENTITY: You are CodeBuddy AI. Senior Engineer. NICHE: Code. RULES: Refuse non-tech topics.`,
  companion: `IDENTITY: You are Companion AI. Empathetic friend. NICHE: Emotional support. RULES: No work.`
};

// --- ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  const { name, email, avatar } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.avatar = avatar;
      await user.save();
    } else {
      user = new User({ name, email, avatar });
      await user.save();
      const mailOptions = {
        from: '"AshStar Mainframe" <no-reply@ashstar.com>',
        to: email,
        subject: 'Welcome to the Syndicate // AshStar',
        text: `Welcome ${name}. System Online.`
      };
      transporter.sendMail(mailOptions, (err) => { if(err) console.log("Mail Error:", err); });
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/auth/upgrade', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOneAndUpdate({ email }, { isPremium: true }, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Upgrade Failed" }); }
});

app.get('/api/sessions/:email/:assistantId', async (req, res) => {
  try {
    const { email, assistantId } = req.params;
    let sessions = await Session.find({ email, assistantId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/sessions', async (req, res) => {
  const { email, assistantId, title } = req.body;
  try {
    const newSession = new Session({ email, assistantId, title: title || "New Operation" });
    await newSession.save();
    res.json(newSession);
  } catch (err) { res.status(500).json({ error: "Create Error" }); }
});

app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const history = await Chat.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) { res.status(500).json({ error: "Fetch Error" }); }
});

app.get('/api/stats/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const totalMessages = await Chat.countDocuments({ email });
    const user = await User.findOne({ email });
    const missionsPassed = Math.floor(totalMessages / 5); 
    res.json({ totalMessages, missionsPassed, isPremium: user ? user.isPremium : false });
  } catch (err) { res.status(500).json({ error: "Stats Error" }); }
});

// --- THE ROBUST CHAT ROUTE ---
app.post('/api/chat', async (req, res) => { // <--- ENSURE 'async' IS HERE
  const { message, assistantId, isPremium, email, sessionId } = req.body;

  let systemInstruction = PERSONAS[assistantId] || "You are a helpful AI.";
  const prompt = `${systemInstruction}\n\nUser: ${message}\nAI:`;
  let aiText = null;

  // 2. THE HYDRA LOOP
  for (const modelName of MODEL_FALLBACKS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt); // <--- This 'await' requires the 'async' above
        aiText = result.response.text();
        if (aiText) break; 
      } catch (e) {
        console.warn(`❌ Failed with ${modelName}:`, e.message); 
      }
  }

  // 3. NUCLEAR FALLBACK (Simulation Mode)
  if (!aiText) {
    console.log("❌ ALL API ATTEMPTS FAILED. ENGAGING SIMULATION.");
    // Select a random response from the Offline list
    const fallbacks = OFFLINE_RESPONSES[assistantId] || OFFLINE_RESPONSES['companion'];
    aiText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // 4. DATABASE SAVING (Wrapped in try/catch so it doesn't crash the chat)
  try {
    if (email && sessionId) {
      // Save User Message
      await new Chat({ sessionId, email, assistantId, role: 'user', text: message }).save();
      // Save AI Message
      await new Chat({ sessionId, email, assistantId, role: 'ai', text: aiText }).save();
    }
  } catch (dbError) {
    console.error("⚠️ Database Save Failed (Chat continued anyway):", dbError.message);
  }

  // 5. SEND RESPONSE
  res.json({ reply: aiText });
});

// Reviews
app.get('/api/reviews/:assistantId', async (req, res) => {
    try {
      const reviews = await Review.find({ assistantId: req.params.assistantId }).sort({ createdAt: -1 });
      res.json(reviews);
    } catch (err) { res.status(500).json({ error: "Review Error" }); }
});
  
app.post('/api/reviews', async (req, res) => {
    const { assistantId, userName, userEmail, rating, comment } = req.body;
    try {
      const newReview = new Review({ assistantId, userName, userEmail, rating, comment });
      await newReview.save();
      res.json(newReview);
    } catch (err) { res.status(500).json({ error: "Post Error" }); }
});

app.get('/api/admin/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: "Admin Error" }); }
});

app.put('/api/admin/reviews/:id/reply', async (req, res) => {
    const { adminReply } = req.body;
    try {
        const updatedReview = await Review.findByIdAndUpdate(req.params.id, { adminReply }, { new: true });
        res.json(updatedReview);
    } catch (err) { res.status(500).json({ error: "Reply Error" }); }
});

app.delete('/api/admin/reviews/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Delete Error" }); }
});

app.listen(PORT, () => console.log(`🚀 AshStar Mainframe running on port ${PORT}`));