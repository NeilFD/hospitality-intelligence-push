
import React from "react";
import { CommandGroup } from "@/components/ui/command";

// This component wraps CommandGroup to safely handle null/undefined children
export const SafeCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ children, ...props }, ref) => {
  // First, check if children is undefined or null
  if (!children) {
    return null;
  }
  
  try {
    // Create a safe array of children that we can render
    let safeChildren: React.ReactNode[] = [];
    
    // Handle different types of children input
    if (Array.isArray(children)) {
      safeChildren = children.filter(Boolean);
    } else if (React.isValidElement(children)) {
      safeChildren = [children];
    } else if (typeof children === 'string' || typeof children === 'number') {
      safeChildren = [children];
    } else {
      // Use React.Children API as a fallback
      try {
        safeChildren = React.Children.toArray(children).filter(Boolean);
      } catch (e) {
        console.error("Error in SafeCommandGroup with React.Children:", e);
        return null;
      }
    }
    
    // Extra safety check - if we end up with an empty array, don't render
    if (safeChildren.length === 0) {
      return null;
    }
    
    // Only render the CommandGroup when we have valid children
    return <CommandGroup ref={ref} {...props}>{safeChildren}</CommandGroup>;
  } catch (e) {
    // Log error and return null if there was any issue
    console.error("Error in SafeCommandGroup:", e);
    return null;
  }
});

SafeCommandGroup.displayName = "SafeCommandGroup";
