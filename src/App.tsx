
import React from 'react';
import './App.css';
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import { ThemeProviderExtended } from './components/ui/theme-provider-extended';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from './components/ui/sonner';
import './theme-fixer';
import './theme-sidebar-fixer';
import './hiq-module-fixer'; // Import the HiQ module fixer

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <Sonner richColors closeButton position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
