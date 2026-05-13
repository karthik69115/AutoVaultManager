import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import { GlassCard, PageHeader, StatCard } from "../components/ui-bits";
import { ArrowLeft, Wrench, GasPump, CurrencyDollar, Car } from "@phosphor-icons/react";
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#3E5C76", "#748CAB", "#F0EBD8", "#8FA9C7", "#5A7290"];

export default function VehicleDetail() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [maint, setMaint] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      const v = await api.get("/vehicles").then((r) => r.data.find((x) => x.id === id));
      setVehicle(v);
      const [m, f, e] = await Promise.all([
        api.get("/maintenance", { params: { vehicle_id: id } }),
        api.get("/fuel", { params: { vehicle_id: id } }),
        api.get("/expenses", { params: { vehicle_id: id } }),
      ]);
      setMaint(m.data); setFuel(f.data); setExpenses(e.data);
    })();
  }, [id]);

  if (!vehicle) return <div className="text-eggshell/60">Loading…</div>;

  const fuelChart = [...fuel].reverse().map((f) => ({
    date: f.date.slice(5),
    efficiency: f.liters > 0 ? Number((100 / (f.liters / Math.max(1, f.mileage / 100))).toFixed(2)) : 0,
    liters: f.liters,
    cost: f.cost,
  }));

  const expByCat = Object.values(
    [...expenses, ...maint.map((m) => ({ category: "Maintenance", amount: m.cost })), ...fuel.map((f) => ({ category: "Fuel", amount: f.cost }))]
      .reduce((acc, e) => {
        acc[e.category] = acc[e.category] || { name: e.category, value: 0 };
        acc[e.category].value += e.amount;
        return acc;
      }, {})
  );

  const totalSpend = expByCat.reduce((s, x) => s + x.value, 0);
  const efficiency = fuelChart.length ? Number((fuelChart.reduce((s, x) => s + x.efficiency, 0) / fuelChart.length).toFixed(2)) : 0;

  return (
    <div data-testid="vehicle-detail-page">
      <Link to="/garage" className="av-btn-outline mb-6" data-testid="back-to-garage"><ArrowLeft size={16} /> Back to garage</Link>

      <div className="av-glass overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="h-64 lg:h-auto relative">
            <img src={vehicle.image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#1D2D44]" />
          </div>
          <div className="p-8">
            <div className="av-overline">{vehicle.year} · {vehicle.plate_number}</div>
            <h1 className="font-heading text-4xl font-semibold mt-1 mb-3">{vehicle.brand} {vehicle.model}</h1>
            <div className="grid grid-cols-2 gap-4 text-sm mt-6">
              <Info label="Mileage" value={`${vehicle.mileage.toLocaleString()} km`} />
              <Info label="Color" value={vehicle.color || "—"} />
              <Info label="Fuel" value={vehicle.fuel_type} />
              <Info label="Insurance" value={vehicle.insurance_expiry || "—"} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard testid="vd-stat-spend" label="Total spend" value={totalSpend} prefix="$" icon={CurrencyDollar} />
        <StatCard testid="vd-stat-maint" label="Services" value={maint.length} icon={Wrench} />
        <StatCard testid="vd-stat-fuel" label="Refuels" value={fuel.length} icon={GasPump} />
        <StatCard testid="vd-stat-eff" label="Avg L/100km" value={efficiency} decimals={2} icon={Car} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="lg:col-span-2">
          <div className="av-overline">Fuel</div>
          <h3 className="font-heading text-xl font-medium mb-4">Refuel history</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#748CAB" fontSize={11} />
                <YAxis stroke="#748CAB" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0D1321", border: "1px solid rgba(116,140,171,0.3)", borderRadius: 12, color: "#F0EBD8" }} />
                <Line type="monotone" dataKey="cost" stroke="#F0EBD8" strokeWidth={2} dot={{ r: 3, fill: "#F0EBD8" }} animationDuration={900} />
                <Line type="monotone" dataKey="liters" stroke="#748CAB" strokeWidth={2} dot={{ r: 3, fill: "#748CAB" }} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="av-overline">Breakdown</div>
          <h3 className="font-heading text-xl font-medium mb-4">Spend by category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expByCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {expByCat.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1321", border: "1px solid rgba(116,140,171,0.3)", borderRadius: 12, color: "#F0EBD8" }} />
                <Legend wrapperStyle={{ color: "#F0EBD8", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Maintenance timeline */}
      <GlassCard className="mb-8" testid="maintenance-timeline">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="av-overline">Maintenance</div>
            <h3 className="font-heading text-xl font-medium">Timeline</h3>
          </div>
        </div>
        {maint.length === 0 ? (
          <div className="text-sm text-eggshell/50 py-6">No services recorded for this vehicle.</div>
        ) : (
          <ol className="relative border-l border-[#748CAB]/25 ml-3 space-y-5">
            {maint.map((m) => (
              <li key={m.id} className="pl-6 relative">
                <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#3E5C76] border-2 border-[#748CAB]" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{m.service_type}</div>
                    <div className="text-xs text-eggshell/55">{m.date}{m.next_service_date ? ` · next ${m.next_service_date}` : ""}</div>
                  </div>
                  <div className="text-sm text-eggshell/80">${m.cost.toFixed(2)}</div>
                </div>
                {m.notes && <div className="text-sm text-eggshell/60 mt-1">{m.notes}</div>}
              </li>
            ))}
          </ol>
        )}
      </GlassCard>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="av-overline">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}
