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

    // 2. Login Logic (Smart)
    const login = (name, email, avatar) => {
        const newUser = { name, email, avatar, lastLogin: new Date() };

        // Update Current Session
        setUser(newUser);
        localStorage.setItem("ashstar_active_session", JSON.stringify(newUser));

        // Update "Database" History
        // Check if user already exists by email
        const existingUserIndex = allUsers.findIndex(u => u.email === email);

        let updatedUsers = [...allUsers];

        if (existingUserIndex >= 0) {
            // User exists, update their details (e.g., if they changed avatar)
            updatedUsers[existingUserIndex] = newUser;
        } else {
            // New user, add to list
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
        // We DO NOT clear 'ashstar_users_db' so the history remains!
        window.location.reload();
    };

    // 4. Helper: Check if email exists
    const checkEmailExists = (email) => {
        return allUsers.find(u => u.email === email);
    };

    return (
        <AuthContext.Provider value={{ user, allUsers, login, logout, isModalOpen, setIsModalOpen, checkEmailExists }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);