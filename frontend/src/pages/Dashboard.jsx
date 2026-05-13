import React, { useEffect, useState } from "react";
import { GlassCard, PageHeader, StatCard } from "../components/ui-bits";
import {
  Car,
  CurrencyDollar,
  GasPump,
  Wrench,
  Bell,
  Plus,
} from "@phosphor-icons/react";
import api from "../lib/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/vehicles")]).then(([s, v]) => {
      setStats(s.data);
      setVehicles(v.data);
    });
  }, []);

  const vMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  return (
    <div data-testid="dashboard-page">
      <PageHeader
        title="Welcome back, driver."
        subtitle="A quiet command center for every vehicle in your garage."
        actions={
          <Link to="/garage" className="av-btn" data-testid="dashboard-add-vehicle">
            <Plus size={18} weight="bold" /> Add Vehicle
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard testid="stat-vehicles" label="Vehicles" value={stats?.total_vehicles || 0} icon={Car} accent="#748CAB" />
        <StatCard testid="stat-expenses" label="Lifetime Spend" value={stats?.total_expense || 0} decimals={0} prefix="$" icon={CurrencyDollar} accent="#F0EBD8" />
        <StatCard testid="stat-fuel" label="Fuel Cost" value={stats?.total_fuel_cost || 0} decimals={0} prefix="$" icon={GasPump} accent="#3E5C76" />
        <StatCard testid="stat-liters" label="Liters Pumped" value={stats?.total_liters || 0} decimals={0} suffix=" L" icon={GasPump} accent="#748CAB" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming services */}
        <GlassCard className="lg:col-span-2" testid="upcoming-services-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="av-overline">Upcoming services</div>
              <h2 className="font-heading text-2xl font-medium mt-1">Next on the workshop calendar</h2>
            </div>
            <Bell size={22} weight="duotone" className="text-denim" />
          </div>
          {stats?.upcoming_services?.length ? (
            <ul className="space-y-3">
              {stats.upcoming_services.map((s) => {
                const v = vMap[s.vehicle_id];
                const overdue = s.days_left < 0;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#748CAB]/15 bg-[#0D1321]/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#3E5C76]/40 flex items-center justify-center">
                        <Wrench size={18} weight="duotone" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">{s.service_type}</div>
                        <div className="text-xs text-eggshell/55 truncate">
                          {v ? `${v.brand} ${v.model} · ${v.plate_number}` : "—"}
                        </div>
                      </div>
                    </div>
                    <div className={`text-sm ${overdue ? "text-[#e8a3a3]" : "text-eggshell/80"}`}>
                      {overdue ? `${Math.abs(s.days_left)}d overdue` : `in ${s.days_left}d`}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty label="No upcoming services. Enjoy the road." />
          )}
        </GlassCard>

        {/* Activity */}
        <GlassCard testid="activity-card">
          <div className="av-overline">Recent activity</div>
          <h2 className="font-heading text-2xl font-medium mt-1 mb-5">Latest entries</h2>
          {stats?.activity?.length ? (
            <ul className="space-y-3">
              {stats.activity.map((a, i) => {
                const v = vMap[a.vehicle_id];
                const Icon = a.type === "fuel" ? GasPump : a.type === "maintenance" ? Wrench : CurrencyDollar;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={18} weight="duotone" className="text-denim shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm truncate">{a.label}</div>
                        <div className="text-xs text-eggshell/50 truncate">
                          {v ? `${v.brand} ${v.model}` : "—"} · {a.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">${a.amount.toFixed(0)}</div>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <Empty label="No activity yet." />
          )}
        </GlassCard>
      </div>

      {/* Quick vehicles */}
      {vehicles.length > 0 && (
        <div className="mt-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="av-overline">Your garage</div>
              <h2 className="font-heading text-2xl font-medium mt-1">Pinned vehicles</h2>
            </div>
            <Link to="/garage" className="av-btn-outline" data-testid="dashboard-view-garage">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {vehicles.slice(0, 3).map((v) => (
              <Link
                to={`/garage/${v.id}`}
                key={v.id}
                className="av-glass overflow-hidden group hover:-translate-y-1 transition-transform"
                data-testid={`dashboard-vehicle-${v.id}`}
              >
                <div className="h-40 overflow-hidden relative">
                  <img src={v.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1D2D44] via-[#1D2D44]/40 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="av-overline">{v.year} · {v.plate_number}</div>
                  <div className="font-heading text-xl mt-1">{v.brand} {v.model}</div>
                  <div className="text-xs text-eggshell/55 mt-2">{v.mileage.toLocaleString()} km</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ label }) {
  return <div className="text-sm text-eggshell/50 py-8 text-center">{label}</div>;
}
