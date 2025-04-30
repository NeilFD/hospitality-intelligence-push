
import React from "react";
import { CommandGroup, CommandGroupProps } from "@/components/ui/command";

type SafeCommandGroupProps = CommandGroupProps & {
  children: React.ReactNode;
};

// This component wraps CommandGroup to safely handle null/undefined children
export const SafeCommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandGroup>,
  SafeCommandGroupProps
>(({ children, ...props }, ref) => {
  // Check if there are any children before rendering the CommandGroup
  if (!children) {
    return null;
  }

  // Ensure children is array-like before passing to CommandGroup
  const safeChildren = React.Children.toArray(children).filter(Boolean);

  if (safeChildren.length === 0) {
    return null;
  }

  return <CommandGroup ref={ref} {...props}>{safeChildren}</CommandGroup>;
});

SafeCommandGroup.displayName = "SafeCommandGroup";
