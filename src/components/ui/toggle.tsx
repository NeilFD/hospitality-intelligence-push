
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => {
  const [themeStyles, setThemeStyles] = React.useState('');
  
  React.useEffect(() => {
    const handleThemeChange = () => {
      const htmlElement = document.documentElement;
      
      if (htmlElement.classList.contains('theme-nfd-theme')) {
        setThemeStyles("data-[state=on]:bg-[#ec193a] data-[state=on]:text-white");
      } else if (htmlElement.classList.contains('theme-purple-700')) {
        // For custom themes, directly use CSS variables rather than computed styles
        const buttonColor = getComputedStyle(htmlElement).getPropertyValue('--custom-button-color').trim();
        // Only apply if we have a valid color
        if (buttonColor && buttonColor !== '') {
          setThemeStyles(`data-[state=on]:bg-[${buttonColor}] data-[state=on]:text-white`);
        } else {
          // Fallback to accent color
          setThemeStyles("data-[state=on]:bg-accent data-[state=on]:text-accent-foreground");
        }
      } else if (htmlElement.classList.contains('theme-forest-green')) {
        setThemeStyles("data-[state=on]:bg-[#2e7d32] data-[state=on]:text-white");
      } else if (htmlElement.classList.contains('theme-ocean-blue')) {
        setThemeStyles("data-[state=on]:bg-[#1976d2] data-[state=on]:text-white");
      } else if (htmlElement.classList.contains('theme-sunset-orange')) {
        setThemeStyles("data-[state=on]:bg-[#ef6c00] data-[state=on]:text-white");
      } else if (htmlElement.classList.contains('theme-berry-purple')) {
        setThemeStyles("data-[state=on]:bg-[#8e24aa] data-[state=on]:text-white");
      } else if (htmlElement.classList.contains('theme-dark-mode')) {
        setThemeStyles("data-[state=on]:bg-[#333333] data-[state=on]:text-white");
      } else if (htmlElement.classList.contains('theme-hi-purple')) {
        setThemeStyles("data-[state=on]:bg-[#9d89c9] data-[state=on]:text-white");
      } else {
        setThemeStyles("data-[state=on]:bg-accent data-[state=on]:text-accent-foreground");
      }
    };
    
    // Initialize theme style
    handleThemeChange();
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);

  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(toggleVariants({ variant, size, className }), themeStyles)}
      {...props}
    />
  )
})

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
