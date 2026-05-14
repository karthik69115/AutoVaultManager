const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  serviceType: { type: String, required: true },
  date: { type: Date, required: true },
  nextDue: { type: Date },
  cost: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);
