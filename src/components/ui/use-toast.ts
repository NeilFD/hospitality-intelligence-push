// We're using Sonner for toast functionality but still need to keep this file
// to avoid import errors in the codebase
import { toast } from "sonner";

export { toast };
export const useToast = () => ({ 
  toast,
  toasts: [] 
});
