const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000; // Azure will inject PORT

// File paths
const itemsFile = path.join(__dirname, "items.json");
const compradosFile = path.join(__dirname, "comprados.json");

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend (index.html, js, css)

// --- API Endpoints ---

// Get all faltantes (pending items)
app.get("/api/items", (req, res) => {
	const items = JSON.parse(fs.readFileSync(itemsFile, "utf-8"));
	res.json(items);
});

// Get all comprados (claimed items)
app.get("/api/comprados", (req, res) => {
	const comprados = JSON.parse(fs.readFileSync(compradosFile, "utf-8"));
	res.json(comprados);
});

// Claim an item
app.post("/api/claim", (req, res) => {
	const { id, buyer } = req.body;
	if (!id || !buyer) {
		return res.status(400).json({ error: "Missing id or buyer" });
	}

	let items = JSON.parse(fs.readFileSync(itemsFile, "utf-8"));
	let comprados = JSON.parse(fs.readFileSync(compradosFile, "utf-8"));

	const index = items.findIndex((item) => item.id === id);
	if (index === -1) {
		return res.status(404).json({ error: "Item not found" });
	}

	const [claimed] = items.splice(index, 1);
	claimed.buyer = buyer;
	comprados.push(claimed);

	fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
	fs.writeFileSync(compradosFile, JSON.stringify(comprados, null, 2));

	res.json({ success: true, claimed });
});

// --- Start server ---
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
