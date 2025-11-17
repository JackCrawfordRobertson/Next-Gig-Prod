"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import gsap from "gsap";
import { ARROW_PATHS_MOB } from "./arrowsData";

const getRandomStrokeWidth = () => Math.floor(Math.random() * 25) + 30;

// Map colors to lighter versions for dark mode
const getArrowColor = (originalColor, isDark) => {
    if (!isDark) return originalColor;

    const colorMap = {
        "#1E90FF": "#60A5FA",  // Dodger Blue -> Light Blue
        "#ff008c": "#FF5DA8",  // Deep Pink -> Light Pink
        "#D6FF33": "#EFEF1E",  // Chartreuse -> Bright Yellow
        "#FF8C00": "#FFAA33",  // Dark Orange -> Light Orange
    };

    return colorMap[originalColor] || originalColor;
};

const ArrowSVG = ({ id, isDark }) => {
    const [strokeWidth, setStrokeWidth] = useState(20);

    useEffect(() => {
        setStrokeWidth(getRandomStrokeWidth());
    }, []);

    const { body, head, color } = ARROW_PATHS_MOB[id] || {};
    if (!body || !head) return null;

    const arrowColor = getArrowColor(color, isDark);

    return (
        <g id={id}>
            <path
                id={`${id}_body`}
                fill="none"
                stroke={arrowColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeDasharray="1000"
                strokeDashoffset="1000"
                d={body}
            />
            <path
                id={`${id}_head`}
                fill="none"
                stroke={arrowColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeMiterlimit="10"
                strokeDasharray="500"
                strokeDashoffset="500"
                d={head}
            />
        </g>
    );
};

export default function ArrowsBackgroundMobile() {
    const arrowsRef = useRef(null);
    const bgRef = useRef(null);
    const svgRef = useRef(null);
    const [viewBox, setViewBox] = useState("0 0 1033.12 2222.91");
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Get the actual theme (handle system preference)
    const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update background based on theme
    useEffect(() => {
        if (!bgRef.current || !mounted) return;

        if (isDark) {
            bgRef.current.style.backgroundColor = "hsl(222.2, 84%, 4.9%)";
        } else {
            bgRef.current.style.backgroundColor = "hsl(0, 0%, 100%)";
        }
    }, [isDark, mounted]);

    useEffect(() => {
        // Dynamic viewBox adjustment
        const adjustViewBox = () => {
            const aspectRatio = window.innerWidth / window.innerHeight;
            const width = 1033.12;
            const height = aspectRatio > 9/16
                ? Math.round(width / aspectRatio)
                : 2222.91;

            setViewBox(`0 0 ${width} ${height}`);
        };

        // Initial adjustment
        adjustViewBox();

        // Adjust on resize
        window.addEventListener('resize', adjustViewBox);

        return () => window.removeEventListener('resize', adjustViewBox);
    }, []);

    useEffect(() => {
        if (!arrowsRef.current) return;

        // Grab all bodies and heads
        const arrowBodies = arrowsRef.current.querySelectorAll("path[id$='_body']");
        const arrowsContainer = arrowsRef.current;

        // Initial hidden state
        gsap.set(arrowBodies, { strokeDashoffset: 1000, opacity: 0 });
        gsap.set(arrowsRef.current.querySelectorAll("path[id$='_head']"), { strokeDashoffset: 500, opacity: 0 });
        gsap.set(arrowsContainer, { opacity: 0 });

        // Main timeline
        const timeline = gsap.timeline();

        // Fade in the container quickly
        timeline.to(arrowsContainer, { opacity: 1, duration: 0.5, ease: "power2.out" });

        // Spread out the bodies' animation over up to 10s total
        const totalArrows = arrowBodies.length;
        const maxAnimationTime = 10;
        const staggerTime = maxAnimationTime / totalArrows;

        // Animate arrow bodies with a stagger
        timeline.to(arrowBodies, {
            strokeDashoffset: 0,
            opacity: 1,
            duration: 4,
            ease: "power2.inOut",
            stagger: {
                each: staggerTime, 
                grid: "auto",
                from: "random",
                onComplete: function() {
                    try {
                        // For each body that finishes, find its matching head
                        const body = this.targets()[0]; 
                        const headId = body.id.replace("_body","_head");
                        const headEl = arrowsRef.current?.querySelector(`#${headId}`);

                        // Only animate if head element exists
                        if (headEl) {
                            gsap.to(headEl, {
                                strokeDashoffset: 0,
                                opacity: 1,
                                duration: 1,
                                ease: "power2.inOut"
                            });
                        }
                    } catch (error) {
                        console.error("Animation error:", error);
                    }
                }
            }
        });
    }, []);

    return (
        <div
            ref={bgRef}
            style={{
                position: "fixed",
                inset: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: mounted && isDark ? "hsl(222.2, 84%, 4.9%)" : "white",
                zIndex: -1,
                overflow: "hidden",
                transition: "background-color 0.3s ease",
            }}
        >
            <div
                ref={arrowsRef}
                style={{
                    width: "100%",
                    height: "100%",
                }}
            >
            <svg
                ref={svgRef}
                viewBox={viewBox}
                preserveAspectRatio="none"
                width="100%"
                height="100%"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "120%",
                }}
            >
                {Object.keys(ARROW_PATHS_MOB).map((id) => (
                    <ArrowSVG key={id} id={id} isDark={isDark} />
                ))}
            </svg>
            </div>
        </div>
    );
}