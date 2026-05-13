import React from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="av-bg min-h-screen flex text-eggshell">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="px-5 md:px-10 py-8 max-w-7xl mx-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
