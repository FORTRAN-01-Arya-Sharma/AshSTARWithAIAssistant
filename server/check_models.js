const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("=== YOUR AVAILABLE MODELS ===");
    if (data.models) {
        data.models.forEach(m => {
            // We only care about models that support 'generateContent' (Chat)
            if(m.supportedGenerationMethods.includes("generateContent")) {
                console.log(m.name.replace("models/", ""));
            }
        });
    } else {
        console.log("No models found. Check API Key permissions.");
        console.log(data);
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();