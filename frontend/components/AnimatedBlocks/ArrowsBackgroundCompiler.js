"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ✅ Dynamically import both versions to avoid hydration issues
const ArrowsBackground = dynamic(() => import("./AnimatedBlocks"), { ssr: false });
const ArrowsBackgroundMobile = dynamic(() => import("./ArrowsBackgroundMobile"), { ssr: false });

export default function ArrowsBackgroundWrapper() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // ✅ Function to check screen size
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // Adjust breakpoint as needed
        };

        checkMobile(); // ✅ Check on load
        window.addEventListener("resize", checkMobile); // ✅ Listen for screen changes

        return () => window.removeEventListener("resize", checkMobile); // ✅ Cleanup listener
    }, []);

    return isMobile ? <ArrowsBackgroundMobile /> : <ArrowsBackground />;
}
