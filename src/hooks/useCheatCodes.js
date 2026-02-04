import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const useCheatCodes = () => {
  const [inputBuffer, setInputBuffer] = useState("");
  const { user, upgradeToPremium } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Get the key pressed (converted to Uppercase)
      const key = e.key.toUpperCase();
      
      // 2. Add to buffer (Keep last 30 characters)
      setInputBuffer((prev) => {
        const updated = (prev + key).slice(-30);
        
        // --- CHECK CODES ---
        
        // Code 1: NUTTERTOOLS (Premium Unlock)
        if (updated.includes("NUTTERTOOLS")) {
            console.log("CHEAT ACTIVATED: PREMIUM");
            upgradeToPremium();
            alert("CHEAT ACTIVATED: PREMIUM ACCESS GRANTED");
            return ""; // Reset buffer
        }

        // Code 2: HEZOYAM (Money/Stats)
        if (updated.includes("HEZOYAM")) {
            console.log("CHEAT ACTIVATED: MONEY");
            alert("CHEAT ACTIVATED: +$250,000 (Visual Only)");
            return "";
        }

        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [upgradeToPremium]);
};

export default useCheatCodes;