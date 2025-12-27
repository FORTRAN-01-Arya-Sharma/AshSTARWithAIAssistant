import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from 'lenis';
import { assistantsData } from './assistantsData';

gsap.registerPlugin(ScrollTrigger);

const AssistantPage = () => {
    const { id } = useParams();
    const data = assistantsData[id];
    const lenisRef = useRef(null);

    // 1. SETUP SMOOTH SCROLL & FORCE SCROLL TO TOP
    useEffect(() => {
        // Initialize Lenis for this specific page
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });
        lenisRef.current = lenis;

        // --- CRITICAL FIX: FORCE SCROLL TO TOP IMMEDIATELY ---
        // This ensures you don't land in the middle of the page
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
    }, [id]); // Re-run this whenever the ID changes (e.g., clicking another AI)

    // 2. ENTRY & SCROLL ANIMATIONS
    useGSAP(() => {
        if (!data) return;

        const tl = gsap.timeline();

        // Hero Section Entry Animation (The "Intro")
        tl.from(".hero-tagline", { y: -20, opacity: 0, duration: 0.8, delay: 0.2 })
          .from(".hero-title", { y: 50, opacity: 0, duration: 1, ease: "power4.out" }, "-=0.6")
          .from(".hero-desc", { x: -30, opacity: 0, duration: 0.8 }, "-=0.6")
          .from(".hero-btn", { scale: 0.8, opacity: 0, duration: 0.5, ease: "back.out(1.7)" }, "-=0.4")
          .from(".hero-img", { x: 100, opacity: 0, duration: 1.2, ease: "power4.out" }, "-=1");

        // Scroll Trigger for Features (They pop up as you scroll down)
        gsap.from(".feature-card", {
            y: 50, 
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            scrollTrigger: {
                trigger: ".features-section",
                start: "top 80%", // Triggers when top of section hits 80% of viewport
            }
        });

    }, [data]);

    // Error Handling
    if (!data) return <div className="bg-black text-white h-screen flex items-center justify-center">Assistant Not Found</div>;

    return (
        <div className="w-full min-h-screen bg-black text-white overflow-x-hidden font-sans selection:bg-yellow-400 selection:text-black">

            {/* BACKGROUND GLOW */}
            <div
                className="fixed top-0 left-0 w-full h-full opacity-15 pointer-events-none z-0"
                style={{ background: `radial-gradient(circle at 60% 40%, ${data.themeColor}, transparent 60%)` }}
            />

            {/* NAVBAR */}
            <nav className="relative z-50 p-6 md:p-10 flex justify-between items-center">
                <Link to="/" className="text-xl md:text-2xl font-bold italic text-white hover:text-gray-300 transition-colors flex items-center gap-2 group">
                    <i className="ri-arrow-left-line group-hover:-translate-x-1 transition-transform"></i> BACK TO MAP
                </Link>
                <h2 className="text-3xl font-black uppercase tracking-tighter">ASHSTAR</h2>
            </nav>

            {/* HERO SECTION */}
            <div className="relative z-10 container mx-auto px-6 flex flex-col-reverse md:flex-row items-center min-h-[85vh]">
                
                {/* Text Side */}
                <div className="w-full md:w-1/2 flex flex-col items-start justify-center pt-10 md:pt-0">
                    <h3 className="hero-tagline text-2xl md:text-3xl font-bold uppercase tracking-widest mb-4" style={{ color: data.themeColor }}>
                        {data.tagline}
                    </h3>
                    <h1 className="hero-title text-6xl md:text-8xl lg:text-[7rem] font-black uppercase leading-[0.9] mb-8 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
                        {data.title}
                    </h1>
                    <p className="hero-desc text-gray-300 text-lg md:text-xl border-l-4 pl-6 mb-10 max-w-lg leading-relaxed" style={{ borderColor: data.themeColor }}>
                        {data.description}
                    </p>

                    <div className="hero-btn flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <button
                            className="px-8 py-4 text-xl font-bold text-black uppercase hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            style={{ backgroundColor: data.themeColor }}
                        >
                            Free Trial
                        </button>
                        
                    </div>
                </div>

                {/* Image Side */}
                <div className="w-full md:w-1/2 flex justify-center items-center h-[50vh] md:h-[80vh]">
                    <img
                        src={data.heroImage}
                        alt={data.title}
                        className="hero-img h-full w-full object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.15)]"
                    />
                </div>
            </div>

            {/* FEATURES SECTION */}
            <div className="features-section relative z-10 bg-neutral-900/50 py-20 backdrop-blur-sm border-t border-white/10">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-16 text-center">
                        System <span style={{ color: data.themeColor }}>Capabilities</span>
                    </h2>

                    {/* FIXED: 'items-stretch' ensures all boxes are the same height */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {data.features.map((feat, index) => (
                            <div 
                                key={index} 
                                // FIXED: 'h-full' and 'flex-col justify-between' aligns content perfectly
                                className="feature-card h-full bg-black p-10 border-b-4 hover:-translate-y-2 transition-transform duration-300 group flex flex-col justify-between" 
                                style={{ borderColor: data.themeColor }}
                            >
                                <div>
                                    <h3 className="text-3xl font-black mb-4 uppercase text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-500 transition-all">
                                        0{index + 1}. {feat.title}
                                    </h3>
                                    <p className="text-gray-400 text-lg">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* INFO & REVIEWS SECTION */}
            <div className="relative z-10 py-24 container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20">
                
                {/* How to use */}
                <div>
                    <h2 className="text-4xl font-black uppercase mb-10">Initialize <span style={{ color: data.themeColor }}>Protocol</span></h2>
                    <ul className="space-y-8">
                        {data.howToUse.map((step, i) => (
                            <li key={i} className="flex items-center gap-6 text-xl md:text-2xl font-bold text-gray-300 group">
                                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-800 rounded-full text-white group-hover:scale-110 transition-transform duration-300" style={{boxShadow: `0 0 10px ${data.themeColor}40`}}>
                                    {i + 1}
                                </div>
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Reviews */}
                <div>
                    <h2 className="text-4xl font-black uppercase mb-10">User <span style={{ color: data.themeColor }}>Intel</span></h2>
                    <div className="flex flex-col gap-8">
                        {data.reviews.map((rev, i) => (
                            <div key={i} className="bg-neutral-800/50 p-8 border-l-4 backdrop-blur-md h-full" style={{ borderColor: data.themeColor }}>
                                <div className="flex gap-1 mb-4" style={{ color: data.themeColor }}>
                                    {[...Array(rev.rating)].map((_, i) => <i key={i} className="ri-star-fill text-xl"></i>)}
                                </div>
                                <p className="italic text-gray-300 text-xl mb-6 leading-relaxed">"{rev.comment}"</p>
                                <h4 className="font-black uppercase text-white tracking-widest">- {rev.user}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AssistantPage;