
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
  
  // Use a useEffect to apply event isolation to the calendar
  React.useEffect(() => {
    const calendar = calendarRef.current;
    if (!calendar) return;
    
    // Function that completely stops propagation and prevents default
    const isolateEvent = (e: Event) => {
      e.stopPropagation();
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopImmediatePropagation();
      return false; // Ensure the event doesn't continue
    };
    
    // List of all events we want to isolate
    const events = [
      'click', 'mousedown', 'mouseup', 'mousemove',
      'touchstart', 'touchend', 'touchmove',
      'pointerdown', 'pointerup', 'pointermove',
      'wheel', 'contextmenu'
    ];
    
    // Add all event listeners with capture phase to ensure they run first
    events.forEach(eventName => {
      calendar.addEventListener(eventName, isolateEvent, { capture: true });
    });
    
    // Add listeners to all child elements recursively
    const addIsolationToChildren = (element: Element) => {
      events.forEach(eventName => {
        element.addEventListener(eventName, isolateEvent, { capture: true });
      });
      
      Array.from(element.children).forEach(child => {
        addIsolationToChildren(child);
      });
    };
    
    // Apply to all existing children
    Array.from(calendar.children).forEach(addIsolationToChildren);
    
    // Create a mutation observer to handle dynamically added elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              addIsolationToChildren(node as Element);
            }
          });
        }
      });
    });
    
    // Start observing changes in the calendar
    observer.observe(calendar, {
      childList: true,
      subtree: true
    });
    
    // Clean up function
    return () => {
      // Remove all event listeners
      events.forEach(eventName => {
        calendar.removeEventListener(eventName, isolateEvent, { capture: true });
      });
      
      // Stop the observer
      observer.disconnect();
    };
  }, []);

  // React event handlers for synthetic events
  const stopSyntheticEvent = React.useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }
    return false;
  }, []);

  return (
    <div 
      ref={calendarRef}
      className={cn("relative z-50", className)}
      // Add all React synthetic event handlers
      onClick={stopSyntheticEvent}
      onMouseDown={stopSyntheticEvent}
      onMouseUp={stopSyntheticEvent}
      onTouchStart={stopSyntheticEvent}
      onTouchEnd={stopSyntheticEvent}
      onTouchMove={stopSyntheticEvent}
      onPointerDown={stopSyntheticEvent}
      onPointerUp={stopSyntheticEvent}
      onPointerMove={stopSyntheticEvent}
      // Ensure the calendar receives all pointer events
      style={{ 
        pointerEvents: 'auto',
        isolation: 'isolate',
        touchAction: 'none'
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
