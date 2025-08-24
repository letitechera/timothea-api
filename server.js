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

	const item = items[index];

	// If items have a property "multiple" on "true", items should be treated as lots,
	// they shouldn't be removed from the original list, and should count units on "comprados"
	if (item.multiple) {
		// 👇 Do NOT remove from items
		let existing = comprados.find((c) => c.id === id);
		if (existing) {
			existing.buyer = existing.buyer ? `${existing.buyer}, ${buyer}` : buyer;
			existing.count = (existing.count || 1) + 1;
		} else {
			const claimed = {
				...item,
				buyer: buyer,
				count: 1
			};
			comprados.push(claimed);
		}
	} else {
		// ✅ Only remove for single items
		const [claimed] = items.splice(index, 1);
		claimed.buyer = buyer;
		comprados.push(claimed);
	}

	fs.writeFileSync(itemsFile, JSON.stringify(items, null, 2));
	fs.writeFileSync(compradosFile, JSON.stringify(comprados, null, 2));

	res.json({ success: true });
});


// --- Start server ---
app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});