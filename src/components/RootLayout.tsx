
import React from "react";
import { Outlet } from "react-router-dom";
import Layout from "@/components/Layout";
import { ThemeProviderExtended } from "@/components/ui/theme-provider-extended";

interface RootLayoutProps {
  children?: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  // Wrap the Layout component with ThemeProviderExtended inside the Router context
  return (
    <ThemeProviderExtended>
      <Layout>
        {children || <Outlet />}
      </Layout>
    </ThemeProviderExtended>
  );
};

export default RootLayout;
