import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// --- CONFIG ---
// REPLACE THIS WITH YOUR EMAIL ID
const ADMIN_EMAIL = "ashgrtz2003@gmail.com"; 

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [replyText, setReplyText] = useState({}); // Store reply text per review ID

    // Security Check: Kick out non-admins
    useEffect(() => {
        if (user && user.email !== ADMIN_EMAIL) {
            alert("SECURITY ALERT: UNAUTHORIZED ACCESS ATTEMPT.");
            navigate('/');
        }
    }, [user, navigate]);

    // Fetch All Reviews
    useEffect(() => {
        if (user?.email === ADMIN_EMAIL) {
            fetch('https://ashstarwithaiassistant.onrender.com/api/admin/reviews')
                .then(res => res.json())
                .then(data => setReviews(data))
                .catch(err => console.error("Admin Fetch Error", err));
        }
    }, [user]);

    // Handle Reply
    const submitReply = async (reviewId) => {
        const text = replyText[reviewId];
        if (!text) return alert("Reply cannot be empty");

        try {
            const res = await fetch(`https://ashstarwithaiassistant.onrender.com/api/admin/reviews/${reviewId}/reply`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminReply: text })
            });
            const updated = await res.json();
            
            // Update UI instantly
            setReviews(reviews.map(r => r._id === reviewId ? updated : r));
            setReplyText({ ...replyText, [reviewId]: "" }); // Clear input
            alert("Reply Transmitted.");
        } catch (err) { alert("Failed to reply"); }
    };

    // Handle Delete
    const deleteReview = async (reviewId) => {
        if (!window.confirm("Purge this record from the database?")) return;
        
        try {
            await fetch(`https://ashstarwithaiassistant.onrender.com/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
            setReviews(reviews.filter(r => r._id !== reviewId));
        } catch (err) { alert("Delete Failed"); }
    };

    if (!user || user.email !== ADMIN_EMAIL) return <div className="h-screen bg-black text-red-500 flex items-center justify-center font-black text-3xl">ACCESS DENIED</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans p-10">
            <div className="flex justify-between items-center mb-10 border-b border-red-600 pb-4">
                <h1 className="text-4xl font-black text-red-600 uppercase">Overwatch <span className="text-white">Command</span></h1>
                <Link to="/" className="border border-white px-4 py-2 hover:bg-white hover:text-black font-bold uppercase">Exit to City</Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {reviews.map((rev) => (
                    <div key={rev._id} className="bg-neutral-900 border border-gray-800 p-6 rounded relative group">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg uppercase text-white">{rev.userName} <span className="text-gray-500 text-xs">({rev.userEmail})</span></h3>
                                <div className="text-yellow-400 text-xs mt-1">Target: {rev.assistantId.toUpperCase()} | Rating: {rev.rating}/5</div>
                            </div>
                            <button onClick={() => deleteReview(rev._id)} className="text-red-600 hover:text-red-400 font-bold text-xs uppercase border border-red-900 px-2 py-1">Purge</button>
                        </div>

                        {/* User Comment */}
                        <p className="text-gray-300 italic mb-6 border-l-2 border-gray-600 pl-4">"{rev.comment}"</p>

                        {/* Admin Reply Section */}
                        {rev.adminReply ? (
                            <div className="bg-green-900/20 border border-green-500/50 p-3 mt-4">
                                <span className="text-green-500 text-xs font-bold uppercase block mb-1">Developer Response:</span>
                                <p className="text-green-100 text-sm">{rev.adminReply}</p>
                            </div>
                        ) : (
                            <div className="flex gap-2 mt-4">
                                <input 
                                    type="text" 
                                    placeholder="Enter developer response..." 
                                    value={replyText[rev._id] || ""}
                                    onChange={(e) => setReplyText({ ...replyText, [rev._id]: e.target.value })}
                                    className="flex-1 bg-black border border-gray-700 p-2 text-white outline-none focus:border-red-500 text-sm"
                                />
                                <button 
                                    onClick={() => submitReply(rev._id)}
                                    className="bg-red-600 text-white px-4 py-2 font-bold uppercase text-xs hover:bg-red-500"
                                >
                                    Reply
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;