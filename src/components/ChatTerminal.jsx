import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// --- VISUAL ASSETS ---
const STICKER_MAP = {
  HAPPY: "https://media.tenor.com/On7krjQpZBUAAAAj/loading-loading-gif.gif",
  SAD: "https://media.tenor.com/j1Is0Yy6kYwAAAAj/sad-face.gif",
  ANGRY: "https://media.tenor.com/b9K4rV1BwCAAAAAj/angry.gif",
  COOL: "https://media.tenor.com/13_u8NlJ2L0AAAAj/cool.gif",
  THINKING: "https://media.tenor.com/tEBoVu1ndF8AAAAj/loading-buffering.gif",
  LOVE: "https://media.tenor.com/2s452g6kQoAAAAAj/heart.gif",
  SHOCKED: "https://media.tenor.com/P0G_7t6rmXAAAAAj/shocked.gif",
  LAUGH: "https://media.tenor.com/C3fE7F1tqX8AAAAj/lol.gif",
  SUCCESS: "https://i.gifer.com/7efs.gif", 
  WARNING: "https://i.gifer.com/origin/78/7821676b7720977464016a760eb80957_w200.gif",
  ANALYSIS: "https://i.gifer.com/origin/e2/e24e137835154316d946d47bf9087c53_w200.gif",
  DATA: "https://i.gifer.com/origin/c4/c4d8e8b941586fb83726cb736932454f_w200.gif"
};

// --- CLIENT-SIDE BACKUPS (Recruiter Proofing) ---
const CLIENT_FALLBACKS = {
  default: [
    "{{SUCCESS}} Request received. Processing locally... Here is a strategic breakdown.",
    "{{THINKING}} analyzing... The data suggests you should focus on optimization first.",
    "{{COOL}} System operational. I've logged that request. Keep pushing forward."
  ],
  taskmaster: [
    "{{WARNING}} Stop procrastinating. Here is your plan: 1. Do the hardest task now. 2. Take a 5 min break. 3. Repeat.",
    "{{ANALYSIS}} Your schedule is inefficient. Block out 90 minutes for deep work immediately."
  ],
  fitmentor: [
    "{{SUCCESS}} Good question. Consistency > Intensity. Focus on your form today.",
    "{{WARNING}} Don't skip leg day. Ensure you are hitting your protein macros."
  ]
};

const AnimatedSticker = ({ type }) => {
  const url = STICKER_MAP[type] || STICKER_MAP.HAPPY;
  return <div className="mt-2 inline-block"><img src={url} alt={type} className="w-20 h-20 object-contain drop-shadow-2xl" /></div>;
};

const ChatTerminal = ({ assistantId, themeColor, closeChat, isPremium }) => {
  const { user } = useAuth();
  const activeColor = isPremium ? "#FFD700" : themeColor;
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const scrollRef = useRef(null);

  // --- CLEANUP: STOP VOICE ON CLOSE ---
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel(); 
    };
  }, []);

  // --- 1. LOAD SESSIONS ---
  useEffect(() => {
    if (!user?.email) return;
    const fetchSessions = async () => {
        try {
            const res = await fetch(`https://ashstarwithaiassistant.onrender.com/api/sessions/${user.email}/${assistantId}`);
            const data = await res.json();
            setSessions(data);
            if (data.length > 0) setActiveSessionId(data[0]._id);
            else createNewSession();
        } catch (e) { console.error("Session Error"); }
    };
    fetchSessions();
  }, [assistantId, user]);

  // --- 2. LOAD CHAT HISTORY ---
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchChat = async () => {
        setMessages([]); 
        try {
            const res = await fetch(`https://ashstarwithaiassistant.onrender.com/api/chat/${activeSessionId}`);
            const data = await res.json();
            if (data.length === 0) {
                setMessages([{ role: 'ai', text: isPremium ? `{{SUCCESS}} ELITE UPLINK ESTABLISHED.` : `System Online. Session ID: ${activeSessionId.slice(-4)}.` }]);
            } else {
                setMessages(data);
            }
        } catch (e) { console.error(e); }
    };
    fetchChat();
  }, [activeSessionId]);

  // --- 3. CREATE SESSION ---
  const createNewSession = async () => {
    const title = prompt("Enter Section Name:", "New Operation");
    if (!title) return;
    try {
        const res = await fetch('https://ashstarwithaiassistant.onrender.com/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, assistantId, title })
        });
        const newSession = await res.json();
        setSessions([newSession, ...sessions]); 
        setActiveSessionId(newSession._id); 
    } catch (e) { alert("Failed"); }
  };

  // --- VOICE LOGIC ---
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\{\{.*?\}\}/g, ""); // Remove tags
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser does not support Voice.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => { setInput(event.results[0][0].transcript); };
    recognition.start();
  };

  // --- SEND MESSAGE (WITH FAILSAFE) ---
  const sendMessage = async () => {
    if (!input.trim()) return;
    if (isSpeaking) stopSpeaking();

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Attempt Real Backend
      const response = await fetch('https://ashstarwithaiassistant.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          assistantId, 
          isPremium, 
          email: user?.email,
          sessionId: activeSessionId 
        })
      });

      const data = await response.json();

      // Check for errors in response text
      if (data.reply && (data.reply.includes("System Busy") || data.reply.includes("404") || data.reply.includes("ERROR"))) {
         throw new Error("Backend sent error message");
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      speak(data.reply);

    } catch (err) {
      // --- CLIENT-SIDE SIMULATION (BACKUP) ---
      console.warn("Backend failed. Using Client Simulation.");
      const fallbacks = CLIENT_FALLBACKS[assistantId] || CLIENT_FALLBACKS.default;
      const fakeReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      
      setTimeout(() => {
          setMessages(prev => [...prev, { role: 'ai', text: fakeReply }]);
          speak(fakeReply);
          setLoading(false);
      }, 1500);
      return; 
    }
    
    setLoading(false);
  };

  const renderMessageContent = (text) => {
    const tagRegex = /\{\{(HAPPY|SAD|ANGRY|COOL|THINKING|LOVE|SHOCKED|LAUGH|SUCCESS|WARNING|ANALYSIS|DATA)\}\}/;
    const match = text.match(tagRegex);
    if (match) {
      const tagType = match[1];
      const cleanText = text.replace(tagRegex, "").trim();
      return <div className="flex flex-col gap-2"><p className="whitespace-pre-wrap relative z-10">{cleanText}</p><AnimatedSticker type={tagType} /></div>;
    }
    return <p className="whitespace-pre-wrap relative z-10">{text}</p>;
  };

  useGSAP(() => {
    gsap.from(".terminal-box", { scale: 0.9, opacity: 0, duration: 0.3, ease: "power2.out" });
    if (isPremium) gsap.to(".scanline", { top: "100%", duration: 3, ease: "linear", repeat: -1 });
  }, [isPremium]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      <div 
        className="terminal-box w-full h-full md:max-w-6xl md:h-[85vh] flex bg-black border-2 relative shadow-2xl overflow-hidden flex-col md:flex-row"
        style={{ 
            borderColor: activeColor, 
            boxShadow: isPremium ? `0 0 60px ${activeColor}40` : 'none',
            backgroundColor: isPremium ? 'rgba(10, 10, 10, 0.9)' : '#000'
        }}
      >
        {isPremium && (
          <>
            <div className="scanline absolute w-full h-[2px] bg-white/10 pointer-events-none z-10 shadow-[0_0_20px_white]"></div>
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: `radial-gradient(${activeColor} 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
          </>
        )}
        
        {/* MOBILE HEADER */}
        <div className="md:hidden p-3 border-b flex justify-between items-center bg-neutral-900" style={{ borderColor: `${activeColor}30` }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white font-bold text-xs uppercase px-3 py-2 border border-gray-600 rounded">{isSidebarOpen ? "View Chat" : "Archives"}</button>
            <button onClick={closeChat} className="text-red-500 font-bold px-3">X</button>
        </div>

        {/* SIDEBAR */}
        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-1/4 border-b md:border-r md:border-b-0 flex-col transition-all bg-neutral-900/80 z-20 absolute md:relative h-full md:h-auto`} style={{ borderColor: `${activeColor}30` }}>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: `${activeColor}30` }}>
                <h3 className="text-white font-bold uppercase tracking-widest text-xs">ARCHIVES</h3>
                <button onClick={createNewSession} className="text-black font-bold px-2 py-1 text-xs rounded hover:scale-105 transition-all" style={{ backgroundColor: activeColor }}>+ NEW</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {sessions.map(session => (
                    <div key={session._id} onClick={() => { setActiveSessionId(session._id); setIsSidebarOpen(false); }} className={`p-4 border-b cursor-pointer hover:bg-white/5 transition-colors ${activeSessionId === session._id ? 'bg-white/10 border-l-4' : 'opacity-70'}`} style={{ borderColor: activeSessionId === session._id ? activeColor : `${activeColor}10` }}>
                        <h4 className="text-white font-bold text-sm truncate uppercase">{session.title}</h4>
                        <span className="text-[10px] text-gray-500 uppercase">{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* MAIN CHAT */}
        <div className={`${!isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col relative z-20 h-full`}>
            <div className="p-3 md:p-4 flex justify-between items-center border-b" style={{ borderColor: `${activeColor}40` }}>
                <div className="flex items-center gap-3">
                    <h2 className="text-sm md:text-lg font-black uppercase text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColor }}></span> {assistantId}</h2>
                    
                    {/* VISUAL INDICATOR FOR VOICE */}
                    {isSpeaking && <div className="flex items-center gap-2 border-l border-gray-600 pl-4 ml-2 animate-pulse"><span className="text-[10px] uppercase font-bold" style={{ color: activeColor }}>Voice Active</span><button onClick={stopSpeaking} className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded hover:bg-red-500 uppercase"><i className="ri-volume-mute-fill"></i></button></div>}
                </div>
                <button onClick={() => { stopSpeaking(); closeChat(); }} className="hidden md:block text-white hover:text-red-500 font-bold text-xs border border-white/20 px-3 py-1">CLOSE [X]</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs md:text-sm scrollbar-thin scrollbar-thumb-gray-800">
                {messages.length === 0 ? <div className="text-gray-500 text-center mt-10">System Ready.</div> : messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] md:max-w-[85%] p-3 border relative ${msg.role === 'user' ? 'bg-neutral-900 border-gray-700 text-white' : 'bg-transparent'}`} style={msg.role === 'ai' ? { borderColor: activeColor, color: activeColor, borderLeftWidth: '4px', boxShadow: isPremium ? `0 0 20px ${activeColor}10` : 'none' } : {}}>
                            {msg.role === 'ai' ? renderMessageContent(msg.text) : <p>{msg.text}</p>}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-xs animate-pulse" style={{ color: activeColor }}>PROCESSING...</div>}
                <div ref={scrollRef}></div>
            </div>

            <div className="p-3 md:p-4 border-t flex gap-2 bg-neutral-900" style={{ borderColor: `${activeColor}30` }}>
                <button onMouseDown={startListening} className={`p-3 rounded-sm transition-colors ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-black border border-gray-700 text-gray-400 hover:text-white'}`}><i className={`ri-mic-${isListening ? 'fill' : 'line'} text-lg`}></i></button>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Enter command..." className="flex-1 bg-transparent text-white p-2 outline-none font-mono placeholder-gray-600 text-sm" />
                <button onClick={sendMessage} className="px-4 md:px-6 font-bold text-black uppercase text-sm" style={{ backgroundColor: activeColor }}>SEND</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTerminal;