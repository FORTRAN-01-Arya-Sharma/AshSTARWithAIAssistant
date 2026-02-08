const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- NODEMAILER CONFIG ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { 
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  },
});

// --- DATABASE SCHEMAS ---
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

// Robust Fallback Model List
const MODEL_FALLBACKS = [
  "gemini-2.0-flash",    // Primary (Fastest)
  "gemini-1.5-flash",    // Stable Backup
  "gemini-1.5-flash-8b", // Light Backup
  "gemini-1.5-pro"       // High-Logic Backup
];

const PERSONAS = {
  taskmaster: `IDENTITY: You are TaskMaster AI. Strict, no-nonsense. NICHE: Productivity.`,
  ideaforge: `IDENTITY: You are IdeaForge AI. Creative, trendy. NICHE: Content/Biz.`,
  fitmentor: `IDENTITY: You are FitMentor AI. Military-style coach. NICHE: Fitness.`,
  codebuddy: `IDENTITY: You are CodeBuddy AI. Senior Engineer. NICHE: Code.`,
  companion: `IDENTITY: You are Companion AI. Empathetic friend. NICHE: Support.`
};

const OFFLINE_RESPONSES = {
  taskmaster: ["{{WARNING}} Neural link unstable. Focus on your priority list."],
  fitmentor: ["{{WARNING}} Data packet dropped. Keep pushing through your sets."],
  codebuddy: ["{{WARNING}} API Rate Limit Exceeded. Check your syntax."],
  ideaforge: ["{{WARNING}} Creative block in network. Try brainstorming fresh ideas."],
  companion: ["{{LOVE}} I'm having trouble connecting, but I'm still here for you."]
};

// --- ROUTES ---

// 1. AUTHENTICATION
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
      // Optional Welcome Email
      const mailOptions = {
        from: '"AshStar Mainframe" <no-reply@ashstar.com>',
        to: email,
        subject: 'Welcome to the Syndicate // AshStar',
        text: `Welcome ${name}. System Online.`
      };
      transporter.sendMail(mailOptions).catch(err => console.log("Mail ignored:", err.message));
    }
    res.json(user);
  } catch (err) { res.status(500).json({ error: "DB Error during login" }); }
});

// 2. SESSIONS & HISTORY
app.get('/api/sessions/:email/:assistantId', async (req, res) => {
  try {
    const sessions = await Session.find({ email: req.params.email, assistantId: req.params.assistantId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: "Fetch error" }); }
});

app.post('/api/sessions', async (req, res) => {
  const { email, assistantId, title } = req.body;
  try {
    const newSession = new Session({ email, assistantId, title: title || "New Operation" });
    await newSession.save();
    res.json(newSession);
  } catch (err) { res.status(500).json({ error: "Session creation error" }); }
});

app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const history = await Chat.find({ sessionId: req.params.sessionId }).sort({ timestamp: 1 });
    res.json(history);
  } catch (err) { res.status(500).json({ error: "History fetch error" }); }
});

// 3. THE ROBUST CHAT ENGINE (With Hydra Fallback)
app.post('/api/chat', async (req, res) => {
  const { message, assistantId, isPremium, email, sessionId } = req.body;

  let systemInstruction = PERSONAS[assistantId] || "You are a helpful AI.";
  if (isPremium) systemInstruction += " [PREMIUM] Provide advanced insights.";
  
  const prompt = `${systemInstruction}\n\nUser: ${message}\nAI:`;
  let aiText = null;

  // --- THE HYDRA LOOP ---
  // Tries multiple models if one fails or is busy
  for (const modelName of MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      aiText = result.response.text();
      
      if (aiText) {
        console.log(`✅ SUCCESS with model: ${modelName}`);
        break; 
      }
    } catch (e) {
      console.warn(`⚠️ Model ${modelName} failed:`, e.message);
      // Brief pause to prevent rapid-fire rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // --- SIMULATION FALLBACK ---
  // Triggers if ALL models fail (Recruiter Safety Net)
  if (!aiText) {
    console.error("❌ ALL AI ATTEMPTS FAILED. ENGAGING SIMULATION.");
    const fallbacks = OFFLINE_RESPONSES[assistantId] || OFFLINE_RESPONSES['companion'];
    aiText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // --- ASYNC DATABASE LOGGING ---
  try {
    if (email && sessionId) {
      await Chat.create([
        { sessionId, email, assistantId, role: 'user', text: message },
        { sessionId, email, assistantId, role: 'ai', text: aiText }
      ]);
    }
  } catch (dbError) {
    console.error("⚠️ Chat Log Failed (Response sent anyway):", dbError.message);
  }

  res.json({ reply: aiText });
});

// 4. REVIEWS & FEEDBACK
app.post('/api/reviews', async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();
    res.json(newReview);
  } catch (err) { res.status(500).json({ error: "Post error" }); }
});

app.get('/api/reviews/:assistantId', async (req, res) => {
  try {
    const reviews = await Review.find({ assistantId: req.params.assistantId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: "Review fetch error" }); }
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 AshStar Mainframe active on Port ${PORT}`);
});