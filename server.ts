import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const STATE_FILE_PATH = path.join(process.cwd(), "tournament_state.json");

app.use(express.json({ limit: "50mb" }));

// Helper to load state
function getTournamentState() {
  if (fs.existsSync(STATE_FILE_PATH)) {
    try {
      const data = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading stable state:", e);
    }
  }
  return null;
}

// Helper to save state
function saveTournamentState(state: any) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error saving stable state:", e);
    return false;
  }
}

// REST Api endpoints
app.get("/api/tournament-state", (req, res) => {
  const currentState = getTournamentState();
  if (currentState) {
    res.json({ success: true, data: currentState });
  } else {
    res.json({ success: false, message: "No state initialized yet." });
  }
});

app.post("/api/tournament-state", (req, res) => {
  const { state } = req.body;
  if (!state) {
    res.status(400).json({ success: false, message: "No state payload provided" });
    return;
  }
  const result = saveTournamentState(state);
  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: "Failed to persist state on server" });
  }
});

// Reset endpoint to clear server persistent data if needed
app.post("/api/tournament-reset", (req, res) => {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      fs.unlinkSync(STATE_FILE_PATH);
    }
    res.json({ success: true, message: "Server state cleared successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to clear server state" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
