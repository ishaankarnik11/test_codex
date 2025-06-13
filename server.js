const express = require('express');
const wol = require('wol');

const app = express();
app.use(express.json());

// In-memory device store
const devices = {};

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
app.post('/device', (req, res) => {
  const { name, mac, ip } = req.body;
  if (!name || !mac) {
    return res
      .status(400)
      .json({ error: 'Device name and MAC address are required' });
  }
  devices[name] = { name, mac, ip };
  res.json({ status: 'Device added', device: devices[name] });
});

// Update an existing device
app.put('/device/:name', (req, res) => {
  const { name } = req.params;
  const { mac, ip } = req.body;
  if (!mac) {
    return res
      .status(400)
      .json({ error: 'MAC address is required for update' });
  }
  if (!devices[name]) {
    return res.status(404).json({ error: 'Device not found' });
  }
  devices[name] = { name, mac, ip };
  res.json({ status: 'Device updated', device: devices[name] });
});

// Delete a device
app.delete('/device/:name', (req, res) => {
  const { name } = req.params;
  if (!devices[name]) {
    return res.status(404).json({ error: 'Device not found' });
  }
  const removed = devices[name];
  delete devices[name];
  res.json({ status: 'Device deleted', device: removed });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WOL server running on port ${PORT}`);
});
