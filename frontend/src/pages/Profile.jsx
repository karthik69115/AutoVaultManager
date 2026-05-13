import React from "react";
import { GlassCard, PageHeader } from "../components/ui-bits";
import { useAuth } from "../lib/auth";
import { UserCircle, EnvelopeSimple, ShieldCheck } from "@phosphor-icons/react";

export default function Profile() {
  const { user } = useAuth();
  return (
    <div data-testid="profile-page">
      <PageHeader title="Profile" subtitle="Your AutoVault account." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[#3E5C76] flex items-center justify-center font-heading text-3xl">
              {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="av-overline">Driver</div>
              <h2 className="font-heading text-3xl font-semibold mt-1">{user?.name || "Driver"}</h2>
              <div className="text-eggshell/60 text-sm">{user?.email}</div>
            </div>
          </div>
          <div className="av-divider my-7" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Cell icon={UserCircle} label="Name" value={user?.name || "—"} />
            <Cell icon={EnvelopeSimple} label="Email" value={user?.email || "—"} />
            <Cell icon={ShieldCheck} label="Role" value={user?.role || "user"} />
          </div>
        </GlassCard>
        <GlassCard>
          <div className="av-overline">Theme</div>
          <h3 className="font-heading text-xl font-medium mt-1 mb-4">Dark Premium</h3>
          <p className="text-eggshell/65 text-sm">
            AutoVault is tuned for night driving — a single, considered dark palette designed to keep the focus on the data, not the chrome.
          </p>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {["#0D1321", "#1D2D44", "#3E5C76", "#748CAB", "#F0EBD8"].map((c) => (
              <div key={c} className="h-10 rounded-lg border border-[#748CAB]/20" style={{ background: c }} />
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Cell({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#748CAB]/15 bg-[#0D1321]/40 p-4">
      <div className="flex items-center gap-2 text-denim mb-2">
        <Icon size={16} weight="duotone" />
        <span className="av-overline">{label}</span>
      </div>
      <div className="text-eggshell">{value}</div>
    </div>
  );
}
