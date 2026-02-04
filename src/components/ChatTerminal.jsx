import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// --- STICKER MAP ---
const STICKER_MAP = {
  HAPPY: "https://media.giphy.com/media/l4pTfx2qLSznOzbQV/giphy.gif",
  SAD: "https://media.giphy.com/media/OPU6pZ2CV0o4/giphy.gif",
  ANGRY: "https://media.giphy.com/media/11tTNkNy1SdXGg/giphy.gif",
  COOL: "https://media.giphy.com/media/gcwmXVGGZntTkWz8R/giphy.gif",
  THINKING: "https://media.giphy.com/media/d3mlE7uhX8KFgEmY/giphy.gif",
  LOVE: "https://media.giphy.com/media/R6gvnAxj2ISzJdbA63/giphy.gif",
  SHOCKED: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  LAUGH: "https://media.giphy.com/media/9tovFud6tYzNXSBb6r/giphy.gif",
  SUCCESS: "https://media.giphy.com/media/tf9jjMcO77YzV4YPwE/giphy.gif",
  WARNING: "https://media.giphy.com/media/8L0Pky6C83SzkzU55a/giphy.gif"
};

const AnimatedSticker = ({ type }) => {
  const url = STICKER_MAP[type] || STICKER_MAP.HAPPY;
  return <div className="mt-2 inline-block"><img src={url} alt={type} className="w-20 h-20 object-contain drop-shadow-2xl" /></div>;
};

const ChatTerminal = ({ assistantId, themeColor, closeChat, isPremium }) => {
  const { user } = useAuth();
  const activeColor = isPremium ? "#FFD700" : themeColor;
  
  // --- STATES ---
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const scrollRef = useRef(null);

  // --- CLEANUP ---
  useEffect(() => { return () => { window.speechSynthesis.cancel(); }; }, []);

  // --- 1. INITIAL LOAD: FETCH SESSIONS ---
  useEffect(() => {
    if (!user?.email) return;
    const fetchSessions = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${user.email}/${assistantId}`);
            const data = await res.json();
            setSessions(data);
            
            if (data.length > 0) {
                setActiveSessionId(data[0]._id);
            } else {
                createNewSession();
            }
        } catch (e) { console.error(e); }
    };
    fetchSessions();
  }, [assistantId, user]);

  // --- 2. LOAD CHAT HISTORY ---
  useEffect(() => {
    if (!activeSessionId) return;
    const fetchChat = async () => {
        setMessages([]); 
        try {
            const res = await fetch(`http://localhost:5000/api/chat/${activeSessionId}`);
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
    const title = prompt("Enter Section Name (e.g., 'Diet Plan'):", "New Operation");
    if (!title) return;
    try {
        const res = await fetch('http://localhost:5000/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, assistantId, title })
        });
        const newSession = await res.json();
        setSessions([newSession, ...sessions]); 
        setActiveSessionId(newSession._id); 
    } catch (e) { alert("Failed to create session"); }
  };

  // --- VOICE ---
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\{\{.*?\}\}/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); };

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

  // --- ANIMATIONS ---
  useGSAP(() => {
    gsap.from(".terminal-box", { scale: 0.9, opacity: 0, duration: 0.3, ease: "power2.out" });
    if (isPremium) gsap.to(".scanline", { top: "100%", duration: 3, ease: "linear", repeat: -1 });
  }, [isPremium]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // --- SEND MESSAGE ---
  const sendMessage = async () => {
    if (!input.trim()) return;
    if (isSpeaking) stopSpeaking();

    const newMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
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
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
      speak(data.reply);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "CONNECTION ERROR." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (text) => {
    const tagRegex = /\{\{(HAPPY|SAD|ANGRY|COOL|THINKING|LOVE|SHOCKED|LAUGH|SUCCESS|WARNING)\}\}/;
    const match = text.match(tagRegex);
    if (match) {
      const tagType = match[1];
      const cleanText = text.replace(tagRegex, "").trim();
      return <div className="flex flex-col gap-2"><p className="whitespace-pre-wrap relative z-10">{cleanText}</p><AnimatedSticker type={tagType} /></div>;
    }
    return <p className="whitespace-pre-wrap relative z-10">{text}</p>;
  };

 return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4">
      
      {/* CONTAINER */}
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
        
        {/* --- MOBILE HEADER FOR SIDEBAR TOGGLE --- */}
        <div className="md:hidden p-3 border-b flex justify-between items-center bg-neutral-900" style={{ borderColor: `${activeColor}30` }}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white font-bold text-xs uppercase px-3 py-2 border border-gray-600 rounded">
                {isSidebarOpen ? "View Chat" : "Archives"}
            </button>
            <button onClick={closeChat} className="text-red-500 font-bold px-3">X</button>
        </div>

        {/* --- LEFT SIDEBAR (SESSIONS) --- */}
        <div className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-1/4 border-b md:border-r md:border-b-0 flex-col transition-all bg-neutral-900/80 z-20 absolute md:relative h-full md:h-auto`} style={{ borderColor: `${activeColor}30` }}>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: `${activeColor}30` }}>
                <h3 className="text-white font-bold uppercase tracking-widest text-xs">ARCHIVES</h3>
                <button onClick={createNewSession} className="text-black font-bold px-2 py-1 text-xs rounded hover:scale-105 transition-all" style={{ backgroundColor: activeColor }}>
                    + NEW
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {sessions.map(session => (
                    <div 
                        key={session._id}
                        onClick={() => { setActiveSessionId(session._id); setIsSidebarOpen(false); }} // Close sidebar on mobile select
                        className={`p-4 border-b cursor-pointer hover:bg-white/5 transition-colors ${activeSessionId === session._id ? 'bg-white/10 border-l-4' : 'opacity-70'}`}
                        style={{ borderColor: activeSessionId === session._id ? activeColor : `${activeColor}10` }}
                    >
                        <h4 className="text-white font-bold text-sm truncate uppercase">{session.title}</h4>
                        <span className="text-[10px] text-gray-500 uppercase">{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* --- RIGHT MAIN CHAT --- */}
        <div className={`${!isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-1 flex-col relative z-20 h-full`}>
            
            {/* HEADER */}
            <div className="p-3 md:p-4 flex justify-between items-center border-b" style={{ borderColor: `${activeColor}40` }}>
                <div className="flex items-center gap-3">
                    <h2 className="text-sm md:text-lg font-black uppercase text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColor }}></span>
                        {assistantId}
                    </h2>
                </div>
                <button onClick={() => { stopSpeaking(); closeChat(); }} className="hidden md:block text-white hover:text-red-500 font-bold text-xs border border-white/20 px-3 py-1">CLOSE [X]</button>
            </div>

            {/* CHAT MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs md:text-sm scrollbar-thin scrollbar-thumb-gray-800">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div 
                            className={`max-w-[90%] md:max-w-[85%] p-3 border relative ${msg.role === 'user' ? 'bg-neutral-900 border-gray-700 text-white' : 'bg-transparent'}`}
                            style={msg.role === 'ai' ? { borderColor: activeColor, color: activeColor, borderLeftWidth: '4px', boxShadow: isPremium ? `0 0 20px ${activeColor}10` : 'none' } : {}}
                        >
                            {msg.role === 'ai' ? renderMessageContent(msg.text) : <p>{msg.text}</p>}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-xs animate-pulse" style={{ color: activeColor }}>PROCESSING...</div>}
                <div ref={scrollRef}></div>
            </div>

            {/* INPUT */}
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