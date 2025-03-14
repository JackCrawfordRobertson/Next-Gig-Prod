"use client";

import { motion } from "framer-motion";

const AnimatedGradient = () => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full"
      style={{
        background: "radial-gradient(circle at 50% 50%, #1E90FF, #42C4DD, #D6FF33, #FF8C00)",
        filter: "blur(80px)", // ✅ Softer diffusion for a premium feel
        opacity: 0.7, // ✅ Ensures it's not overpowering
      }}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 100%", "100% 0%", "50% 50%"],
        backgroundSize: ["150% 150%", "140% 140%", "160% 160%", "150% 150%"],
      }}
      transition={{
        duration: 20, // ✅ Slowed down from 10 → 25 seconds for a more relaxed feel
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

export default AnimatedGradient;