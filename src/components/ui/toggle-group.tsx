
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => {
  const [themeStyles, setThemeStyles] = React.useState('bg-muted/50');
  
  React.useEffect(() => {
    const handleThemeChange = () => {
      const htmlElement = document.documentElement;
      if (htmlElement.classList.contains('theme-forest-green')) {
        setThemeStyles("bg-[#e8f5e9]/30");
      } else if (htmlElement.classList.contains('theme-ocean-blue')) {
        setThemeStyles("bg-[#e3f2fd]/30");
      } else if (htmlElement.classList.contains('theme-sunset-orange')) {
        setThemeStyles("bg-[#fff3e0]/30");
      } else if (htmlElement.classList.contains('theme-berry-purple')) {
        setThemeStyles("bg-[#f3e5f5]/30");
      } else if (htmlElement.classList.contains('theme-dark-mode')) {
        setThemeStyles("bg-[#424242]/30");
      } else if (htmlElement.classList.contains('theme-hi-purple')) {
        setThemeStyles("bg-[#e0d9f0]/30");
      } else {
        setThemeStyles("bg-muted/50");
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
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn(`flex items-center justify-center gap-1 p-1 rounded-md ${themeStyles}`, className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
})

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  const [themeStyles, setThemeStyles] = React.useState('');
  
  React.useEffect(() => {
    const handleThemeChange = () => {
      const htmlElement = document.documentElement;
      if (htmlElement.classList.contains('theme-forest-green')) {
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
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        themeStyles,
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
