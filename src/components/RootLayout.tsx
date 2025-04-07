
import { Outlet } from "react-router-dom";
import Layout from "@/components/Layout";

const RootLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default RootLayout;
