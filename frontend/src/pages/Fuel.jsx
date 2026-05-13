import React, { useEffect, useState } from "react";
import CrudListPage from "./CrudListPage";
import api from "../lib/api";
import { GlassCard } from "../components/ui-bits";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function FuelPage() {
  const [chart, setChart] = useState([]);

  useEffect(() => {
    api.get("/fuel").then((r) => {
      const data = [...r.data].reverse().map((f) => ({
        date: f.date?.slice(5),
        cost: f.cost,
        liters: f.liters,
      }));
      setChart(data);
    });
  }, []);

  return (
    <>
      {chart.length > 0 && (
        <GlassCard className="mb-6" testid="fuel-chart">
          <div className="av-overline mb-1">Trends</div>
          <h3 className="font-heading text-xl font-medium mb-4">Refuel timeline</h3>
          <div style={{ width: "100%", height: 224 }}>
            <ResponsiveContainer width="100%" height={224}>
              <LineChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#748CAB" fontSize={11} />
                <YAxis stroke="#748CAB" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0D1321", border: "1px solid rgba(116,140,171,0.3)", borderRadius: 12, color: "#F0EBD8" }} />
                <Line type="monotone" dataKey="cost" stroke="#F0EBD8" strokeWidth={2} animationDuration={900} />
                <Line type="monotone" dataKey="liters" stroke="#748CAB" strokeWidth={2} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}
      <CrudListPage
        kind="fuel"
        testidPrefix="fuel"
        title="Fuel Tracker"
        subtitle="Liters in, kilometers out — track every drop."
        columns={[
          { key: "date", label: "Date" },
          { key: "liters", label: "Liters", render: (v) => `${Number(v).toFixed(2)} L` },
          { key: "mileage", label: "Mileage (km)", render: (v) => Number(v).toLocaleString() },
          { key: "cost", label: "Cost", render: (v) => `$${Number(v).toFixed(2)}` },
        ]}
        fields={[
          { key: "liters", label: "Liters", type: "number" },
          { key: "cost", label: "Cost ($)", type: "number" },
          { key: "mileage", label: "Mileage at fill (km)", type: "number" },
        ]}
      />
    </>
  );
}
