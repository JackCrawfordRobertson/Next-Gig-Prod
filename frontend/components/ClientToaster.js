// components/ClientToaster.js
"use client";

import { Toaster } from 'react-hot-toast';

export default function ClientToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "bg-background border text-foreground shadow-md",
      }}
    />
  );
}