// components/EnvironmentSwitcher.jsx
"use client";

import { useState, useEffect } from "react";

export function EnvironmentSwitcher() {
  const [isProdMode, setIsProdMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const override = localStorage.getItem('env_override');
    setIsProdMode(override === 'production');
    setMounted(true);
  }, []);
  
  const toggleMode = () => {
    const newMode = !isProdMode ? 'production' : 'development';
    localStorage.setItem('env_override', newMode);
    setIsProdMode(!isProdMode);
    window.location.reload();
  };
  
  const clearOverride = () => {
    localStorage.removeItem('env_override');
    setIsProdMode(false);
    window.location.reload();
  };
  
  if (!mounted) return null;
  
  return (
    <div className="fixed right-2 bottom-16 left-auto z-50 flex flex-col items-end gap-2">
      <button 
        onClick={toggleMode}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md"
      >
        {isProdMode ? '🔄 Using PROD' : '🔄 Using DEV'}
      </button>
      
      {localStorage.getItem('env_override') && (
        <button 
          onClick={clearOverride}
          className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md"
        >
          Clear Override
        </button>
      )}
    </div>
  );
}