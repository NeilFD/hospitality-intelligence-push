import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    onClick={e => e.stopPropagation()}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => {
  // Create a ref for event handling
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  
  // Merge refs
  const setRefs = React.useCallback(
    (element: HTMLDivElement | null) => {
      // Update our local ref
      contentRef.current = element;
      
      // Forward the ref
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    },
    [ref]
  );
  
  // Create a React.MutableRefObject from the refs to avoid type errors
  const combinedRef = React.useMemo(() => ({
    get current() {
      return contentRef.current;
    },
    set current(value) {
      contentRef.current = value;
      if (ref) {
        if (typeof ref === 'function') {
          ref(value);
        } else {
          ref.current = value;
        }
      }
    }
  }), [ref]);
  
  // Use mutation observer to ensure event handlers are applied to dynamically added elements
  React.useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    
    // Create a function that stops all events
    const stopAllEvents = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    
    // Function to add event listeners to an element and all its children
    const addEventListenersDeep = (el: Element) => {
      // List of all events we want to stop
      const events = [
        'click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 
        'touchmove', 'mousemove', 'pointermove', 'pointerdown', 'pointerup',
        'wheel', 'contextmenu'
      ];
      
      // Add listeners for all events with capture phase
      events.forEach(eventType => {
        el.addEventListener(eventType, stopAllEvents, { capture: true });
      });
      
      // Process all children recursively
      Array.from(el.children).forEach(child => {
        addEventListenersDeep(child);
      });
    };
    
    // Add event listeners to the alert dialog content and all its children
    addEventListenersDeep(element);
    
    // Create and configure the MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // ELEMENT_NODE
              addEventListenersDeep(node as Element);
            }
          });
        }
      });
    });
    
    // Start observing
    observer.observe(element, { 
      childList: true,
      subtree: true
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Event handler function
  const stopPropagation = React.useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }
  }, []);
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={combinedRef}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg pointer-events-auto",
          className
        )}
        {...props}
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
        onTouchStart={stopPropagation}
        onTouchEnd={stopPropagation}
        onPointerDown={stopPropagation}
        onPointerUp={stopPropagation}
        style={{ 
          isolation: 'isolate', 
          pointerEvents: 'auto',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          ...props.style
        }}
      />
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
    onClick={e => e.stopPropagation()}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
    onClick={e => e.stopPropagation()}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
    onClick={e => e.stopPropagation()}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
    onClick={e => e.stopPropagation()}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
    onClick={(e) => {
      e.stopPropagation();
      if (props.onClick) {
        props.onClick(e);
      }
    }}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
    onClick={(e) => {
      e.stopPropagation();
      if (props.onClick) {
        props.onClick(e);
      }
    }}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
