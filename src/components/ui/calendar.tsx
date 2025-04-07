
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // Create a ref to access the DOM element
  const calendarRef = React.useRef<HTMLDivElement>(null);
  
  // Handle all events that try to bubble up
  const stopPropagation = React.useCallback((e: React.UIEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }
    return false;
  }, []);
  
  // Handle click events specifically
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    // Stop propagation but don't prevent default to allow selection
    e.stopPropagation();
  }, []);
  
  // Use useEffect to apply complete event isolation
  React.useEffect(() => {
    const calendar = calendarRef.current;
    if (!calendar) return;
    
    // Create a function that stops all events but allows internal functionality
    const isolateEvents = (e: Event) => {
      // Stop the event from bubbling up
      e.stopPropagation();
      
      // Only prevent default for non-essential events
      if (e.type !== 'click' && e.cancelable) {
        e.preventDefault();
      }
      
      // Stop immediate propagation to ensure no other handlers execute
      e.stopImmediatePropagation();
    };
    
    // Array of events to stop propagation for
    const events = [
      'mousedown', 'mouseup', 'mousemove',
      'pointerdown', 'pointerup', 'pointermove',
      'touchstart', 'touchend', 'touchmove',
      'wheel', 'contextmenu'
    ];
    
    // For click events, we need special handling
    const handleClickCapture = (e: Event) => {
      e.stopPropagation();
      // Don't prevent default for click events to allow button clicks
    };
    
    // Add all event listeners with capture phase to ensure they run first
    events.forEach(eventName => {
      calendar.addEventListener(eventName, isolateEvents, { capture: true });
    });
    
    // Add special handling for click events
    calendar.addEventListener('click', handleClickCapture, { capture: true });
    
    // Create an observer to apply event isolation to all children
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof Element) {
              // Add event listeners to all newly added elements
              events.forEach(eventName => {
                node.addEventListener(eventName, isolateEvents, { capture: true });
              });
              node.addEventListener('click', handleClickCapture, { capture: true });
              
              // Apply to all children as well
              node.querySelectorAll('*').forEach(element => {
                events.forEach(eventName => {
                  element.addEventListener(eventName, isolateEvents, { capture: true });
                });
                element.addEventListener('click', handleClickCapture, { capture: true });
              });
            }
          });
        }
      });
    });
    
    // Start observing for dynamically added elements
    observer.observe(calendar, {
      childList: true,
      subtree: true
    });
    
    // Clean up function
    return () => {
      events.forEach(eventName => {
        calendar.removeEventListener(eventName, isolateEvents, { capture: true });
      });
      calendar.removeEventListener('click', handleClickCapture, { capture: true });
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={calendarRef}
      className={cn("fixed-position-calendar", className)}
      onClick={handleClick}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onMouseMove={stopPropagation}
      onTouchStart={stopPropagation}
      onTouchEnd={stopPropagation}
      onTouchMove={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerUp={stopPropagation}
      onPointerMove={stopPropagation}
      onWheel={stopPropagation}
      onContextMenu={stopPropagation}
      style={{ 
        position: 'relative',
        zIndex: 999,
        pointerEvents: 'auto',
        isolation: 'isolate',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3 pointer-events-auto", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
