"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; 

    if (session) {
      router.push("/dashboard"); 
    } else {
      router.push("/login"); 
    }
  }, [session, status, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      {/* Animation Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="flex flex-col items-center"
      >
        {/* Animated Dots */}
        <div className="flex space-x-2">
          {[1, 2, 3].map((dot) => (
            <motion.span
              key={dot}
              className="block w-4 h-4 bg-primary rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 0.2,
                ease: "easeInOut",
                delay: dot * 0.2, // Creates stagger effect
              }}
            />
          ))}
        </div>

        {/* Text Below Animation */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-4 text-gray-900 text-sm"
        >
          Checking authentication...
        </motion.p>
      </motion.div>
    </div>
  );
}