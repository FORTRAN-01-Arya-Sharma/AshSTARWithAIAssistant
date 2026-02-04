import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // The currently active user
    const [allUsers, setAllUsers] = useState([]); // The "Database" of all users
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. Load Data on Startup
    useEffect(() => {
        // Load active session
        const savedUser = localStorage.getItem("ashstar_active_session");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }

        // Load user history (Mock Database)
        const savedHistory = localStorage.getItem("ashstar_users_db");
        if (savedHistory) {
            setAllUsers(JSON.parse(savedHistory));
        }
    }, []);

    // 2. Login Logic (Updated to preserve Premium status)
    const login = (name, email, avatar) => {
        
        // Check if this user existed before to keep their Premium status
        const existingUser = allUsers.find(u => u.email === email);
        const isPremium = existingUser ? existingUser.isPremium : false; 

        // Create the user object (Defaulting isPremium to false if new)
        const newUser = { 
            name, 
            email, 
            avatar, 
            isPremium: isPremium, 
            lastLogin: new Date() 
        };

        // Update Current Session
        setUser(newUser);
        localStorage.setItem("ashstar_active_session", JSON.stringify(newUser));

        // Update "Database" History
        const existingUserIndex = allUsers.findIndex(u => u.email === email);
        let updatedUsers = [...allUsers];

        if (existingUserIndex >= 0) {
            updatedUsers[existingUserIndex] = newUser;
        } else {
            updatedUsers.push(newUser);
        }

        setAllUsers(updatedUsers);
        localStorage.setItem("ashstar_users_db", JSON.stringify(updatedUsers));

        setIsModalOpen(false);
    };

    // 3. Logout Logic
    const logout = () => {
        setUser(null);
        localStorage.removeItem("ashstar_active_session");
        window.location.reload();
    };

    // 4. Upgrade to Premium (The new function)
    const upgradeToPremium = () => {
        if (!user) return;

        // Create updated user object
        const updatedUser = { ...user, isPremium: true };

        // 1. Update State & Active Session
        setUser(updatedUser);
        localStorage.setItem("ashstar_active_session", JSON.stringify(updatedUser));

        // 2. Update the "Database" so it remembers next time
        const updatedAllUsers = allUsers.map(u => 
            u.email === user.email ? updatedUser : u
        );
        
        setAllUsers(updatedAllUsers);
        localStorage.setItem("ashstar_users_db", JSON.stringify(updatedAllUsers));
    };

    // 5. Helper: Check if email exists
    const checkEmailExists = (email) => {
        return allUsers.find(u => u.email === email);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            allUsers, 
            login, 
            logout, 
            upgradeToPremium, // Exporting the new function
            isModalOpen, 
            setIsModalOpen, 
            checkEmailExists 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);