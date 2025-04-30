
import React from "react";
import { CommandGroup } from "@/components/ui/command";

// This component wraps CommandGroup to safely handle null/undefined children
export const SafeCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ children, ...props }, ref) => {
  // First, check if children is undefined or null
  if (children === undefined || children === null) {
    return null;
  }
  
  try {
    // Safely convert children to array - this is where the Array.from error happens
    // We'll be extra cautious here
    let childArray;
    
    if (Array.isArray(children)) {
      childArray = children.filter(Boolean);
    } else if (React.isValidElement(children)) {
      childArray = [children];
    } else {
      // Normal approach that might throw with certain inputs
      childArray = React.Children.toArray(children).filter(Boolean);
    }
    
    // Extra safety check - if we end up with an empty array, don't render
    if (!childArray || childArray.length === 0) {
      return null;
    }
    
    // Only render the CommandGroup when we have valid children
    return <CommandGroup ref={ref} {...props}>{childArray}</CommandGroup>;
  } catch (e) {
    // Log error and return null if there was any issue
    console.error("Error in SafeCommandGroup:", e);
    return null;
  }
});

SafeCommandGroup.displayName = "SafeCommandGroup";
