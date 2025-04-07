
import { Outlet } from "react-router-dom";
import Layout from "@/components/Layout";
import React from "react";

interface RootLayoutProps {
  children?: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  // Render the Layout component with Outlet as its children
  // This pattern allows the Layout to wrap all routed content
  return (
    <Layout>
      {children || <Outlet />}
    </Layout>
  );
};

export default RootLayout;
