"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => {
  // Ensure value is exactly 0 if it should be 0
  const actualValue = value === 0 ? 0 : (value || 0);
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className
      )}
      {...props}>
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ 
          transform: `translateX(-${100 - actualValue}%)`,
          // When value is 0, make it completely invisible
          opacity: actualValue === 0 ? 0 : 1
        }} 
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }