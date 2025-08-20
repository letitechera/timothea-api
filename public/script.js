let faltantes = [];
let comprados = [];
let currentItem = null;

async function loadData() {
	faltantes = await fetch("/api/items").then(r => r.json());
	comprados = await fetch("/api/comprados").then(r => r.json());
	renderLists();
}

function renderLists() {
	const faltantesList = document.getElementById("faltantesList");
	const compradosList = document.getElementById("compradosList");

	faltantesList.innerHTML = "";
	compradosList.innerHTML = "";

	faltantes.forEach(item => {
		const div = document.createElement("div");
		div.textContent = item.name;
		div.className = "item-faltante";
		div.onclick = () => openModal(item);
		faltantesList.appendChild(div);
	});

	comprados.forEach(item => {
		const div = document.createElement("div");
		div.className = "item-comprado";
		div.textContent = `${item.name} — ${item.buyer}`;
		compradosList.appendChild(div);
	});
}

function openModal(item) {
	currentItem = item;
	document.getElementById("itemName").textContent = item.name;
	document.getElementById("buyerName").value = "";
	document.getElementById("modal").style.display = "block";
}

function closeModal() {
	document.getElementById("modal").style.display = "none";
}

function exportToExcel() {
	// Build data arrays
	const wsData = [];

	// Section: Faltantes
	wsData.push(["Faltantes"]);
	wsData.push(["Artículo"]);
	faltantes.forEach(item => {
		wsData.push([item.name]);
	});

	// Empty row
	wsData.push([]);

	// Section: Ya Reclamados
	wsData.push(["Ya Reclamados"]);
	wsData.push(["Artículo", "Se encarga"]);
	comprados.forEach(item => {
		wsData.push([item.name, item.buyer]);
	});

	// Create worksheet from array of arrays
	const ws = XLSX.utils.aoa_to_sheet(wsData);

	// Create workbook and append the single structured sheet
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Lista");

	// Save as Excel
	XLSX.writeFile(wb, "babyshower-lista.xlsx");
}


async function confirmPurchase() {
	const buyerName = document.getElementById("buyerName").value.trim();
	if (!buyerName) return;

	await fetch("/api/claim", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ id: currentItem.id, buyer: buyerName })
	});

	closeModal();
	loadData();
}

loadData();
