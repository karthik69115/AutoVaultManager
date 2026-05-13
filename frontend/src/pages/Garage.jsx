import React, { useEffect, useState } from "react";
import { GlassCard, PageHeader } from "../components/ui-bits";
import { Plus, MagnifyingGlass, PencilSimple, Trash, Car } from "@phosphor-icons/react";
import api from "../lib/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import VehicleDialog from "../components/VehicleDialog";

export default function Garage() {
  const [vehicles, setVehicles] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/vehicles").then((r) => setVehicles(r.data));
  useEffect(() => { load(); }, []);

  const filtered = vehicles.filter((v) => {
    const s = q.toLowerCase();
    return !s || [v.brand, v.model, v.plate_number, v.color].some((x) => (x || "").toLowerCase().includes(s));
  });

  const onSave = async (payload) => {
    if (editing) await api.put(`/vehicles/${editing.id}`, payload);
    else await api.post("/vehicles", payload);
    setOpen(false); setEditing(null);
    load();
  };
  const onDelete = async (v) => {
    if (!window.confirm(`Delete ${v.brand} ${v.model}?`)) return;
    await api.delete(`/vehicles/${v.id}`);
    load();
  };

  return (
    <div data-testid="garage-page">
      <PageHeader
        title="My Garage"
        subtitle="Every vehicle, logged and remembered."
        actions={
          <button className="av-btn" data-testid="add-vehicle-button" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={18} weight="bold" /> Add Vehicle
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="av-glass flex items-center px-4 py-2.5 flex-1 max-w-md">
          <MagnifyingGlass size={18} weight="duotone" className="text-denim mr-2" />
          <input
            className="bg-transparent outline-none flex-1 text-sm placeholder:text-eggshell/40"
            placeholder="Search by brand, model, plate…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="garage-search-input"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Car size={42} weight="duotone" className="mx-auto text-denim mb-4" />
          <div className="font-heading text-xl mb-1">No vehicles yet</div>
          <div className="text-eggshell/60 text-sm mb-5">Add your first car to start tracking maintenance, fuel and expenses.</div>
          <button className="av-btn" onClick={() => setOpen(true)} data-testid="empty-add-vehicle-button">
            <Plus size={18} weight="bold" /> Add Vehicle
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="av-glass overflow-hidden group"
                data-testid={`vehicle-card-${v.id}`}
              >
                <Link to={`/garage/${v.id}`} className="block">
                  <div className="h-44 overflow-hidden relative">
                    <img src={v.image_url || "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900"} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1D2D44] via-[#1D2D44]/30 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-ink/70 text-xs av-overline">{v.year}</div>
                  </div>
                  <div className="p-5">
                    <div className="font-heading text-xl">{v.brand} {v.model}</div>
                    <div className="text-xs text-eggshell/55 mt-1">{v.plate_number} · {v.color || "—"}</div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-eggshell/70">{v.mileage.toLocaleString()} km</span>
                      <span className="av-overline">{v.fuel_type}</span>
                    </div>
                  </div>
                </Link>
                <div className="px-5 pb-5 flex gap-2">
                  <button className="av-btn-outline flex-1 justify-center" onClick={() => { setEditing(v); setOpen(true); }} data-testid={`edit-vehicle-${v.id}`}>
                    <PencilSimple size={16} weight="duotone" /> Edit
                  </button>
                  <button className="av-btn-outline px-3" onClick={() => onDelete(v)} data-testid={`delete-vehicle-${v.id}`}>
                    <Trash size={16} weight="duotone" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <VehicleDialog
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={onSave}
        initial={editing}
      />
    </div>
  );
}
