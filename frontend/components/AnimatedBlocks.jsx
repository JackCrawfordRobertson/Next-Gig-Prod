"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// ✅ Correct ViewBox for the whole SVG (matches original SVG)
const SVG_VIEWBOX = "0 0 1822.91 1033.12";

// ✅ Store paths for each arrow in an object (no need for repeated JSX)
const ARROW_PATHS = {
    arrow_11: {
        body: "M15,408.5c1.54-65.7,13.88-118.15,24.92-153.66,0,0,31.29-100.68,89.29-151.59,12.86-11.28,26.55-19.67,43.61-22.84,24.28-4.52,43.85,3.64,49.84,6.23,26.23,11.35,39.03,31.88,43.61,39.45,20.01,33.12,14.56,66.26,12.46,78.91-2.41,14.5-5.46,31.38-19.73,42.57-2.24,1.76-16.17,12.68-29.07,8.31-19.12-6.48-20.58-41.31-20.77-45.68-1.2-28.48,12.53-49.81,24.92-68.53,11.72-17.7,33.48-50.55,76.83-70.6,37.85-17.51,71.69-15.86,93.44-14.54,45.15,2.74,79.92,18.36,100.57,29.97",
        head: "M472.87,15c26.87,22.99,40.39,51.56,32.19,71.64-5.84,14.29-20.9,21.52-30.11,25.96-24.13,11.64-47.15,9.03-57.1,7.27",
        color: "#1E90FF",
    },
    arrow_10: {
        body: "M1109.91,543.5c58.02-5.37,100.27-24,124.56-37.1,31.8-17.15,79.04-42.62,100.71-95.41,5.36-13.05,19.13-49.03,2.65-84.81-11.34-24.61-41.05-57.75-74.2-50.35-22.84,5.1-44.12,28.73-42.4,53,1.68,23.74,25.18,45.98,47.7,47.7,55.15,4.22,109.09-114.28,129.86-180.21,16.97-53.86,20.89-101.51,21.2-135.16",
        head: "M1347.29,122.85c8.28-12.16,22.15-29.66,43.54-45.78,14.7-11.08,24.05-18.12,34.45-18.55,25.75-1.06,53.26,38.64,69.8,95.96",
        color: "#ff008c",
    },
    arrow_9: {
        body: "M899.91,549.5c9.49-58.49,25.61-104.06,38.96-135.33,26.56-62.22,58.35-105.78,96.37-157.89,28.63-39.23,54.67-70.42,73.82-92.27",
        head: "M1040.26,159.88c10.69-3.92,27.29-8.7,48.01-9.21,14.24-.35,23.29-.58,30.03,3.83,16.68,10.92,16.12,48.29.73,91.81",
        color: "#D6FF33",
    },
    arrow_8: {
        body: "M1729.21,504.18c-19.52-22.02-50.37-62.77-68.09-122.05-20.7-69.28-12.95-128.68-6.19-160.29,12.38-57.96,37.89-99.68,54.62-122.89",
        head: "M1643.36,98.91c9.09-6.57,23.57-15.51,43.09-21.51,13.41-4.12,21.94-6.75,29.51-4.36,18.73,5.92,28.15,41.52,25.13,86.89",
        color: "#1E90FF",
    },
    arrow_7: {
        body: "M1804.59,650.47c6.4,38.99,2.28,70.27-1.68,89.2-4.96,23.67-23.46,93.9-89.2,141.38-27.38,19.77-53.91,29.07-70.69,33.66",
        head: "M1683.59,953.61c-9.25-1.33-23.11-4.35-38.28-12.04-10.43-5.29-17.06-8.65-20.21-14.47-7.8-14.39,7.16-41.17,35.23-66.62",
        color: "#FF8C00",
    },
    arrow_6: {
        body: "M241.72,309.56c57.27,44.63,83,91.67,94.69,118.36,21,47.95,13.96,69.68,10.76,77.47-9.38,22.82-31.06,36.14-45.19,40.89-46.3,15.55-113.83-26.5-165.7-105.45",
        head: "M111.39,482.72c-1.89-8.23-3.85-20.91-2.29-36.2,1.07-10.52,1.75-17.2,5.63-21.75,9.6-11.26,37.06-7.36,67.65,8.04",
        color: "#ff008c",
    },
    arrow_5: {
        body: "M27.45,835.06c-4.77-25.86-7.91-66.02,6.5-110.56,8.47-26.19,27.07-83.66,79.67-104.06,6.79-2.63,40.8-15.81,74.79,0,44.81,20.85,51.73,74.47,53.65,89.42,1.97,15.26,6.32,49.04-13.01,61.78-11.12,7.33-28.62,6.74-39.02-1.63-21.53-17.32-12.4-67.76,9.76-99.18,5.37-7.61,26.24-37.22,61.78-40.65,37.4-3.61,65.03,24.27,78.04,37.39,50.27,50.71,46.91,123.13,45.52,141.45",
        head: "M427.91,781.53c-2.49,8.68-7.2,21.54-16.56,35.05-6.43,9.28-10.52,15.19-16.5,17.44-14.79,5.57-38.46-12.26-59.13-42.47",
        color: "#D6FF33",
    },
    arrow_4: {
        body: "M1481.47,481.5c55.75,98.8,71.59,184.33,76.81,234.21,6.97,66.47-.84,108.56-12.39,141.19-10.42,29.42-24.1,68.06-63.21,91.4-4.77,2.85-58.24,33.73-103.94,10.39-50.94-26.01-53.91-99.79-55.32-134.75-2.76-68.39,23.63-121.8,40.86-150.02",
        head: "M1302.04,665.95c9.59-7.76,24.95-18.47,46.02-26.25,14.48-5.35,23.69-8.75,32.14-6.58,20.93,5.36,33.44,43.89,32.88,93.9",
        color: "#D6FF33",
    },
    arrow_3: {
        body: "M427.91,1013.12c8.47-46.73,27.18-77.56,39.43-94.3,13.27-18.13,25.75-34.67,46.29-37.72,23.91-3.55,44.57,13.27,51.44,18.86,22.03,17.94,18.16,31.94,44.58,58.29,14.07,14.04,22.38,22.33,34.29,24,29.56,4.16,57.6-35.73,75.44-61.72,19.39-28.25,46.41-76.41,60.01-147.45",
        head: "M729.27,780.15c6.82-6.64,17.86-15.96,33.5-23.43,10.75-5.13,17.58-8.4,24.23-7.33,16.46,2.64,28.8,31.35,31.91,69.82",
        color: "#ff008c",
    },
    arrow_2: {
        body: "M705.51,72.5c28.26,22.3,69.5,62.36,93.26,124.28,13.8,35.97,30.32,79.03,12.55,125.82-17.6,46.33-62.16,78.75-103.82,87.64-23.36,4.99-24.07-2.06-103.28-.52-48.55.95-61.33,3.85-73.72,11.99-32.62,21.43-38.32,63.22-38.96,68.46-6.01,49.31,26.79,89.4,58.61,128.3,25.23,30.84,50.47,51.71,67.1,64.08",
        head: "M626.25,624.56c5.24,9,12.2,23.19,15.97,41.76,2.6,12.77,4.25,20.88,1.35,27.66-7.17,16.77-40.91,22.25-82.55,15.34",
        color: "#FF8C00",
    },
    arrow_1: {
        body: "M919.91,982.5c71.3-66.78,142.61-133.55,213.91-200.33",
        head: "M1080.82,768.78c8.67-3.7,22.2-8.34,39.31-9.64,11.76-.89,19.24-1.46,24.99,1.9,14.25,8.33,15.37,39.25,4.47,75.88",
        color: "#1E90FF",
    },
};

// ✅ Generates a random stroke width between 15px and 30px
const getRandomStrokeWidth = () => Math.floor(Math.random() * 15) + 15;

const ArrowSVG = ({ id }) => {
    const { body, head, color } = ARROW_PATHS[id] || {};
    if (!body || !head) return null; // Prevent errors if ID is missing

    const [strokeWidth, setStrokeWidth] = useState(20); // Default width for SSR

    useEffect(() => {
        setStrokeWidth(getRandomStrokeWidth()); // ✅ Apply random stroke width only on client
    }, []);

    return (
        <g id={id}>
            <path
                id={`${id}_body`}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth} // ✅ Uses consistent stroke width
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
                strokeWidth={strokeWidth} // ✅ Uses same stroke width for consistency
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

      // Spread out the bodies’ animation over up to 10s total
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
              // For each body that finishes, find its matching head
              const body = this.targets()[0]; 
              const headId = body.id.replace("_body","_head");
              const headEl = arrowsRef.current.querySelector(`#${headId}`);

              // Animate head from dash offset=500 to 0 smoothly over ~0.5s–1s
              gsap.to(headEl, {
                strokeDashoffset: 0,
                opacity: 1,
                duration: 1,           // <— Increase if you want it slower
                ease: "power2.inOut"
              });
            }
          }
      });

  }, []);


  return (
      <div ref={arrowsRef} className="fixed inset-0 w-full h-full bg-transparent z-[-1]">
          <svg viewBox={SVG_VIEWBOX} width="100%" height="100%">
              {Object.keys(ARROW_PATHS).map((id) => (
                  <ArrowSVG key={id} id={id} />
              ))}
          </svg>
      </div>
  );
}