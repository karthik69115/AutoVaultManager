const mongoose = require('mongoose');

const fuelEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  date: { type: Date, required: true },
  liters: { type: Number, required: true },
  cost: { type: Number, required: true },
  mileage: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FuelEntry', fuelEntrySchema);
