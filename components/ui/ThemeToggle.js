"use client";

import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    // Set the theme to 'dark' as soon as the component is mounted
    document.documentElement.classList.add("light");
  }, []);

  return null; // No need to render any button for toggling the theme
}