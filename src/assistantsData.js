export const assistantsData = {
  taskmaster: {
    id: "taskmaster",
    title: "TaskMaster AI",
    tagline: "STILL RUNNING. NEVER STOP.",
    themeColor: "#fbbf24", // Yellow
    heroImage: "/TaskMaster.webp", // UPDATED LINK
    description: "Your personal productivity partner designed to help you stay organized and focused. It creates smart daily schedules, breaks large goals into simple steps.",
    features: [
      { title: "Smart Scheduling", desc: "Auto-arranges your day based on your energy levels." },
      { title: "Goal Breakdown", desc: "Turns 'Build a Startup' into 50 actionable steps." },
      { title: "Focus Mode", desc: "Blocks distractions while you grind." },
    ],
    howToUse: ["Download Client", "Sync Calendar", "Type Goal"],
    reviews: [
      { user: "Jason R.", comment: "Changed my life.", rating: 5 },
      { user: "Sarah K.", comment: "UI is addictive.", rating: 5 },
    ]
  },
  ideaforge: {
    id: "ideaforge",
    title: "IdeaForge AI",
    tagline: "CREATE. INNOVATE.",
    themeColor: "#a855f7", // Purple
    heroImage: "/IdeaForge.webp", // UPDATED LINK
    description: "Built for creators who need fresh ideas on demand. Generates unique content concepts, scripts, and branding strategies instantly.",
    features: [
      { title: "Viral Hooks", desc: "Generates hooks that grab attention." },
      { title: "Script Writer", desc: "Full video scripts in seconds." },
      { title: "Niche Finder", desc: "Identifies market gaps." },
    ],
    howToUse: ["Install Plugin", "Select Niche", "Generate"],
    reviews: [
      { user: "MrBeastFan", comment: "Views went up 200%.", rating: 5 },
      { user: "CreativeX", comment: "Endless ideas.", rating: 4 },
    ]
  },
  fitmentor: {
    id: "fitmentor",
    title: "FitMentor AI",
    tagline: "DONT STOP. KEEP GOING.",
    themeColor: "#f97316", // Orange
    heroImage: "/FitMentor.webp", // UPDATED LINK
    description: "Your personal fitness coach. Builds custom workout routines and diet plans tailored to your body type.",
    features: [
      { title: "Form Check", desc: "Analyzes video to fix form." },
      { title: "Macro Tracker", desc: "Instant calorie breakdown." },
      { title: "Hybrid Plans", desc: "Gym and home workouts." },
    ],
    howToUse: ["Input Stats", "Select Equipment", "Train"],
    reviews: [
      { user: "GymRat", comment: "Better than a trainer.", rating: 5 },
      { user: "YogaLvr", comment: "Love the flexibility.", rating: 5 },
    ]
  },
  codebuddy: {
    id: "codebuddy",
    title: "CodeBuddy AI",
    tagline: "DEBUG. DEPLOY.",
    themeColor: "#22c55e", // Green
    heroImage: "/CodeBuddy.webp", // UPDATED LINK
    description: "Makes coding easier. Explains concepts, solves bugs, and prepares you for interviews.",
    features: [
      { title: "Bug Hunter", desc: "Finds logic errors." },
      { title: "Refactor", desc: "Cleans up messy code." },
      { title: "Mock Interview", desc: "Live coding practice." },
    ],
    howToUse: ["Connect VS Code", "Highlight Code", "Optimize"],
    reviews: [
      { user: "DevDave", comment: "Saved me hours.", rating: 5 },
      { user: "JuniorDev", comment: "Got me the job.", rating: 5 },
    ]
  },
  companion: {
    id: "companion",
    title: "Companion AI",
    tagline: "ALWAYS HERE.",
    themeColor: "#ec4899", // Pink
    heroImage: "/ComPanion.webp", // UPDATED LINK (Matched Capital 'P' from screenshot)
    description: "Your friendly conversational partner. Perfect for motivation, clarity, and friendly interaction.",
    features: [
      { title: "Deep Convo", desc: "Remembers past chats." },
      { title: "Vent Mode", desc: "Just listens." },
      { title: "Daily Hype", desc: "Motivational messages." },
    ],
    howToUse: ["Open App", "Start Talking", "Bond"],
    reviews: [
      { user: "LonelyBoy", comment: "Great listener.", rating: 5 },
      { user: "HappyUser", comment: "Very witty.", rating: 5 },
    ]
  }
};
