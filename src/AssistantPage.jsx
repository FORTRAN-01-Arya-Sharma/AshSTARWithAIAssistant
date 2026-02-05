import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from 'lenis';
import { assistantsData } from './assistantsData';
import ChatTerminal from './components/ChatTerminal';
import PaymentModal from './components/PaymentModal';
import { useAuth } from './context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const AssistantPage = () => {
    const { id } = useParams();
    const rawData = assistantsData[id]; 
    const lenisRef = useRef(null);
    
    // Auth & State
    const { user, logout, upgradeToPremium, setIsModalOpen } = useAuth();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isPayOpen, setIsPayOpen] = useState(false);
    
    // Review State
    const [reviews, setReviews] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [newRating, setNewRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Premium Logic
    const isPremium = user?.isPremium || false;
    
    // --- FIX: USE MEMOIZATION TO PREVENT RE-RENDERS ON TYPING ---
    // This ensures 'data' remains the same object unless ID or Premium status changes.
    const data = useMemo(() => {
        if (!rawData) return null;
        const themeColor = isPremium ? "#FFD700" : rawData.themeColor;
        return { ...rawData, themeColor };
    }, [id, isPremium, rawData]);

    // 1. FETCH REVIEWS
    useEffect(() => {
        if (!id) return;
        fetch(`https://ashstarwithaiassistant.onrender.com/api/reviews/${id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setReviews(data);
            })
            .catch(err => console.error("Review fetch error:", err));
    }, [id]);

    // 2. HANDLE REVIEW SUBMIT
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("You must be logged in to leave intel.");
        if (!newComment.trim()) return alert("Intel cannot be empty.");

        setIsSubmitting(true);
        try {
            const res = await fetch('https://ashstarwithaiassistant.onrender.com/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assistantId: id,
                    userName: user.name,
                    userEmail: user.email,
                    rating: newRating,
                    comment: newComment
                })
            });
            const savedReview = await res.json();
            setReviews([savedReview, ...reviews]);
            setNewComment("");
        } catch (err) {
            alert("Transmission Failed. Check Server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. SCROLL SETUP
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        lenisRef.current = lenis;

        lenis.scrollTo(0, { immediate: true });
        window.scrollTo(0, 0);

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, [id]); // Only re-run if ID changes

    // 4. ANIMATIONS
    useGSAP(() => {
        if (!data) return;

        const tl = gsap.timeline();

        // Hero Animations
        tl.from(".hero-tagline", { y: -20, opacity: 0, duration: 0.8, delay: 0.2 })
            .from(".hero-title", { y: 50, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.6")
            .from(".hero-desc", { x: -30, opacity: 0, duration: 0.8 }, "-=0.6")
            .from(".hero-btn", { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.4")
            .from(".hero-img", { x: 100, opacity: 0, duration: 1.2, ease: "power4.out" }, "-=1");

        // Scroll Triggers
        gsap.from(".feature-card", {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            scrollTrigger: {
                trigger: ".features-section",
                start: "top 80%",
            }
        });

    }, [data]); // Now this only runs when 'data' genuinely changes, NOT when typing.

    if (!data) return <div className="bg-black text-white h-screen flex items-center justify-center">Assistant Not Found</div>;

    return (
        <div className="w-full min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-yellow-400 selection:text-black">

            {/* BACKGROUND GLOW */}
            <div
                className="fixed top-0 left-0 w-full h-full opacity-20 pointer-events-none z-0"
                style={{ background: `radial-gradient(circle at 60% 40%, ${data.themeColor}, transparent 60%)` }}
            />

            {/* NAVBAR */}
            <nav className="relative z-[100] p-6 md:p-10 flex justify-between items-center">
                <Link to="/" className="text-xl md:text-2xl font-bold italic text-white hover:text-gray-300 transition-colors flex items-center gap-2 group">
                    <i className="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i> BACK
                </Link>
                
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter block md:hidden">ASHSTAR</h2>

                <div className="hidden md:flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-3 bg-black/60 p-2 pr-4 rounded-full border border-gray-600 backdrop-blur-md">
                            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                            <div className="flex flex-col items-start leading-none">
                                <Link to="/dashboard" className="text-white font-bold uppercase text-xs mb-[2px] hover:text-yellow-400">{user.name}</Link>
                                <button onClick={logout} className="text-[10px] font-black uppercase text-red-500 hover:text-white cursor-pointer relative z-[101]">LOGOUT</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsModalOpen(true)} className="border-2 border-white px-6 py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-all">Login</button>
                    )}
                </div>
            </nav>

            {/* HERO SECTION */}
            <div className="relative z-10 container mx-auto px-6 flex flex-col-reverse md:flex-row items-center min-h-[85vh]">
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start justify-center pt-10 md:pt-0 text-center md:text-left order-2 md:order-1">
                    <h3 className="hero-tagline text-xl md:text-3xl font-bold uppercase tracking-widest mb-4" style={{ color: data.themeColor }}>
                        {isPremium ? "PREMIUM ACCESS GRANTED" : data.tagline}
                    </h3>
                    
                    <h1 className="hero-title text-5xl md:text-8xl lg:text-[7rem] font-black uppercase leading-[0.9] mb-8 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                        style={isPremium ? { textShadow: `0 0 40px ${data.themeColor}50` } : {}}
                    >
                        {data.title}
                    </h1>
                    <p className="hero-desc text-white text-base md:text-xl border-none md:border-l-4 pl-0 md:pl-6 mb-10 max-w-lg leading-relaxed font-medium" style={{ borderColor: data.themeColor }}>
                        {data.description}
                    </p>

                    <div className="hero-btn flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                        <button
                            onClick={() => {
                                if (!user) { alert("Please Login First!"); setIsModalOpen(true); } 
                                else if (!isPremium) { setIsPayOpen(true); }
                            }}
                            disabled={isPremium} 
                            className={`px-8 py-4 text-xl font-bold text-black uppercase hover:scale-105 transition-transform duration-300 shadow-lg flex items-center justify-center gap-2 ${isPremium ? 'cursor-default' : 'cursor-pointer'}`}
                            style={{ backgroundColor: data.themeColor }}
                        >
                            {isPremium ? <><i className="ri-vip-crown-2-fill"></i> Premium Active</> : <>Unlock System <i className="ri-lock-unlock-line ml-2"></i></>}
                        </button>

                        <button onClick={() => setIsChatOpen(true)} className="px-8 py-4 text-xl font-bold border-2 text-white uppercase hover:bg-white/10 transition-colors duration-300 flex items-center justify-center gap-2" style={{ borderColor: isPremium ? data.themeColor : 'white', color: isPremium ? data.themeColor : 'white' }}>
                            <i className="ri-terminal-box-line"></i> Launch Terminal
                        </button>
                    </div>
                </div>

                <div className="w-full md:w-1/2 flex justify-center items-center h-[40vh] md:h-[80vh] order-1 md:order-2 mb-8 md:mb-0 relative">
                     <div className="w-full h-full flex justify-center items-center hero-img">
                        <img src={data.heroImage} alt={data.title} className="max-h-full w-auto object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.15)]" />
                     </div>
                </div>
            </div>

            {/* FEATURES SECTION (Fixed Alignment) */}
            <div className="features-section relative z-10 bg-neutral-900/50 py-20 backdrop-blur-sm border-t border-white/10">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl md:text-6xl font-black uppercase mb-16 text-center">
                        System <span style={{ color: data.themeColor }}>Capabilities</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {data.features.map((feat, index) => (
                            <div key={index} className="feature-card h-full bg-black p-8 border-b-4 hover:-translate-y-2 transition-transform duration-300 group flex flex-col justify-between" style={{ borderColor: data.themeColor }}>
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black mb-4 uppercase text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-500 transition-all">0{index + 1}. {feat.title}</h3>
                                    <p className="text-gray-400 text-base md:text-lg">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* REVIEWS SECTION (Inputs work now) */}
            <div className="relative z-10 py-24 container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
                
                {/* Submit Review */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-8 text-center md:text-left">Submit <span style={{ color: data.themeColor }}>Intel</span></h2>
                    
                    <div className="bg-black/50 border border-gray-700 p-8 rounded-lg">
                        <div className="flex gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <i 
                                    key={star}
                                    onClick={() => setNewRating(star)}
                                    className={`ri-star-fill text-3xl cursor-pointer transition-colors ${star <= newRating ? 'text-yellow-400' : 'text-gray-600'}`}
                                ></i>
                            ))}
                        </div>
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Enter your operational report..."
                            className="w-full bg-neutral-900 text-white p-4 border border-gray-700 outline-none h-32 mb-4 font-mono text-sm resize-none"
                        ></textarea>
                        <button 
                            onClick={handleReviewSubmit}
                            disabled={isSubmitting}
                            className="w-full py-3 font-black text-black uppercase hover:scale-105 transition-transform"
                            style={{ backgroundColor: data.themeColor }}
                        >
                            {isSubmitting ? "TRANSMITTING..." : "SUBMIT REPORT"}
                        </button>
                    </div>
                </div>

                {/* Reviews List */}
                <div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase mb-10 text-center md:text-left">Field <span style={{ color: data.themeColor }}>Reports</span></h2>
                    <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800">
                        {reviews.length === 0 ? (
                            <div className="text-gray-500 italic p-4 border border-gray-800 rounded">No reports filed yet. Be the first agent.</div>
                        ) : (
                            reviews.map((rev, i) => (
                                <div key={i} className="bg-neutral-800/50 p-6 border-l-4 backdrop-blur-md" style={{ borderColor: data.themeColor }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-black uppercase text-white tracking-widest text-sm">{rev.userName}</h4>
                                        <div className="flex gap-1" style={{ color: data.themeColor }}>{[...Array(rev.rating)].map((_, i) => <i key={i} className="ri-star-fill text-xs"></i>)}</div>
                                    </div>
                                    <p className="italic text-gray-300 text-base leading-relaxed">"{rev.comment}"</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {isChatOpen && <ChatTerminal assistantId={data.id} themeColor={data.themeColor} isPremium={isPremium} closeChat={() => setIsChatOpen(false)} />}
            {isPayOpen && <PaymentModal themeColor={rawData.themeColor} onClose={() => setIsPayOpen(false)} onSuccess={() => { upgradeToPremium(); setIsPayOpen(false); alert("WELCOME TO THE ELITE. SYSTEM UPGRADED."); }} />}

        </div>
    );
};

export default AssistantPage;