import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

// Try to load from file, but fallback to env vars for generic deployments like Vercel
let firebaseConfig: any;
try {
  const configData = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8");
  firebaseConfig = JSON.parse(configData);
} catch (e) {
  firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
  };
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const serverApp = express();
const PORT = 3000;
const TOURNAMENT_DOC_PATH = "tournaments/singleton";

serverApp.use(express.json({ limit: "50mb" }));

// Helper to load state from Firestore
async function getTournamentState() {
  try {
    const docRef = doc(db, TOURNAMENT_DOC_PATH);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error("Error reading from Firestore:", e);
  }
  return null;
}

// Helper to save state to Firestore
async function saveTournamentState(state: any) {
  try {
    const docRef = doc(db, TOURNAMENT_DOC_PATH);
    await setDoc(docRef, {
      ...state,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error("Error saving to Firestore:", e);
    return false;
  }
}

// REST Api endpoints
serverApp.get("/api/tournament-state", async (req, res) => {
  const currentState = await getTournamentState();
  if (currentState) {
    res.json({ success: true, data: currentState });
  } else {
    res.json({ success: false, message: "No state initialized yet." });
  }
});

serverApp.post("/api/tournament-state", async (req, res) => {
  const { state } = req.body;
  if (!state) {
    res.status(400).json({ success: false, message: "No state payload provided" });
    return;
  }
  const result = await saveTournamentState(state);
  if (result) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: "Failed to persist state on Firestore" });
  }
});

// Reset endpoint to clear server persistent data if needed
serverApp.post("/api/tournament-reset", async (req, res) => {
  try {
    const docRef = doc(db, TOURNAMENT_DOC_PATH);
    await deleteDoc(docRef);
    res.json({ success: true, message: "Server state cleared successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to clear Firestore state" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    serverApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    serverApp.use(express.static(distPath));
    serverApp.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  serverApp.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
