
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const inputProps = type === "number" ? {
      step: "any",
      ...props
    } : props;
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
    
    return (
      <input
        type={type}
        className={cn(
          "flex w-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-tavern-blue-light",
          className
        )}
        ref={ref}
        onClick={handleClick}
        {...inputProps}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
