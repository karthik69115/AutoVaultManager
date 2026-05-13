import React, { useEffect, useState } from "react";
import CrudListPage from "./CrudListPage";
import api from "../lib/api";
import { GlassCard } from "../components/ui-bits";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function ExpensesPage() {
  const [chart, setChart] = useState([]);

  useEffect(() => {
    api.get("/expenses").then((r) => {
      const byMonth = {};
      r.data.forEach((e) => {
        const m = e.date?.slice(0, 7) || "—";
        byMonth[m] = (byMonth[m] || 0) + e.amount;
      });
      const arr = Object.entries(byMonth).map(([k, v]) => ({ month: k, total: Number(v.toFixed(2)) })).sort((a, b) => a.month.localeCompare(b.month));
      setChart(arr);
    });
  }, []);

  return (
    <>
      {chart.length > 0 && (
        <GlassCard className="mb-6" testid="expenses-chart">
          <div className="av-overline mb-1">Spend</div>
          <h3 className="font-heading text-xl font-medium mb-4">Monthly summary</h3>
          <div style={{ width: "100%", height: 224 }}>
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#748CAB" fontSize={11} />
                <YAxis stroke="#748CAB" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0D1321", border: "1px solid rgba(116,140,171,0.3)", borderRadius: 12, color: "#F0EBD8" }} />
                <Bar dataKey="total" fill="#3E5C76" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      )}
      <CrudListPage
        kind="expenses"
        testidPrefix="expenses"
        title="Expenses"
        subtitle="Insurance, registration, repairs — all in one ledger."
        columns={[
          { key: "category", label: "Category" },
          { key: "date", label: "Date" },
          { key: "amount", label: "Amount", render: (v) => `$${Number(v).toFixed(2)}` },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { key: "category", label: "Category", options: ["Insurance", "Registration", "Repairs", "Parking", "Toll", "Wash", "Other"] },
          { key: "amount", label: "Amount ($)", type: "number" },
          { key: "description", label: "Description", optional: true, span: 2 },
        ]}
      />
    </>
  );
}
