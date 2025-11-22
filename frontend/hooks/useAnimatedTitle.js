"use client";

import { useEffect, useRef } from 'react';

/**
 * Custom hook for animated browser tab titles
 * Use this to create engaging, dynamic tab titles that catch user attention
 */
export function useAnimatedTitle(options = {}) {
  const {
    enabled = true,
    baseTitle = "Next Gig",
    animation = "arrow-bounce", // arrow-bounce, arrow-move, notification, loading, pulse
    interval = 500, // milliseconds between frames
    onlyWhenHidden = false, // only animate when tab is not visible
  } = options;

  const animationRef = useRef(null);
  const originalTitleRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    // Save original title
    originalTitleRef.current = document.title;

    // Animation sequences
    const animations = {
      // Arrow bounces across the title
      "arrow-bounce": [
        "→ Next Gig",
        "─→ Next Gig",
        "──→ Next Gig",
        "Next → Gig",
        "Next Gig →",
        "Next Gig ─→",
        "Next Gig ──→",
        "Next Gig →",
        "Next → Gig",
        "──→ Next Gig",
        "─→ Next Gig",
      ],

      // Arrow moves smoothly across
      "arrow-move": [
        "→ Next Gig",
        "─→ Next Gig",
        "──→ Next Gig",
        "───→ Next Gig",
        "Next → Gig",
        "Next ─→ Gig",
        "Next ──→ Gig",
        "Next Gig →",
        "Next Gig ─→",
        "Next Gig ──→",
      ],

      // Notification style (great for new jobs!)
      "notification": [
        "⚡ New Jobs! | Next Gig",
        "💼 New Jobs! | Next Gig",
        "⚡ New Jobs! | Next Gig",
        "Next Gig | Job Hunting Organised",
        "Next Gig | Job Hunting Organised",
      ],

      // Loading animation
      "loading": [
        "Next Gig .",
        "Next Gig ..",
        "Next Gig ...",
        "Next Gig",
        "→ Finding jobs .",
        "→ Finding jobs ..",
        "→ Finding jobs ...",
      ],

      // Pulse effect
      "pulse": [
        "→ Next Gig",
        "→→ Next Gig",
        "→→→ Next Gig",
        "→→ Next Gig",
        "→ Next Gig",
        "Next Gig",
        "Next Gig",
      ],

      // Typewriter effect (with blinking arrow and reverse)
      "typewriter": [
        // Typing forward
        "N",
        "Ne",
        "Nex",
        "Next",
        "Next ",
        "Next G",
        "Next Gi",
        "Next Gig",
        "Next Gig",
        "Next Gig →",
        "Next Gig →",
        // Blinking arrow (3 times)
        "Next Gig",
        "Next Gig →",
        "Next Gig",
        "Next Gig →",
        "Next Gig",
        "Next Gig →",
        // Pause at full
        "Next Gig →",
        "Next Gig →",
        // Untyping backward
        "Next Gig",
        "Next Gi",
        "Next G",
        "Next ",
        "Next",
        "Nex",
        "Ne",
        "N",
        "",
      ],

      // Scroll effect
      "scroll": [
        "→ Next Gig | Find Your Next Role",
        "Next Gig | Find Your Next Role →",
        "Gig | Find Your Next Role → Next",
        "| Find Your Next Role → Next Gig",
        "Find Your Next Role → Next Gig |",
        "Your Next Role → Next Gig | Find",
        "Next Role → Next Gig | Find Your",
        "Role → Next Gig | Find Your Next",
      ],
    };

    const frames = animations[animation] || animations["arrow-bounce"];
    let currentFrame = 0;

    const animate = () => {
      // If onlyWhenHidden is true, only animate when tab is hidden
      if (onlyWhenHidden && !document.hidden) {
        document.title = originalTitleRef.current;
        return;
      }

      document.title = frames[currentFrame];
      currentFrame = (currentFrame + 1) % frames.length;
    };

    // Start animation
    animationRef.current = setInterval(animate, interval);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && onlyWhenHidden) {
        document.title = originalTitleRef.current;
      }
    };

    if (onlyWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
      if (onlyWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [enabled, baseTitle, animation, interval, onlyWhenHidden]);
}

/**
 * Hook for notification-style title (great for new job alerts!)
 */
export function useNotificationTitle(hasNotification = false, message = "⚡ New Jobs!") {
  useAnimatedTitle({
    enabled: hasNotification,
    animation: "notification",
    interval: 1000,
    onlyWhenHidden: true, // Only animate when user is on another tab
  });
}

/**
 * Hook for loading state title
 */
export function useLoadingTitle(isLoading = false) {
  useAnimatedTitle({
    enabled: isLoading,
    animation: "loading",
    interval: 400,
  });
}

/**
 * Hook for always-on animated title (subtle attention grabber)
 */
export function useBouncyTitle(enabled = true) {
  useAnimatedTitle({
    enabled,
    animation: "arrow-bounce",
    interval: 500,
  });
}
