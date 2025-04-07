
import { Outlet } from "react-router-dom";
import Layout from "@/components/Layout";

const RootLayout = () => {
  // Directly render the Layout component with Outlet as its children
  // This pattern allows the Layout to wrap all routed content
  return <Layout><Outlet /></Layout>;
};

export default RootLayout;
