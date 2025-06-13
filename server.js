const express = require('express');
const wol = require('wol');

const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WOL server running on port ${PORT}`);
});
