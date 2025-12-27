import React, { useState, useRef, useLayoutEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from 'lenis'
import 'remixicon/fonts/remixicon.css'
import AssistantPage from './AssistantPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginModal from './LoginModal';

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);



// --- HELPER: SCROLL TO TOP ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const Home = () => {
  // 1. Session Logic
  const hasSeenIntro = sessionStorage.getItem("ashstar_intro_seen") === "true";
  let [showContent, setShowContent] = useState(hasSeenIntro);
  let [introFinished, setIntroFinished] = useState(hasSeenIntro);

  const lenisRef = useRef(null);

  // --- FIX: ACCESS AUTH CONTEXT HERE ---
  // This was likely missing in your code, causing the "user is not defined" error
  const { user, setIsModalOpen, logout } = useAuth();

  const handleScrollDown = () => {
    if (lenisRef.current) {
      const sections = document.querySelectorAll('.page-section');
      const currentScroll = window.scrollY;
      let nextSection = null;
      for (let i = 0; i < sections.length; i++) {
        const sectionTop = sections[i].offsetTop;
        if (sectionTop > currentScroll + 10) {
          nextSection = sections[i];
          break;
        }
      }
      if (nextSection) {
        lenisRef.current.scrollTo(nextSection, { offset: 0, duration: 1.5 });
      }
    }
  };
  // --- LENIS SMOOTH SCROLL SETUP ---
  useGSAP(() => {
    if (showContent) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);

      return () => {
        gsap.ticker.remove(lenis.raf);
        lenis.destroy();
        lenisRef.current = null;
      };
    }
  }, [showContent]);


  // --- 1. PRELOADER ANIMATION (The "VI" Mask) ---
  useGSAP(() => {
    if (introFinished) return; // SKIP if already seen

    const tl = gsap.timeline();

    tl.to(".vi-mask-group", {
      rotate: 10,
      duration: 1.5,
      ease: "power4.inOut",
      transformOrigin: "50% 50%",
    })
      .to(".vi-mask-group", {
        scale: 25,
        duration: 2,
        delay: -0.5,
        ease: "power2.inOut",
        transformOrigin: "50% 50%",
        onUpdate: function () {
          if (this.progress() >= 0.6 && !showContent) {
            setShowContent(true);
          }
        },
        onComplete: function () {
          setIntroFinished(true);
          // SAVE TO STORAGE: Remember that we have seen the intro
          sessionStorage.setItem("ashstar_intro_seen", "true");
        }
      });
  }, []);


  // --- 2. ENTRY ANIMATION (Zoom out effect) ---
  useGSAP(() => {
    if (!showContent) return;

    const landingTl = gsap.timeline();

    // Elements start large and zoom out
    landingTl.from(".landing video, .landing img[alt='Foreground elements']", {
      scale: 1.4,
      duration: 2,
      ease: "expo.inOut",
      stagger: 0.1
    }, "start");

    // Character slides up
    landingTl.from(".landing img[alt='Character']", {
      scale: 1.8,
      y: "30%",
      duration: 2,
      ease: "expo.inOut"
    }, "start");

    // Text fades in and slides up
    landingTl.from(".landing .text", {
      scale: 1.5,
      y: 50,
      opacity: 0,
      duration: 2,
      ease: "expo.inOut"
    }, "start+=0.2");

    // UI elements fade in
    landingTl.from(".navbar, .scroll-btn, .ps5-logo", {
      y: -20,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      stagger: 0.2
    }, "-=1");

  }, [showContent]);

  // --- 3. MOUSE MOVE PARALLAX ---
  useGSAP(() => {
    if (showContent) {
      const main = document.querySelector(".main");

      const handleMouseMove = (e) => {
        if (window.innerWidth < 1024) return;

        const xNormalized = e.clientX / window.innerWidth - 0.5;
        const yNormalized = e.clientY / window.innerHeight - 0.5;

        const range = 20;
        const xMove = xNormalized * range;
        const yMove = yNormalized * range;

        gsap.to(".imagesdiv .text", { x: `${xMove * 0.15}%`, y: `${yMove * 0.1}%`, duration: 0.5, ease: "power2.out" });
        gsap.to(".imagesdiv img[alt='Character']", { x: `${xMove * -0.15}%`, y: `${yMove * -0.15}%`, duration: 0.5, ease: "power2.out" });
        gsap.to(".imagesdiv > img:nth-child(2)", { x: `${xMove * -0.05}%`, y: `${yMove * -0.05}%`, duration: 0.5, ease: "power2.out" });
        gsap.to(".imagesdiv video", { x: `${xMove * 0.05}%`, y: `${yMove * 0.05}%`, duration: 0.5, ease: "power2.out" });
      };

      main?.addEventListener("mousemove", handleMouseMove);
      return () => {
        main?.removeEventListener("mousemove", handleMouseMove);
      };
    }
  }, [showContent]);

  return (
    <>
      {/* 
         CRITICAL FIX: 
         We only render the SVG if introFinished is FALSE.
         This lets React handle the removal, preventing the "removeChild" crash.
      */}
      {!introFinished && (
        <div className="svg flex items-center justify-center fixed top-0 left-0 z-[200] w-full h-screen overflow-hidden bg-[#000]">
          <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <defs>
              <mask id="viMask">
                <rect width="100%" height="100%" fill="black" />
                <g className="vi-mask-group">
                  <text x="50%" y="50%" fontSize="250" textAnchor="middle" fill="white" dominantBaseline="middle" fontFamily="Arial Black" className="font-black">VI</text>
                </g>
              </mask>
            </defs>
            <image href="./bg.png" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" mask="url(#viMask)" />
          </svg>
        </div>
      )}

      {showContent && (
        <div className='main w-full relative'>

          {/* --- LANDING SECTION WITH UPDATED NAVBAR --- */}
          <div className='landing w-full h-screen page-section sticky top-0 z-0'>


            <div className='navbar absolute w-full py-5 px-5 md:px-10 bg top-0 left-0 z-[100] flex justify-between items-center'>
              <div className='logo flex gap-5'>
                <div className='lines flex flex-col gap-[7px]'>
                  <div className='line w-10 h-1 bg-white'></div>
                  <div className='line w-8 h-1 bg-white'></div>
                  <div className='line w-6 h-1 bg-white'></div>
                </div>
                <h2 className='text-3xl md:text-4xl -mt-[10px] font-bold font text-white'>AshStar</h2>
              </div>

              {/* LOGIN / PROFILE SECTION */}
              <div className="login-section z-[100]">
                {user ? (
                  <div className="flex items-center gap-4 bg-black/50 p-2 pr-4 rounded-full border border-gray-700 backdrop-blur-sm">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover object-top border-2 border-yellow-400"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <h3 className="text-white font-bold uppercase text-xs leading-none mb-1">{user.name}</h3>

                      {/* LOGOUT BUTTON - Added cursor-pointer and relative positioning */}
                      <button
                        onClick={logout}
                        className="text-red-500 text-[10px] font-black uppercase hover:text-red-400 hover:underline tracking-widest cursor-pointer relative z-[101]"
                      >
                        LOGOUT
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-yellow-400 text-black px-6 py-2 font-black uppercase tracking-wider hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(250,204,21,0.6)] cursor-pointer relative z-[101]"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>

            <div className='imagesdiv relative overflow-hidden w-full h-screen'>
              <div className='absolute inset-0 z-0 scale-[1.3]'><video className='w-full h-full  saturate-1000 object-cover' src="./sky.mp4" autoPlay loop muted /><div className='absolute inset-0 z-10 brightness-100 opacity-30 mix-blend-overlay' /></div>
              <img className='absolute saturate-300 scale-[1.03] top-0 left-0 color to-black w-full h-full object-cover z-20' src="./bg.png" alt="Foreground elements" />
              <div className='text absolute text-pink-50 top-[38%] left-1/2 z-[30] -translate-x-1/2 -translate-y-1/2 w-max flex flex-col gap-1 items-start'>
                <h1 className='text-[15vw] md:text-[9rem] leading-none text-shadow-lg text-shadow-black'>Get</h1>
                <h1 className='text-[15vw] md:text-[9rem] leading-none text-orange-600 text-outline-2 text-shadow-lg text-shadow-black'>Your</h1>
                <h1 className='text-[15vw] md:text-[9rem] leading-none text-shadow-lg text-shadow-black'>Assistant</h1>
                <h1 className='text-[5vw] md:text-[2.5rem] pt-5 leading-none text-black' style={{ textShadow: '1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white' }}>By:-Arya Sharma</h1>
              </div>
              <img className='absolute saturate-175 scale-100 md:scale-[1.75] bottom-0 md:-bottom-[15%] md:right-1/9 transform md:-translate-x-1/2 md:-translate-y-1 h-[60vh] md:h-[95vh] object-contain z-30 filter drop-shadow-[0_30px_35px_rgba(0,0,0,1)]' src="./character.png" alt="Character" />
              <div className='absolute bottom-0 left-0 w-full h-[25vh] bg-gradient-to-t from-black via-black/80 to-transparent z-[35] pointer-events-none'></div>
            </div>

            <img className='ps5-logo absolute bottom-[12%] md:bottom-[5%] left-1/2 -translate-x-1/2 h-[30px] md:h-[40px] z-[40] scale-[1.3] brightness-500 drop-shadow-[0_15px_5px_rgba(0,0,0,2.8)] ' src="./ps5.png" alt="PS5 Logo" />

            <div onClick={handleScrollDown} className='btmbar text-white z-[100] cursor-pointer fixed bottom-0 left-0 w-full py-8 md:py-15 px-5 md:px-10'>
              <div className='scroll-btn flex gap-4 items-center animate-bounce'><i className="ri-arrow-down-line text-2xl md:text-4xl"></i><h3 className='text-xl md:text-3xl text-white'>Scroll</h3></div>
            </div>
          </div>


          {/* SECTION 2: TASKMASTER & IDEAFORGE */}
          <div className='page-section w-full min-h-screen flex relative justify-center items-center bg-black overflow-hidden sticky top-0 z-10 shadow-[0_-50px_100px_rgba(0,0,0,0.8)]'>
            <div className='absolute top-1/2 left-0 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-orange-600/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none'></div>
            <div className='cntnr flex flex-col md:flex-row w-full max-w-[1600px] px-5 md:px-10 h-full py-20 md:py-0 items-center z-10' >
              <div className='LeftImage relative w-full md:w-1/2 h-[50vh] md:h-[80vh] flex justify-center items-center group cursor-pointer mb-10 md:mb-0'>
                <div className='absolute w-[80%] h-[80%] bg-yellow-500/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out'></div>
                <img className='absolute h-full object-contain transition-all duration-700 ease-in-out transform group-hover:opacity-0 group-hover:scale-95 group-hover:blur-sm z-10' src="./meSitting.png" alt="Sitting" />
                <img className='absolute h-full object-contain transition-all duration-700 ease-in-out transform opacity-0 scale-105 group-hover:opacity-100 group-hover:scale-100 z-20' src="./pose.png" alt="Posing" />
              </div>
              <div className='RightImage w-full md:w-1/2 flex flex-col justify-center md:pl-10'>
                <div className='flex flex-col leading-none mb-8 text-center md:text-left'>
                  <h1 className='text-[15vw] md:text-[7rem] font-black tracking-tighter text-gray-200 bg-clip-text bg-gradient-to-r from-white to-gray-700 opacity-90 line-through decoration-red-600' style={{ WebkitTextStroke: '3px #7a2618', textStroke: '5px #7a2618' }}>HARDWORK</h1>


                  <h1 className='text-[15vw] md:text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500 -mt-2 md:-mt-4 opacity-50'>SMARTWORK</h1>
                </div>
                <p className='font-sans text-gray-300 text-base md:text-lg leading-relaxed max-w-full md:max-w-[90%] border-l-0 md:border-l-4 border-yellow-500 pl-0 md:pl-6 mb-6 md:mb-0 text-center md:text-left'>
                  <b className='text-violet-500' >TaskMaster</b> AI is your personal productivity partner designed to help you stay organized and focused.
                </p>

                <div className='flex justify-center md:justify-start my-8'>
                  <Link to="/assistant/taskmaster">
                    <button className='relative overflow-hidden bg-yellow-400 px-8 py-3 text-xl md:text-2xl font-bold text-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors duration-300 group'>
                      <span className='relative z-10'>TaskMaster AI</span>
                      <div className='absolute inset-0 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0'></div>
                    </button>
                  </Link>
                </div>

                <p className='font-sans text-gray-300 text-base md:text-lg leading-relaxed max-w-full md:max-w-[90%] border-l-0 md:border-l-4 border-yellow-500 pl-0 md:pl-6 text-center md:text-left'>
                  <b className='text-violet-500' >IdeaForge AI</b> is built for creators, entrepreneurs, and anyone who needs fresh ideas on demand.
                </p>

                <div className='flex justify-center md:justify-start my-8'>
                  <Link to="/assistant/ideaforge">
                    <button className='relative overflow-hidden bg-yellow-400 px-8 py-3 text-xl md:text-2xl font-bold text-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors duration-300 group'>
                      <span className='relative z-10'>IdeaForge AI</span>
                      <div className='absolute inset-0 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0'></div>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: FITMENTOR & CODEBUDDY */}
          <div className='page-section w-full min-h-screen flex relative justify-center items-center bg-black overflow-hidden pb-20 sticky top-0 z-20 shadow-[0_-50px_100px_rgba(0,0,0,0.8)]'>
            <div className='absolute bottom-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-purple-600/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none'></div>
            <div className='cntnr flex flex-col-reverse md:flex-row w-full max-w-[1600px] px-5 md:px-10 h-full py-20 md:py-0 items-center z-10'>
              <div className='TextContent w-full md:w-1/2 flex flex-col justify-center md:pr-10'>
                <div className='flex flex-col leading-none mb-8 text-center md:text-left'>
                  <h1 className='text-[15vw] md:text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 opacity-90' style={{ WebkitTextStroke: '3px #7a2618', textStroke: '5px #7a2618' }}>Get Your</h1>
                  <h1 className='text-[15vw] md:text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600 brigher -mt-2 md:-mt-4 opacity-50'>Assistant</h1>
                </div>
                <p className='font-sans text-gray-300 text-base md:text-lg leading-relaxed max-w-full md:max-w-[90%] border-l-0 md:border-l-4 border-yellow-500 pl-0 md:pl-6 text-center md:text-left'>
                  <b className='text-orange-500' >FitMentor</b> AI acts as your personal fitness and nutrition coach.
                </p>

                <div className='flex justify-center md:justify-start my-8'>
                  <Link to="/assistant/fitmentor">
                    <button className='relative overflow-hidden bg-yellow-400 px-8 py-3 text-xl md:text-2xl font-bold text-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors duration-300 group'>
                      <span className='relative z-10'>FitMentor AI</span>
                      <div className='absolute inset-0 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0'></div>
                    </button>
                  </Link>
                </div>

                <p className='font-sans text-gray-300 text-base md:text-lg leading-relaxed max-w-full md:max-w-[90%] border-l-0 md:border-l-4 border-yellow-500 pl-0 md:pl-6 text-center md:text-left'>
                  <b className='text-orange-500' >CodeBuddy</b> AI makes learning and coding easier for developers at any level.
                </p>

                <div className='flex justify-center md:justify-start my-8'>
                  <Link to="/assistant/codebuddy">
                    <button className='relative overflow-hidden bg-yellow-400 px-8 py-3 text-xl md:text-2xl font-bold text-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors duration-300 group'>
                      <span className='relative z-10'>CodeBuddy AI</span>
                      <div className='absolute inset-0 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0'></div>
                    </button>
                  </Link>
                </div>

                <p className='font-sans text-gray-300 text-base md:text-lg leading-relaxed max-w-full md:max-w-[90%] border-l-0 md:border-l-4 border-yellow-500 pl-0 md:pl-6 text-center md:text-left'>
                  <b className='text-orange-500'>Companion</b> AI is your friendly conversational partner designed to support, talk, and engage with you anytime.
                </p>

                <div className='flex justify-center md:justify-start my-8'>
                  <Link to="/assistant/companion">
                    <button className='relative overflow-hidden bg-yellow-400 px-8 py-3 text-xl md:text-2xl font-bold text-black uppercase tracking-wider rounded-sm hover:bg-white transition-colors duration-300 group'>
                      <span className='relative z-10'>Companion AI</span>
                      <div className='absolute inset-0 bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 -z-0'></div>
                    </button>
                  </Link>
                </div>
              </div>

              <div className='ImageSide relative w-full md:w-1/2 h-[50vh] md:h-[80vh] flex justify-center items-center group cursor-pointer mb-10 md:mb-0'>
                <div className='absolute w-[80%] h-[80%] bg-purple-500/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out'></div>
                <img className='absolute h-full object-contain transition-all duration-700 ease-in-out transform group-hover:opacity-0 group-hover:scale-95 group-hover:blur-sm z-10' src="./setup.png" alt="Setup" />
                <img className='absolute h-full object-contain transition-all duration-700 ease-in-out transform opacity-0 scale-105 group-hover:opacity-100 group-hover:scale-100 z-20' src="./standing.png" alt="Standing" />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <footer className='relative w-full bg-neutral-900 text-white pt-10 md:pt-20 pb-20 md:pb-32 px-5 md:px-10 overflow-hidden sticky top-0 z-30 shadow-[0_-50px_100px_rgba(0,0,0,0.8)]'>
            <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full text-center select-none pointer-events-none opacity-[0.03]'>
              <h1 className='text-[18vw] font-black leading-none'>ASHSTAR</h1>
            </div>
            <div className='cntnr max-w-[1600px] mx-auto relative z-10'>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-10 md:pb-16 mb-10 md:mb-16'>
                <div className='mb-10 md:mb-0'>
                  <h2 className='text-5xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter mb-4'>
                    Join the <span className='text-yellow-400'>Cult.</span>
                  </h2>
                  <p className='text-gray-400 text-lg md:text-xl max-w-md'>
                    Get exclusive drops, behind-the-scenes content, and early access to new assistants.
                  </p>
                </div>
                <div className='w-full md:w-auto flex flex-col md:items-end'>
                  <div className='flex items-center border-b-2 border-white focus-within:border-yellow-400 transition-colors duration-300 w-full md:w-[400px]'>
                    <input type="email" placeholder="ENTER YOUR EMAIL" className='bg-transparent w-full py-4 text-lg md:text-xl outline-none placeholder-gray-600 font-bold uppercase' />
                    <button className='text-2xl md:text-3xl text-yellow-400 hover:text-white transition-colors duration-300'>
                      <i className="ri-arrow-right-up-line"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className='flex flex-col md:flex-row justify-between items-center text-gray-600 text-xs md:text-sm font-bold uppercase tracking-widest text-center md:text-left gap-4 md:gap-0'>
                <p>&copy; 2024 AshStar Studios. All Rights Reserved.</p>
                <div className='flex gap-8'>
                  <a href="#" className='hover:text-white transition-colors'>Privacy Policy</a>
                  <a href="#" className='hover:text-white transition-colors'>Terms of Service</a>
                </div>
              </div>
            </div>

          </footer>
        </div>
      )}
    </>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <LoginModal /> {/* Modal is placed here so it overlays everything */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/assistant/:id" element={<AssistantPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App






