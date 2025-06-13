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
  mac: { type: String, required: true },
  ip: String,
});

const Device = mongoose.model('Device', deviceSchema);

app.post('/wake', async (req, res) => {
  const { mac } = req.body;
  if (!mac) {
    return res.status(400).json({ error: 'MAC address is required' });
  }
  try {
    await wol.wake(mac);
    res.json({ status: 'Magic packet sent', mac });
  } catch (err) {
    console.error('Failed to send WOL packet:', err);
    res.status(500).json({ error: 'Failed to send WOL packet' });
  }
});

// Add a new device
app.post('/device', async (req, res) => {
  const { name, mac, ip } = req.body;
  if (!name || !mac) {
    return res
      .status(400)
      .json({ error: 'Device name and MAC address are required' });
  }
  try {
    const device = await Device.create({ name, mac, ip });
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
  const { mac, ip } = req.body;
  if (!mac) {
    return res
      .status(400)
      .json({ error: 'MAC address is required for update' });
  }
  try {
    const device = await Device.findOneAndUpdate(
      { name },
      { mac, ip, name },
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WOL server running on port ${PORT}`);
});
