
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Detect current theme for button styling
const getThemeClass = () => {
  // Get the HTML element to detect current theme
  const htmlElement = document.documentElement;
  
  if (htmlElement.classList.contains('theme-forest-green')) {
    return {
      default: "bg-[#1b5e20] text-white hover:bg-[#2e7d32]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-[#1b5e20] text-[#1b5e20] bg-background hover:bg-[#2e7d32]/10 hover:text-[#1b5e20]",
      secondary: "bg-[#4c8c4a] text-white hover:bg-[#4c8c4a]/80",
      ghost: "text-[#1b5e20] hover:bg-[#2e7d32]/10 hover:text-[#1b5e20]",
      link: "text-[#1b5e20] underline-offset-4 hover:underline",
      nav: "border border-[#344861] text-[#344861] bg-white hover:bg-[#344861]/10 focus:ring-2 focus:ring-[#344861] rounded-lg shadow-none",
    };
  } else if (htmlElement.classList.contains('theme-ocean-blue')) {
    return {
      default: "bg-[#1565c0] text-white hover:bg-[#1976d2]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-[#1565c0] text-[#1565c0] bg-background hover:bg-[#1976d2]/10 hover:text-[#1565c0]",
      secondary: "bg-[#42a5f5] text-white hover:bg-[#42a5f5]/80",
      ghost: "text-[#1565c0] hover:bg-[#1976d2]/10 hover:text-[#1565c0]",
      link: "text-[#1565c0] underline-offset-4 hover:underline",
      nav: "border border-[#344861] text-[#344861] bg-white hover:bg-[#344861]/10 focus:ring-2 focus:ring-[#344861] rounded-lg shadow-none",
    };
  } else if (htmlElement.classList.contains('theme-sunset-orange')) {
    return {
      default: "bg-[#e65100] text-white hover:bg-[#ef6c00]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-[#e65100] text-[#e65100] bg-background hover:bg-[#ef6c00]/10 hover:text-[#e65100]",
      secondary: "bg-[#ff9800] text-white hover:bg-[#ff9800]/80",
      ghost: "text-[#e65100] hover:bg-[#ef6c00]/10 hover:text-[#e65100]",
      link: "text-[#e65100] underline-offset-4 hover:underline",
      nav: "border border-[#344861] text-[#344861] bg-white hover:bg-[#344861]/10 focus:ring-2 focus:ring-[#344861] rounded-lg shadow-none",
    };
  } else if (htmlElement.classList.contains('theme-berry-purple')) {
    return {
      default: "bg-[#6a1b9a] text-white hover:bg-[#8e24aa]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-[#6a1b9a] text-[#6a1b9a] bg-background hover:bg-[#8e24aa]/10 hover:text-[#6a1b9a]",
      secondary: "bg-[#ab47bc] text-white hover:bg-[#ab47bc]/80",
      ghost: "text-[#6a1b9a] hover:bg-[#8e24aa]/10 hover:text-[#6a1b9a]",
      link: "text-[#6a1b9a] underline-offset-4 hover:underline",
      nav: "border border-[#344861] text-[#344861] bg-white hover:bg-[#344861]/10 focus:ring-2 focus:ring-[#344861] rounded-lg shadow-none",
    };
  } else if (htmlElement.classList.contains('theme-dark-mode')) {
    return {
      default: "bg-[#333333] text-white hover:bg-[#444444]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-white text-white bg-background hover:bg-white/10 hover:text-white",
      secondary: "bg-[#555555] text-white hover:bg-[#555555]/80",
      ghost: "text-white hover:bg-white/10 hover:text-white",
      link: "text-white underline-offset-4 hover:underline",
      nav: "border border-white/60 text-white bg-transparent hover:bg-white/10 focus:ring-2 focus:ring-white rounded-lg shadow-none",
    };
  } else {
    // Default purple theme
    return {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      nav: "border border-[#344861] text-[#344861] bg-white hover:bg-[#344861]/10 focus:ring-2 focus:ring-[#344861] rounded-lg shadow-none",
    };
  }
};

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "",
        nav: "",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        nav: "h-10 w-10 rounded-lg px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Get dynamic theme styles
    const [themeStyles, setThemeStyles] = React.useState(getThemeClass());
    
    // Update theme styles when theme changes
    React.useEffect(() => {
      const observer = new MutationObserver(() => {
        setThemeStyles(getThemeClass());
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      
      return () => observer.disconnect();
    }, []);
    
    // Apply theme-specific styles to the selected variant
    const getVariantClass = (variant: string | null) => {
      if (!variant) return '';
      return themeStyles[variant as keyof typeof themeStyles] || '';
    };
    
    return (
      <Comp
        className={cn(
          buttonVariants({ size, className }), 
          getVariantClass(variant || 'default')
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
