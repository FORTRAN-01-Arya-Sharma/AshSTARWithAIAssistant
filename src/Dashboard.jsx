import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalMessages: 0, missionsPassed: 0, isPremium: false });

  const data = [
    { name: 'TaskMaster', uv: 4000 },
    { name: 'FitMentor', uv: 3000 },
    { name: 'CodeBuddy', uv: 2000 },
    { name: 'IdeaForge', uv: 2780 },
    { name: 'Companion', uv: 1890 },
  ];

  useEffect(() => {
    if(user?.email) {
        fetch(`https://ashstarwithaiassistant.onrender.com/api/stats/${user.email}`)
            .then(res => res.json())
            .then(data => setStats(data));
    }
  }, [user]);

  if (!user) return <div className="h-screen bg-black text-white flex items-center justify-center"><h1>ACCESS DENIED. LOGIN REQUIRED.</h1></div>;

  return (
    // FIX 1: MAIN WRAPPER - Fixed position + Internal Scroll
    // 'fixed inset-0' makes it fill screen. 'overflow-y-auto' forces scrolling.
    <div className="fixed inset-0 z-[50] bg-neutral-900 text-white font-sans overflow-y-auto overflow-x-hidden">
      
      {/* CONTENT CONTAINER - Added padding bottom to ensure scroll reaches end */}
      <div className="w-full min-h-full p-6 md:p-10 pb-40">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 border-b-2 border-gray-700 pb-4 gap-4 md:gap-0">
            <div>
                <h1 className="text-4xl md:text-6xl font-black uppercase leading-tight">The <span className="text-green-500">Safehouse</span></h1>
                <p className="text-gray-400 tracking-widest mt-2 text-sm md:text-base uppercase">WELCOME BACK, {user.name}</p>
            </div>
            <Link to="/" className="text-lg md:text-xl font-bold hover:text-green-500 flex items-center gap-2">
                <i className="ri-arrow-left-line"></i> EXIT TO CITY
            </Link>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-black p-6 border-l-4 border-green-500 shadow-lg">
                <h3 className="text-gray-500 font-bold uppercase text-xs md:text-sm mb-2">Total Transmissions</h3>
                <p className="text-4xl md:text-5xl font-black">{stats.totalMessages}</p>
            </div>
            <div className="bg-black p-6 border-l-4 border-blue-500 shadow-lg">
                <h3 className="text-gray-500 font-bold uppercase text-xs md:text-sm mb-2">Missions Passed</h3>
                <p className="text-4xl md:text-5xl font-black">{stats.missionsPassed}</p>
            </div>
            <div className="bg-black p-6 border-l-4 border-yellow-500 shadow-lg">
                <h3 className="text-gray-500 font-bold uppercase text-xs md:text-sm mb-2">Account Status</h3>
                <p className="text-3xl md:text-4xl font-black text-yellow-400">{stats.isPremium ? "ELITE / PREMIUM" : "STANDARD"}</p>
            </div>
        </div>

        {/* GRAPH SECTION */}
        <div className="mb-12">
            <h3 className="text-gray-400 font-bold uppercase text-sm mb-4 tracking-widest">Activity Log</h3>
            <div className="bg-black p-4 md:p-8 border border-gray-800 h-[300px] md:h-[400px] rounded-md w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#555" fontSize={10} tick={{fill: '#888'}} />
                    <YAxis stroke="#555" fontSize={10} tick={{fill: '#888'}} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }} 
                        itemStyle={{ color: '#fff' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="uv" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* INVENTORY */}
        <h2 className="text-2xl md:text-3xl font-black uppercase mb-6">Inventory</h2>
        <div className="flex flex-wrap gap-4">
            {['TaskMaster', 'FitMentor', 'CodeBuddy', 'IdeaForge', 'Companion'].map((ai, i) => (
                <div key={i} className="bg-black border border-gray-800 p-4 w-[45%] md:w-40 text-center opacity-75 hover:opacity-100 hover:border-white transition-all cursor-pointer rounded-sm flex-grow md:flex-grow-0">
                    <i className="ri-robot-2-line text-3xl md:text-4xl mb-2 block text-gray-300"></i>
                    <span className="font-bold uppercase text-xs md:text-sm text-gray-400 hover:text-white">{ai}</span>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;