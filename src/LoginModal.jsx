import React, { useState, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const avatars = [
    "/character.png",
    "/pose.png",
    "/meSitting.png",
    "/TaskMaster.png",
    "/IdeaForge.png"
];

const LoginModal = () => {
    const { isModalOpen, setIsModalOpen, login, allUsers, checkEmailExists } = useAuth();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);

    useGSAP(() => {
        if (isModalOpen) {
            gsap.fromTo(".login-box",
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
            );
        }
    }, [isModalOpen]);

    // Handle Image Upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSelectedAvatar(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Handle typing in email field
    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);

        // Check if this email matches an existing user
        const existing = checkEmailExists(val);
        if (existing) {
            setName(existing.name); // Auto-fill name
            setSelectedAvatar(existing.avatar); // Auto-select their avatar
            setError("Welcome back! Details auto-filled.");
        } else {
            setError("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email) return alert("Fill in all details!");

        // Login (Context handles saving/updating)
        login(name, email, selectedAvatar);
    };

    // Quick Login Handler
    const handleQuickLogin = (u) => {
        login(u.name, u.email, u.avatar);
    }

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto py-10">
            <div className="login-box bg-neutral-900 border-2 border-yellow-400 p-8 w-full max-w-md relative shadow-[0_0_50px_rgba(251,191,36,0.2)] rounded-lg">

                <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <i className="ri-close-line text-2xl"></i>
                </button>

                <h2 className="text-3xl font-black text-white uppercase mb-1">Identity <span className="text-yellow-400">Log</span></h2>
                <p className="text-gray-400 mb-6 text-sm border-b border-gray-800 pb-4">Secure AshStar Mainframe Access</p>

                {/* --- RECENT ACCOUNTS SECTION --- */}
                {allUsers.length > 0 && (
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Resume</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {allUsers.map((u, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleQuickLogin(u)}
                                    className="flex flex-col items-center gap-2 cursor-pointer group min-w-[70px]"
                                >
                                    <img
                                        src={u.avatar}
                                        className="w-14 h-14 rounded-full border-2 border-gray-700 group-hover:border-yellow-400 object-cover transition-colors"
                                        alt={u.name}
                                    />
                                    <span className="text-[10px] text-gray-400 font-bold uppercase truncate w-full text-center group-hover:text-white">{u.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-[1px] w-full bg-gray-800 mt-2"></div>
                    </div>
                )}

                {/* --- LOGIN FORM --- */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Email Input (First, to check existence) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="tommy@vicecity.com"
                            className="w-full bg-black border border-gray-700 p-3 text-white font-bold outline-none focus:border-yellow-400 transition-colors rounded-sm"
                        />
                        {error && <p className="text-green-500 text-xs mt-1 font-bold italic"><i className="ri-check-double-line"></i> {error}</p>}
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Codename</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="TOMMY VERCETTI"
                            className="w-full bg-black border border-gray-700 p-3 text-white font-bold outline-none focus:border-yellow-400 transition-colors rounded-sm"
                        />
                    </div>

                    {/* Avatar Section */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Identity</label>

                        <div className="flex flex-wrap gap-3 mb-3">
                            {avatars.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt="avatar"
                                    onClick={() => setSelectedAvatar(img)}
                                    className={`w-12 h-12 object-cover object-top rounded-full cursor-pointer border-2 transition-all hover:scale-110 ${selectedAvatar === img ? "border-yellow-400 opacity-100" : "border-gray-700 opacity-50"}`}
                                />
                            ))}

                            <div
                                onClick={() => fileInputRef.current.click()}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer hover:border-yellow-400 hover:text-yellow-400 text-gray-500 transition-all"
                                title="Upload from PC"
                            >
                                <i className="ri-upload-cloud-line text-xl"></i>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-yellow-400 text-black font-black uppercase py-3 mt-2 hover:bg-white transition-colors tracking-widest text-lg rounded-sm shadow-lg"
                    >
                        {checkEmailExists(email) ? "Resume Session" : "Initialize New ID"}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default LoginModal;