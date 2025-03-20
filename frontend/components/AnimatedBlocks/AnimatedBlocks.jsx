"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ARROW_PATHS_DESK } from "./arrowsData";

const SVG_VIEWBOX = "0 0 1822.91 1033.12";

const getRandomStrokeWidth = () => Math.floor(Math.random() * 25) + 15;

const ArrowSVG = ({ id }) => {
    const { body, head, color } = ARROW_PATHS_DESK[id] || {};
    if (!body || !head) return null; // Prevent errors if ID is missing

    const [strokeWidth, setStrokeWidth] = useState(20); // Default width for SSR

    useEffect(() => {
        setStrokeWidth(getRandomStrokeWidth()); 
    }, []);

    return (
        <g id={id}>
            <path
                id={`${id}_body`}
                fill="none"
                stroke={color}
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
                stroke={color}
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

export default function ArrowsBackground() {
  const arrowsRef = useRef(null);
  const animationsRef = useRef([]);

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
      
      // Store the timeline for cleanup
      animationsRef.current.push(timeline);

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
              // Safely animate the head only if component is still mounted
              if (!arrowsRef.current) return;
              
              // For each body that finishes, find its matching head
              const body = this.targets()[0]; 
              const headId = body.id.replace("_body","_head");
              const headEl = arrowsRef.current.querySelector(`#${headId}`);
              
              // Only proceed if we found the head element
              if (headEl) {
                const headAnim = gsap.to(headEl, {
                  strokeDashoffset: 0,
                  opacity: 1,
                  duration: 1,
                  ease: "power2.inOut"
                });
                
                // Store for cleanup
                animationsRef.current.push(headAnim);
              }
            }
          }
      });

      // Cleanup function
      return () => {
        // Kill all animations when component unmounts
        animationsRef.current.forEach(anim => {
          if (anim && anim.kill) {
            anim.kill();
          }
        });
        animationsRef.current = [];
      };
  }, []);

  return (
      <div ref={arrowsRef} className="fixed inset-0 w-full h-full bg-transparent z-[-1]">
          <svg viewBox={SVG_VIEWBOX} width="100%" height="100%">
              {Object.keys(ARROW_PATHS_DESK).map((id) => (
                  <ArrowSVG key={id} id={id} />
              ))}
          </svg>
      </div>
  );
}