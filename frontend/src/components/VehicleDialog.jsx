import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "@phosphor-icons/react";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1767272374026-178111631eca?w=900",
  "https://images.unsplash.com/photo-1771066176846-5dd7016b79a5?w=900",
  "https://images.unsplash.com/photo-1770608014330-7de6ce86c69d?w=900",
  "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900",
];

const empty = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  plate_number: "",
  mileage: 0,
  color: "",
  fuel_type: "Petrol",
  image_url: DEFAULT_IMAGES[0],
  insurance_expiry: "",
};

export default function VehicleDialog({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...empty, ...initial } : empty);
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onSave({
      ...form,
      year: Number(form.year),
      mileage: Number(form.mileage),
      insurance_expiry: form.insurance_expiry || null,
    });
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="vehicle-dialog"
        >
          <motion.form
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            className="av-glass w-full max-w-2xl p-7 max-h-[90vh] overflow-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="av-overline">{initial ? "Edit" : "New"}</div>
                <h3 className="font-heading text-2xl font-medium">{initial ? "Edit vehicle" : "Add a new vehicle"}</h3>
              </div>
              <button type="button" onClick={onClose} className="text-eggshell/60 hover:text-eggshell" data-testid="vehicle-dialog-close">
                <X size={22} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Brand">
                <input required className="av-input" value={form.brand} onChange={set("brand")} data-testid="vehicle-brand-input" />
              </Field>
              <Field label="Model">
                <input required className="av-input" value={form.model} onChange={set("model")} data-testid="vehicle-model-input" />
              </Field>
              <Field label="Year">
                <input required type="number" className="av-input" value={form.year} onChange={setNum("year")} data-testid="vehicle-year-input" />
              </Field>
              <Field label="Plate Number">
                <input required className="av-input" value={form.plate_number} onChange={set("plate_number")} data-testid="vehicle-plate-input" />
              </Field>
              <Field label="Mileage (km)">
                <input required type="number" className="av-input" value={form.mileage} onChange={setNum("mileage")} data-testid="vehicle-mileage-input" />
              </Field>
              <Field label="Color">
                <input className="av-input" value={form.color || ""} onChange={set("color")} data-testid="vehicle-color-input" />
              </Field>
              <Field label="Fuel Type">
                <select className="av-input" value={form.fuel_type} onChange={set("fuel_type")} data-testid="vehicle-fuel-type-input">
                  {["Petrol", "Diesel", "Electric", "Hybrid", "LPG"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Insurance Expiry">
                <input type="date" className="av-input" value={form.insurance_expiry || ""} onChange={set("insurance_expiry")} data-testid="vehicle-insurance-input" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Image URL">
                  <input className="av-input" value={form.image_url || ""} onChange={set("image_url")} data-testid="vehicle-image-input" />
                </Field>
                <div className="flex gap-2 mt-2">
                  {DEFAULT_IMAGES.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: src }))}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 ${form.image_url === src ? "border-denim" : "border-transparent"}`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <button type="button" className="av-btn-outline" onClick={onClose} data-testid="vehicle-dialog-cancel">Cancel</button>
              <button type="submit" className="av-btn" disabled={busy} data-testid="vehicle-dialog-save">{busy ? "Saving…" : (initial ? "Save changes" : "Add vehicle")}</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="av-overline block mb-2">{label}</span>
      {children}
    </label>
  );
}
