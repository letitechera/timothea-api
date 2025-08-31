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
	const faltantesNumero = document.getElementById("pendingCount");
	const compradosList = document.getElementById("compradosList");
	const compradosNumero = document.getElementById("completedCount");

	faltantesList.innerHTML = "";
	compradosList.innerHTML = "";
	faltantesNumero.innerHTML = faltantes.length;
	compradosNumero.innerHTML = comprados.length;

	faltantes.forEach(item => {
		const div = document.createElement("div");
		div.className = "item-faltante";
		div.onclick = () => openModal(item);

		// Add name
		const nameSpan = document.createElement("span");
		nameSpan.textContent = `• ${item.name} `;
		div.appendChild(nameSpan);

		// Add link if exists
		if (item.link) {
			const link = document.createElement("a");
			link.id = `link_${item.id}`;
			link.href = item.link.startsWith("http") ? item.link : `https://${item.link}`; // ✅ fix relative issue
			link.target = "_blank";
			link.className = "item-link";
			link.textContent = "(Ver referencia)";
			link.addEventListener("click", e => e.stopPropagation()); // ✅ prevents triggering modal
			div.appendChild(link);
		}

		faltantesList.appendChild(div);
	});

	comprados.forEach(item => {
		const div = document.createElement("div");
		div.className = "item-comprado";
		div.textContent = `• ${item.count ? item.count + ' ' : ''}${item.name}`;
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

// Scroll to Faltantes
document.getElementById("scrollToFaltantes").addEventListener("click", () => {
	document.getElementById("completedCount").scrollIntoView({
		behavior: "smooth",
		block: "start"
	});
});

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
