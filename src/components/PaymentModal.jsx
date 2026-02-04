import React, { useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const PaymentModal = ({ themeColor, onClose, onSuccess }) => {
  const [processing, setProcessing] = useState(false);

  useGSAP(() => {
    gsap.from(".pay-box", { scale: 0.8, opacity: 0, ease: "back.out(1.7)", duration: 0.5 });
  }, []);

  const handlePay = (e) => {
    e.preventDefault();
    setProcessing(true);
    
    // Simulate API delay
    setTimeout(() => {
      setProcessing(false);
      onSuccess(); // Trigger the upgrade
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="pay-box w-full max-w-md bg-neutral-900 border-2 rounded-xl p-8 relative shadow-2xl" style={{ borderColor: themeColor }}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <i className="ri-close-line text-2xl"></i>
        </button>

        <h2 className="text-2xl font-black uppercase text-white mb-1">Secure <span style={{ color: themeColor }}>Transaction</span></h2>
        <p className="text-gray-400 text-sm mb-6">Unlock Advanced Neural Pathways for ₹499</p>

        <form onSubmit={handlePay} className="flex flex-col gap-4">
          <div className="bg-black/50 p-4 rounded border border-gray-700">
            <label className="text-[10px] uppercase font-bold text-gray-500">Card Number</label>
            <div className="flex items-center gap-2">
              <i className="ri-bank-card-fill text-white"></i>
              <input type="text" placeholder="0000 0000 0000 0000" className="bg-transparent text-white font-mono w-full outline-none" required />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-black/50 p-4 rounded border border-gray-700 w-1/2">
              <label className="text-[10px] uppercase font-bold text-gray-500">Expiry</label>
              <input type="text" placeholder="MM/YY" className="bg-transparent text-white font-mono w-full outline-none" required />
            </div>
            <div className="bg-black/50 p-4 rounded border border-gray-700 w-1/2">
              <label className="text-[10px] uppercase font-bold text-gray-500">CVC</label>
              <input type="password" placeholder="123" className="bg-transparent text-white font-mono w-full outline-none" required />
            </div>
          </div>

          <button 
            type="submit"
            disabled={processing}
            className="mt-4 w-full py-4 font-black uppercase text-black rounded transition-all hover:scale-105 flex justify-center items-center gap-2"
            style={{ backgroundColor: processing ? '#555' : themeColor }}
          >
            {processing ? (
              <>Processing <i className="ri-loader-4-line animate-spin"></i></>
            ) : (
              <>Confirm Payment <i className="ri-lock-2-line"></i></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;