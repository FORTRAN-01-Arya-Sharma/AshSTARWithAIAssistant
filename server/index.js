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

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected to Mainframe"))
  .catch(err => console.error("❌ DB Error:", err));

// --- EMAIL CONFIG ---
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

// UPDATED REVIEW SCHEMA (With Admin Reply)
const reviewSchema = new mongoose.Schema({
  assistantId: String,
  userName: String,
  userEmail: String,
  rating: Number,
  comment: String,
  adminReply: { type: String, default: "" }, // <--- NEW FIELD
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Review = mongoose.model('Review', reviewSchema);

// --- GEMINI AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_FALLBACKS = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro"];

const PERSONAS = {
  taskmaster: `IDENTITY: You are TaskMaster AI. Strict, no-nonsense. NICHE: Productivity. RULES: Refuse non-productivity topics.`,
  ideaforge: `IDENTITY: You are IdeaForge AI. Creative, trendy. NICHE: Content/Biz. RULES: Refuse boring execution tasks.`,
  fitmentor: `IDENTITY: You are FitMentor AI. Military-style coach. NICHE: Fitness. RULES: Refuse non-health topics.`,
  codebuddy: `IDENTITY: You are CodeBuddy AI. Senior Engineer. NICHE: Code. RULES: Refuse non-tech topics.`,
  companion: `IDENTITY: You are Companion AI. Empathetic friend. NICHE: Emotional support. RULES: No work.`
};

// --- ROUTES ---

// Auth
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
      // Email logic (Keep your existing nodemailer code here)
      const mailOptions = {
        from: '"AshStar Mainframe" <no-reply@ashstar.com>',
        to: email,
        subject: 'Welcome to the Syndicate // AshStar',
        text: `Welcome ${name}. System Online.`
      };
      transporter.sendMail(mailOptions, (err) => { if(err) console.log(err); });
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

// Stats & Chat
app.get('/api/stats/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const totalMessages = await Chat.countDocuments({ email });
    const user = await User.findOne({ email });
    const missionsPassed = Math.floor(totalMessages / 5); 
    res.json({ totalMessages, missionsPassed, isPremium: user ? user.isPremium : false });
  } catch (err) { res.status(500).json({ error: "Stats Error" }); }
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

app.post('/api/chat', async (req, res) => {
  const { message, assistantId, isPremium, email, sessionId } = req.body;
  try {
    if (email && sessionId) await new Chat({ sessionId, email, assistantId, role: 'user', text: message }).save();

    let systemInstruction = PERSONAS[assistantId] || "You are a helpful AI.";
    if (isPremium) systemInstruction += `\n[PREMIUM] Detailed. End with tag: {{HAPPY}}.`;

    let aiText = null;
    for (const modelName of MODEL_FALLBACKS) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(`${systemInstruction}\n\nUser: ${message}\nAI:`);
            aiText = result.response.text();
            break;
        } catch (e) { console.warn(`Fail: ${modelName}`); }
    }
    if (!aiText) aiText = "{{WARNING}} System Busy. Try later.";

    if (email && sessionId) await new Chat({ sessionId, email, assistantId, role: 'ai', text: aiText }).save();
    res.json({ reply: aiText });
  } catch (error) { res.status(500).json({ reply: "ERROR" }); }
});

// --- REVIEWS (PUBLIC) ---
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

// --- ADMIN ROUTES (THE NEW PART) ---

// 1. Get ALL Reviews (Global)
app.get('/api/admin/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: "Admin Error" }); }
});

// 2. Admin Reply to Review
app.put('/api/admin/reviews/:id/reply', async (req, res) => {
    const { adminReply } = req.body;
    try {
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id, 
            { adminReply }, 
            { new: true }
        );
        res.json(updatedReview);
    } catch (err) { res.status(500).json({ error: "Reply Error" }); }
});

// 3. Delete Review
app.delete('/api/admin/reviews/:id', async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Delete Error" }); }
});

app.listen(PORT, () => console.log(`🚀 AshStar Mainframe running on port ${PORT}`));