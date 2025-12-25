const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

let lobbies = [];

// List lobbies (newest heartbeat first)
app.get("/lobbies", (req, res) => {
  res.json(lobbies.slice().sort((a,b)=>b.lastSeen-a.lastSeen));
});
app.get("/", (req, res) => {
    res.status(200).send("SR2 backend online");
});


// Create lobby
app.post("/lobbies", (req, res) => {
  const b = req.body || {};
  const lobby = {
    id: uuidv4(),
    lobbyName: String(b.lobbyName || "SR2 Co-Op").slice(0, 80),
    hostName: String(b.hostName || "Host").slice(0, 40),
    region: String(b.region || "NA").slice(0, 20),
    players: String(b.players || "1/2").slice(0, 10),
    notes: String(b.notes || "").slice(0, 200),
    radminNetwork: String(b.radminNetwork || "").slice(0, 80),
    radminPassword: String(b.radminPassword || "").slice(0, 80),
    createdAt: Date.now(),
    lastSeen: Date.now()
  };
  lobbies.push(lobby);
  res.json(lobby);
});

// Heartbeat
app.post("/heartbeat/:id", (req, res) => {
  const id = req.params.id;
  const lobby = lobbies.find(l => l.id === id);
  if (!lobby) return res.sendStatus(404);
  lobby.lastSeen = Date.now();
  res.sendStatus(200);
});

// Delete lobby
app.delete("/lobbies/:id", (req, res) => {
  const id = req.params.id;
  const before = lobbies.length;
  lobbies = lobbies.filter(l => l.id !== id);
  res.json({ removed: before - lobbies.length });
});

// Cleanup stale lobbies every 5s (stale if no heartbeat for 30s)
setInterval(() => {
  const cutoff = Date.now() - 30000;
  lobbies = lobbies.filter(l => l.lastSeen >= cutoff);
}, 5000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SR2 lobby backend running on http://localhost:${PORT}`);
});
