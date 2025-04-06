
import { useState } from "react";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export type ToastActionElement = React.ReactElement<{
  altText: string;
  onClick: () => void;
}>;

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = ({ title, description, action, variant = "default" }: {
    title?: string;
    description?: string;
    action?: ToastActionElement;
    variant?: "default" | "destructive";
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast = {
      id,
      title,
      description,
      action,
      variant,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
    
    return {
      id,
      dismiss: () => dismiss(id),
      update: (props: Partial<Toast>) => update({ id, ...props }),
    };
  };
  
  const dismiss = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };
  
  const update = ({
    id,
    title,
    description,
    action,
    variant,
  }: Partial<Toast> & { id: string }) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id
          ? {
              ...toast,
              ...(title !== undefined && { title }),
              ...(description !== undefined && { description }),
              ...(action !== undefined && { action }),
              ...(variant !== undefined && { variant }),
            }
          : toast
      )
    );
  };

  return {
    toasts,
    toast,
    dismiss,
    update,
  };
};

export { useToast };
