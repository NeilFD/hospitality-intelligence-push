
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-lg border border-[#344861] bg-white px-3 py-2 text-sm text-[#344861] ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#344861] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#344861]/10",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[100] min-w-[8rem] overflow-auto rounded-md border bg-white text-popover-foreground shadow-md animate-in fade-in-80",
        position === "popper" && "translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollableViewport position={position}>
        {children}
      </SelectScrollableViewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

// Create a draggable viewport component with touch and mouse drag scroll support
const SelectScrollableViewport = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Viewport> & {
    position?: "popper" | "item-aligned";
  }
>(({ className, children, position = "popper", ...props }, ref) => {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  // Handle mouse events for drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!viewportRef.current) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setScrollTop(viewportRef.current.scrollTop);
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !viewportRef.current) return;
    const deltaY = startY - e.clientY;
    viewportRef.current.scrollTop = scrollTop + deltaY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!viewportRef.current) return;
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setScrollTop(viewportRef.current.scrollTop);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !viewportRef.current) return;
    const deltaY = startY - e.touches[0].clientY;
    viewportRef.current.scrollTop = scrollTop + deltaY;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  React.useEffect(() => {
    const viewport = viewportRef.current;
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startY, scrollTop]);

  // Add scrollbar styles to the document head
  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.textContent = `
      /* Webkit scrollbar styles (Chrome, Safari, Edge) */
      .select-scrollable-viewport::-webkit-scrollbar {
        width: 16px;
        height: 16px;
        display: block !important;
        -webkit-appearance: none;
      }
      
      .select-scrollable-viewport::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
        border: 1px solid #ddd;
      }
      
      .select-scrollable-viewport::-webkit-scrollbar-thumb {
        background: #9b87f5;
        border-radius: 10px;
        border: 2px solid #f1f1f1;
        box-shadow: 0 0 3px rgba(0,0,0,0.3);
      }
      
      .select-scrollable-viewport::-webkit-scrollbar-thumb:hover {
        background: #8B5CF6;
      }

      /* Firefox scrollbar */
      .select-scrollable-viewport {
        scrollbar-width: auto !important;
        scrollbar-color: #9b87f5 #f1f1f1 !important;
      }
      
      /* Make sure scrollbar is always visible */
      .select-scrollable-viewport {
        overflow-y: scroll !important;
        overflow: -moz-scrollbars-vertical !important;
        overflow: -webkit-scrollbars-vertical !important;
      }
      
      /* Safari specific scrollbar styles */
      @supports (-webkit-overflow-scrolling: touch) {
        .select-scrollable-viewport {
          -webkit-overflow-scrolling: touch;
        }
        .select-scrollable-viewport::-webkit-scrollbar {
          width: 18px;
          background-color: rgba(0, 0, 0, 0.1);
        }
        .select-scrollable-viewport::-webkit-scrollbar-thumb {
          background-color: rgba(155, 135, 245, 0.8);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <SelectPrimitive.Viewport
      ref={(node) => {
        // Merge refs
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        if (viewportRef) viewportRef.current = node as HTMLDivElement;
      }}
      className={cn(
        "p-1 pr-3 cursor-grab active:cursor-grabbing select-scrollable-viewport safari-scrollbar",
        position === "popper" &&
          "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        className
      )}
      style={{
        maxHeight: "300px",
        overflowY: "scroll",
        WebkitOverflowScrolling: "touch",
        msOverflowStyle: "scrollbar", /* for IE and Edge */
        scrollbarWidth: "auto",
        scrollbarColor: "#9b87f5 #f1f1f1",
        paddingRight: "24px", /* Increase padding to accommodate the scrollbar */
        boxSizing: "border-box"
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      {...props}
    >
      {children}
    </SelectPrimitive.Viewport>
  );
});
SelectScrollableViewport.displayName = "SelectScrollableViewport";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    style?: React.CSSProperties;
  }
>(({ className, children, style, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    style={style}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
