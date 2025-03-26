"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        className: "!bg-background !text-foreground border border-border",
        style: {
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        },
        success: {
          className: "!border-green-500",
          iconTheme: {
            primary: "#22c55e",
            secondary: "white",
          },
        },
        error: {
          className: "!border-red-500",
          iconTheme: {
            primary: "#ef4444",
            secondary: "white",
          },
        },
      }}
    />
  );
}