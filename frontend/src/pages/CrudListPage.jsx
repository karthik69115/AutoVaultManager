import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { GlassCard, PageHeader } from "../components/ui-bits";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Generic CRUD list page used for maintenance, fuel and expenses.
 * Pass `kind` ("maintenance" | "fuel" | "expenses") and a `fields` definition.
 */
export default function CrudListPage({
  kind,
  title,
  subtitle,
  columns,
  fields,
  testidPrefix,
}) {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [data, v] = await Promise.all([
      api.get(`/${kind}`, { params: vehicleFilter ? { vehicle_id: vehicleFilter } : {} }),
      api.get("/vehicles"),
    ]);
    setItems(data.data);
    setVehicles(v.data);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [vehicleFilter]);

  const vMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));

  const save = async (payload) => {
    if (editing) await api.put(`/${kind}/${editing.id}`, payload);
    else await api.post(`/${kind}`, payload);
    setOpen(false); setEditing(null);
    load();
  };
  const remove = async (item) => {
    if (!window.confirm("Delete this entry?")) return;
    await api.delete(`/${kind}/${item.id}`);
    load();
  };

  return (
    <div data-testid={`${testidPrefix}-page`}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <button className="av-btn" data-testid={`${testidPrefix}-add-button`} onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={18} weight="bold" /> Add entry
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <select
          className="av-input max-w-xs"
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          data-testid={`${testidPrefix}-vehicle-filter`}
        >
          <option value="">All vehicles</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate_number}</option>)}
        </select>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="font-heading text-xl mb-1">No entries yet</div>
            <div className="text-eggshell/60 text-sm mb-5">Track your first entry to see it here.</div>
            <button className="av-btn" onClick={() => setOpen(true)} data-testid={`${testidPrefix}-empty-add`}>
              <Plus size={18} weight="bold" /> Add entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="av-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  {columns.map((c) => <th key={c.key}>{c.label}</th>)}
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const v = vMap[it.vehicle_id];
                  return (
                    <tr key={it.id} data-testid={`${testidPrefix}-row-${it.id}`}>
                      <td>{v ? `${v.brand} ${v.model}` : "—"}</td>
                      {columns.map((c) => <td key={c.key}>{c.render ? c.render(it[c.key], it) : (it[c.key] ?? "—")}</td>)}
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <button className="av-btn-outline px-3 py-1.5" onClick={() => { setEditing(it); setOpen(true); }} data-testid={`${testidPrefix}-edit-${it.id}`}>
                            <PencilSimple size={14} />
                          </button>
                          <button className="av-btn-outline px-3 py-1.5" onClick={() => remove(it)} data-testid={`${testidPrefix}-delete-${it.id}`}>
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <EntryDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={save}
        initial={editing}
        fields={fields}
        vehicles={vehicles}
        title={title}
        testidPrefix={testidPrefix}
      />
    </div>
  );
}

function EntryDialog({ open, onClose, onSave, initial, fields, vehicles, title, testidPrefix }) {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = { vehicle_id: vehicles[0]?.id || "", date: new Date().toISOString().slice(0, 10) };
    fields.forEach((f) => { base[f.key] = f.default !== undefined ? f.default : (f.type === "number" ? 0 : ""); });
    setForm(initial ? { ...base, ...initial } : base);
  }, [open, initial, fields, vehicles]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form };
    fields.forEach((f) => { if (f.type === "number") payload[f.key] = Number(payload[f.key] || 0); });
    await onSave(payload);
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid={`${testidPrefix}-dialog`}
        >
          <motion.form
            initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()} onSubmit={submit}
            className="av-glass w-full max-w-lg p-7"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="av-overline">{initial ? "Edit" : "New"}</div>
                <h3 className="font-heading text-2xl font-medium">{title} entry</h3>
              </div>
              <button type="button" onClick={onClose} className="text-eggshell/60 hover:text-eggshell"><X size={22} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="av-overline block mb-2">Vehicle</span>
                <select className="av-input" required value={form.vehicle_id || ""} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))} data-testid={`${testidPrefix}-dialog-vehicle`}>
                  <option value="" disabled>Select vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate_number}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="av-overline block mb-2">Date</span>
                <input required type="date" className="av-input" value={form.date || ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} data-testid={`${testidPrefix}-dialog-date`} />
              </label>
              {fields.map((f) => (
                <label key={f.key} className={`block ${f.span === 2 ? "md:col-span-2" : ""}`}>
                  <span className="av-overline block mb-2">{f.label}</span>
                  {f.options ? (
                    <select className="av-input" value={form[f.key] || ""} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} data-testid={`${testidPrefix}-dialog-${f.key}`}>
                      {f.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      required={!f.optional}
                      type={f.type || "text"}
                      step={f.type === "number" ? "any" : undefined}
                      className="av-input"
                      value={form[f.key] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                      data-testid={`${testidPrefix}-dialog-${f.key}`}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-7">
              <button type="button" className="av-btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="av-btn" disabled={busy} data-testid={`${testidPrefix}-dialog-save`}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
