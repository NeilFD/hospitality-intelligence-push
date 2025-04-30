
import React from "react";
import { CommandGroup } from "@/components/ui/command";

// This component wraps CommandGroup to safely handle null/undefined children
export const SafeCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  React.ComponentPropsWithoutRef<typeof CommandGroup>
>(({ children, ...props }, ref) => {
  // First, check if there are any children before processing
  if (children === undefined || children === null) {
    return null;
  }

  try {
    // Convert children to array and filter out null/undefined values
    const childArray = React.Children.toArray(children);
    
    // If no valid children remain after filtering, return null
    if (childArray.length === 0) {
      return null;
    }

    // Render the CommandGroup with the safe children
    return <CommandGroup ref={ref} {...props}>{childArray}</CommandGroup>;
  } catch (e) {
    // Fallback in case of any errors during children processing
    console.error("Error in SafeCommandGroup:", e);
    return null;
  }
});

SafeCommandGroup.displayName = "SafeCommandGroup";
