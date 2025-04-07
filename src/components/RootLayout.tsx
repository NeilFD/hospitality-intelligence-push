
import React from "react";
import { Outlet } from "react-router-dom";
import Layout from "@/components/Layout";

interface RootLayoutProps {
  children?: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  // Render the Layout component with Outlet as its children
  // This pattern allows the Layout to wrap all routed content
  return (
    <>
      <Layout>
        {children || <Outlet />}
      </Layout>
    </>
  );
};

export default RootLayout;
