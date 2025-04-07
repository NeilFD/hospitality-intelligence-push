import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
    onClick={e => e.stopPropagation()}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
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
    
    // Add event listeners to the drawer content and all its children
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

  // Synthetic event handlers for React events
  const stopPropagation = React.useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }
  }, []);

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={combinedRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background pointer-events-auto",
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
      >
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
    onClick={e => e.stopPropagation()}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
    onClick={e => e.stopPropagation()}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
    onClick={e => e.stopPropagation()}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
    onClick={e => e.stopPropagation()}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
