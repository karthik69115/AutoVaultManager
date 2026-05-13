import React from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";

export function StatCard({ label, value, prefix = "", suffix = "", decimals = 0, icon: Icon, accent = "#748CAB", testid }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="av-glass p-6 relative overflow-hidden group"
      data-testid={testid}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="av-overline">{label}</div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{ background: `${accent}22`, borderColor: `${accent}55` }}
          >
            <Icon size={20} weight="duotone" color={accent} />
          </div>
        )}
      </div>
      <div className="text-4xl font-heading font-semibold tracking-tight text-eggshell">
        {prefix}
        <CountUp end={value} duration={1.2} decimals={decimals} separator="," />
        {suffix}
      </div>
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${accent}, transparent)` }}
      />
    </motion.div>
  );
}

export function GlassCard({ children, className = "", testid }) {
  return (
    <div className={`av-glass p-6 ${className}`} data-testid={testid}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, testid }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-8" data-testid={testid}>
      <div>
        <div className="av-overline mb-2">AutoVault</div>
        <h1 className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-eggshell">{title}</h1>
        {subtitle && <p className="text-eggshell/60 mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
