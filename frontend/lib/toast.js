// lib/toast.js
import { toast } from "@/hooks/use-toast";

export const showToast = ({ title, description, variant = "default" }) => {
  // Map variants for backward compatibility
  const mappedVariant = 
    variant === "error" ? "destructive" :
    variant === "success" ? "success" :
    variant === "warning" ? "warning" :
    variant === "info" ? "info" :
    "default";

  return toast({
    title,
    description,
    variant: mappedVariant,
    duration: 3500,
  });
};