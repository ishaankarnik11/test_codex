const express = require('express');
const wol = require('wol');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wol', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  macAddress: { type: String, required: true },
  ipAddress: String,
  description: String,
  group: String,
});

const activitySchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  action: { type: String, required: true },
  status: String,
  createdAt: { type: Date, default: Date.now },
});

const Device = mongoose.model('Device', deviceSchema);
const Activity = mongoose.model('Activity', activitySchema);

app.post('/wake', async (req, res) => {
  const { macAddress } = req.body;
  if (!macAddress) {
    return res.status(400).json({ error: 'MAC address is required' });
  }
  try {
    await wol.wake(macAddress);
    res.json({ status: 'Magic packet sent', macAddress });
  } catch (err) {
    console.error('Failed to send WOL packet:', err);
    res.status(500).json({ error: 'Failed to send WOL packet' });
  }
});

// Add a new device
app.post('/device', async (req, res) => {
  const { name, macAddress, ipAddress, description, group } = req.body;
  if (!name || !macAddress) {
    return res
      .status(400)
      .json({ error: 'Device name and MAC address are required' });
  }
  try {
    const device = await Device.create({
      name,
      macAddress,
      ipAddress,
      description,
      group,
    });
    res.json({ status: 'Device added', device });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Device already exists' });
    }
    console.error('Failed to add device:', err);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Update an existing device
app.put('/device/:name', async (req, res) => {
  const { name } = req.params;
  const { macAddress, ipAddress, description, group } = req.body;
  if (!macAddress) {
    return res
      .status(400)
      .json({ error: 'MAC address is required for update' });
  }
  try {
    const device = await Device.findOneAndUpdate(
      { name },
      { macAddress, ipAddress, name, description, group },
      { new: true }
    );
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ status: 'Device updated', device });
  } catch (err) {
    console.error('Failed to update device:', err);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete a device
app.delete('/device/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const device = await Device.findOneAndDelete({ name });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ status: 'Device deleted', device });
  } catch (err) {
    console.error('Failed to delete device:', err);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// REST-like device management
app.get('/api/devices', async (req, res) => {
  const devices = await Device.find();
  res.json(devices);
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve device' });
  }
});

app.post('/api/devices', async (req, res) => {
  const { name, macAddress, ipAddress, description, group } = req.body;
  if (!name || !macAddress) {
    return res
      .status(400)
      .json({ error: 'Device name and MAC address are required' });
  }
  try {
    const device = await Device.create({
      name,
      macAddress,
      ipAddress,
      description,
      group,
    });
    res.status(201).json(device);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Device already exists' });
    }
    res.status(500).json({ error: 'Failed to create device' });
  }
});

app.put('/api/devices/:id', async (req, res) => {
  const { name, macAddress, ipAddress, description, group } = req.body;
  try {
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { name, macAddress, ipAddress, description, group },
      { new: true }
    );
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update device' });
  }
});

app.delete('/api/devices/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json({ status: 'Device deleted', device });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

app.post('/api/devices/:id/wake', async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    await wol.wake(device.macAddress);
    await Activity.create({
      device: device._id,
      action: 'wake',
      status: 'sent',
    });
    res.json({ status: 'Magic packet sent', device });
  } catch (err) {
    console.error('Failed to send WOL packet:', err);
    res.status(500).json({ error: 'Failed to send WOL packet' });
  }
});

app.post('/api/devices/bulk-wake', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array' });
  }
  const results = [];
  for (const id of ids) {
    try {
      const device = await Device.findById(id);
      if (!device) {
        results.push({ id, error: 'not found' });
        continue;
      }
      await wol.wake(device.macAddress);
      await Activity.create({
        device: device._id,
        action: 'wake',
        status: 'sent',
      });
      results.push({ id, status: 'sent' });
    } catch (err) {
      results.push({ id, error: 'failed' });
    }
  }
  res.json({ results });
});

app.get('/api/groups', async (req, res) => {
  const groups = await Device.distinct('group');
  res.json(groups.filter(Boolean));
});

app.get('/api/activities', async (req, res) => {
  const { device, status, start, end } = req.query;
  const query = {};
  if (device) query.device = device;
  if (status) query.status = status;
  if (start || end) {
    query.createdAt = {};
    if (start) query.createdAt.$gte = new Date(start);
    if (end) query.createdAt.$lte = new Date(end);
  }
  const activities = await Activity.find(query).populate('device');
  res.json(activities);
});

app.post('/api/activities', async (req, res) => {
  const { device, action, status } = req.body;
  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }
  try {
    const activity = await Activity.create({ device, action, status });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.delete('/api/activities', async (req, res) => {
  const { device } = req.query;
  const query = {};
  if (device) query.device = device;
  try {
    const result = await Activity.deleteMany(query);
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete activities' });
  }
});

app.get('/api/activities/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('device');
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve activity' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WOL server running on port ${PORT}`);
});
