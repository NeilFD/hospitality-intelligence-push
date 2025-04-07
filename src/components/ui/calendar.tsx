
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
  // Create a ref to access the calendar DOM element
  const calendarRef = React.useRef<HTMLDivElement>(null);

  // Use a more aggressive approach to stop all events at capture phase
  React.useEffect(() => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) return;

    // Function to handle all events at capture phase to prevent propagation
    const captureAllEvents = (event: Event) => {
      event.stopPropagation();
      
      // For certain events, we need to prevent default to avoid navigation issues
      if (event.type !== 'click' && event.cancelable) {
        event.preventDefault();
      }

      // Stop immediate propagation to ensure no other handlers execute
      if ('stopImmediatePropagation' in event) {
        event.stopImmediatePropagation();
      }
      
      // Important: Return true for click events to allow selection
      return event.type === 'click';
    };

    // List of all events we want to capture and stop
    const eventsToCapture = [
      'mousedown', 'mouseup', 'click', 'dblclick', 'mousemove',
      'touchstart', 'touchmove', 'touchend', 'touchcancel',
      'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
      'wheel', 'scroll', 'contextmenu', 'dragstart', 'drag',
      'drop', 'dragend', 'dragenter', 'dragleave', 'dragover'
    ];

    // Add capture event listeners to the calendar element
    eventsToCapture.forEach(eventType => {
      calendarElement.addEventListener(eventType, captureAllEvents, { capture: true });
    });

    // Apply event capturing to all child elements
    const applyEventCapturingToAllChildren = (element: Element) => {
      eventsToCapture.forEach(eventType => {
        element.addEventListener(eventType, captureAllEvents, { capture: true });
      });

      // Recursively apply to all children
      Array.from(element.children).forEach(child => {
        applyEventCapturingToAllChildren(child);
      });
    };

    // Apply to all existing children
    Array.from(calendarElement.children).forEach(child => {
      applyEventCapturingToAllChildren(child);
    });

    // Use MutationObserver to handle dynamically added elements
    const mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof Element) {
              applyEventCapturingToAllChildren(node);
            }
          });
        }
      });
    });

    // Start observing the calendar element for DOM changes
    mutationObserver.observe(calendarElement, { 
      childList: true,
      subtree: true 
    });

    // Clean up all event listeners and observers on unmount
    return () => {
      eventsToCapture.forEach(eventType => {
        calendarElement.removeEventListener(eventType, captureAllEvents, { capture: true });
      });
      
      // Recursively remove from all children
      const removeListenersRecursively = (element: Element) => {
        eventsToCapture.forEach(eventType => {
          element.removeEventListener(eventType, captureAllEvents, { capture: true });
        });

        Array.from(element.children).forEach(removeListenersRecursively);
      };
      
      Array.from(calendarElement.children).forEach(removeListenersRecursively);
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={calendarRef}
      className={cn("calendar-container", className)}
      style={{
        position: 'relative',
        zIndex: 999,
        touchAction: 'none',
        pointerEvents: 'auto',
        isolation: 'isolate',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        contain: 'content'
      }}
      // Add inline event handlers as backup
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
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
