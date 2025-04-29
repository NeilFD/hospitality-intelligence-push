
import React, { useEffect } from 'react';
import './App.css';
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider-extended';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from './components/ui/sonner';
import './theme-fixer';
import './theme-sidebar-fixer';
import './hiq-module-fixer'; // Import the HiQ module fixer

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <RouterProvider router={router} />
        <Toaster />
        <Sonner richColors closeButton position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
