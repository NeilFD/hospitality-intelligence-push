
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const [themeStyles, setThemeStyles] = React.useState(() => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('theme-forest-green')) {
      return "bg-transparent";
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return "bg-transparent";
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return "bg-transparent";
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return "bg-transparent";
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return "bg-transparent";
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return "bg-transparent";
    } else {
      return "bg-transparent";
    }
  });
  
  React.useEffect(() => {
    const handleThemeChange = () => {
      setThemeStyles("bg-transparent");
    };
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);
  
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        `inline-flex h-10 items-center justify-center rounded-md ${themeStyles} p-1 text-muted-foreground`,
        className
      )}
      {...props}
    />
  );
});

TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const [themeStyles, setThemeStyles] = React.useState(() => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('theme-forest-green')) {
      return "data-[state=active]:bg-[#1b5e20] data-[state=active]:text-white";
    } else if (htmlElement.classList.contains('theme-ocean-blue')) {
      return "data-[state=active]:bg-[#1565c0] data-[state=active]:text-white";
    } else if (htmlElement.classList.contains('theme-sunset-orange')) {
      return "data-[state=active]:bg-[#e65100] data-[state=active]:text-white";
    } else if (htmlElement.classList.contains('theme-berry-purple')) {
      return "data-[state=active]:bg-[#6a1b9a] data-[state=active]:text-white";
    } else if (htmlElement.classList.contains('theme-dark-mode')) {
      return "data-[state=active]:bg-[#333333] data-[state=active]:text-white";
    } else if (htmlElement.classList.contains('theme-hi-purple')) {
      return "data-[state=active]:bg-[#806cac] data-[state=active]:text-white";
    } else {
      return "data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground";
    }
  });
  
  React.useEffect(() => {
    const handleThemeChange = () => {
      const htmlElement = document.documentElement;
      if (htmlElement.classList.contains('theme-forest-green')) {
        setThemeStyles("data-[state=active]:bg-[#1b5e20] data-[state=active]:text-white");
      } else if (htmlElement.classList.contains('theme-ocean-blue')) {
        setThemeStyles("data-[state=active]:bg-[#1565c0] data-[state=active]:text-white");
      } else if (htmlElement.classList.contains('theme-sunset-orange')) {
        setThemeStyles("data-[state=active]:bg-[#e65100] data-[state=active]:text-white");
      } else if (htmlElement.classList.contains('theme-berry-purple')) {
        setThemeStyles("data-[state=active]:bg-[#6a1b9a] data-[state=active]:text-white");
      } else if (htmlElement.classList.contains('theme-dark-mode')) {
        setThemeStyles("data-[state=active]:bg-[#333333] data-[state=active]:text-white");
      } else if (htmlElement.classList.contains('theme-hi-purple')) {
        setThemeStyles("data-[state=active]:bg-[#806cac] data-[state=active]:text-white");
      } else {
        setThemeStyles("data-[state=active]:bg-primary/90 data-[state=active]:text-primary-foreground");
      }
    };
    
    document.addEventListener('themeClassChanged', handleThemeChange);
    return () => {
      document.removeEventListener('themeClassChanged', handleThemeChange);
    };
  }, []);
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:bg-accent hover:text-accent-foreground",
        themeStyles,
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
