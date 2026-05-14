const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const FuelEntry = require('../models/FuelEntry');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Vehicle count ──────────────────────────────────────────────
    const vehicles = await Vehicle.find({ userId });
    const vehicleCount = vehicles.length;

    // ── Maintenance ────────────────────────────────────────────────
    const maintenanceRecords = await Maintenance.find({ userId }).sort({ date: -1 });
    const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

    // ── Fuel ───────────────────────────────────────────────────────
    const fuelRecords = await FuelEntry.find({ userId }).sort({ date: -1 });
    const totalFuelCost = fuelRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalLiters = fuelRecords.reduce((sum, r) => sum + (r.liters || 0), 0);

    // ── Expenses ───────────────────────────────────────────────────
    const expenseRecords = await Expense.find({ userId }).sort({ date: -1 });
    const totalOtherCost = expenseRecords.reduce((sum, r) => sum + (r.amount || 0), 0);

    const lifetimeSpend = totalMaintenanceCost + totalFuelCost + totalOtherCost;
    const fuelCost = totalFuelCost;

    // ── Upcoming Services (maintenance records in the future) ─────
    const now = new Date();
    const upcomingServices = maintenanceRecords
      .filter(r => r.nextDue && new Date(r.nextDue) >= now)
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
      .slice(0, 5)
      .map(r => {
        const vehicle = vehicles.find(v => v._id.toString() === r.vehicleId?.toString());
        return {
          serviceType: r.serviceType,
          nextDue: r.nextDue,
          vehicleId: vehicle ? { make: vehicle.make, model: vehicle.model, plate: vehicle.plate || '' } : null
        };
      });

    // ── Recent Activity (merge last 10 across fuel, maintenance, expenses) ──
    const recentActivity = [];

    fuelRecords.slice(0, 5).forEach(r => {
      const vehicle = vehicles.find(v => v._id.toString() === r.vehicleId?.toString());
      recentActivity.push({
        type: 'fuel',
        label: `Fuel – ${r.liters}L`,
        vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
        date: r.date,
        amount: r.cost || 0
      });
    });

    maintenanceRecords.slice(0, 5).forEach(r => {
      const vehicle = vehicles.find(v => v._id.toString() === r.vehicleId?.toString());
      recentActivity.push({
        type: 'maintenance',
        label: r.serviceType,
        vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
        date: r.date,
        amount: r.cost || 0
      });
    });

    expenseRecords.slice(0, 5).forEach(r => {
      const vehicle = vehicles.find(v => v._id.toString() === r.vehicleId?.toString());
      recentActivity.push({
        type: 'expense',
        label: r.description,
        vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
        date: r.date,
        amount: r.amount || 0
      });
    });

    // Sort by date descending, take top 10
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    recentActivity.splice(10);

    // ── Pinned Vehicles (just return all vehicles for now) ─────────
    const pinnedVehicles = vehicles.map(v => ({
      _id: v._id,
      make: v.make,
      model: v.model,
      year: v.year,
      plate: v.plate || '',
      color: v.color || '',
      fuelType: v.fuelType || 'Petrol',
      mileage: v.mileage || 0,
      imageUrl: v.imageUrl || null
    }));

    res.json({
      vehicleCount,
      lifetimeSpend,
      fuelCost,
      totalLiters,
      upcomingServices,
      recentActivity,
      pinnedVehicles
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
