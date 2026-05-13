import React from "react";
import CrudListPage from "./CrudListPage";

export default function MaintenancePage() {
  return (
    <CrudListPage
      kind="maintenance"
      testidPrefix="maintenance"
      title="Maintenance"
      subtitle="Every service, neatly archived."
      columns={[
        { key: "service_type", label: "Service" },
        { key: "date", label: "Date" },
        { key: "next_service_date", label: "Next due" },
        { key: "cost", label: "Cost", render: (v) => `$${Number(v).toFixed(2)}` },
        { key: "notes", label: "Notes" },
      ]}
      fields={[
        { key: "service_type", label: "Service type", options: ["Oil Change", "Brake Pads", "Tire Rotation", "Battery", "Filter", "Inspection", "Engine", "Other"] },
        { key: "cost", label: "Cost ($)", type: "number" },
        { key: "next_service_date", label: "Next service date", type: "date", optional: true },
        { key: "notes", label: "Notes", optional: true, span: 2 },
      ]}
    />
  );
}
