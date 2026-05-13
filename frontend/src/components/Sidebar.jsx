import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  House,
  Garage,
  Wrench,
  GasPump,
  CurrencyDollar,
  UserCircle,
  SignOut,
  CarProfile,
} from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";

const items = [
  { to: "/", label: "Dashboard", icon: House, end: true, tid: "nav-dashboard" },
  { to: "/garage", label: "My Garage", icon: Garage, tid: "nav-garage" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, tid: "nav-maintenance" },
  { to: "/fuel", label: "Fuel", icon: GasPump, tid: "nav-fuel" },
  { to: "/expenses", label: "Expenses", icon: CurrencyDollar, tid: "nav-expenses" },
  { to: "/profile", label: "Profile", icon: UserCircle, tid: "nav-profile" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 av-glass-strong border-r min-h-screen"
      style={{ borderColor: "rgba(116,140,171,0.18)" }}
      data-testid="sidebar"
    >
      <div className="px-6 py-7 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#3E5C76]/40 border border-[#748CAB]/30">
          <CarProfile size={24} weight="duotone" color="#F0EBD8" />
        </div>
        <div>
          <div className="font-heading text-lg font-semibold tracking-tight text-eggshell">AutoVault</div>
          <div className="av-overline">Digital Garage</div>
        </div>
      </div>

      <div className="av-divider mx-4 my-2" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it, i) => (
          <motion.div
            key={it.to}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <NavLink
              to={it.to}
              end={it.end}
              data-testid={it.tid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive ? "av-link-active" : "text-eggshell/70 hover:text-eggshell hover:bg-[#1D2D44]/60"
                }`
              }
            >
              <it.icon size={20} weight="duotone" />
              <span>{it.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="p-4">
        <div className="av-glass p-4 flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#3E5C76] flex items-center justify-center text-xs font-semibold">
            {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-eggshell truncate" data-testid="sidebar-user-name">{user?.name || "Driver"}</div>
            <div className="text-xs text-denim truncate">{user?.email}</div>
          </div>
        </div>
        <button
          className="av-btn-outline w-full justify-center"
          data-testid="logout-button"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <SignOut size={18} weight="duotone" /> Sign out
        </button>
      </div>
    </aside>
  );
}
