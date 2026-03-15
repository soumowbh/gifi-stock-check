const searchBtn = document.getElementById("searchBtn");
const productCodesInput = document.getElementById("productCodes");
const quantityInput = document.getElementById("quantity");
const safetyStockInput = document.getElementById("safetyStock");
const resultsBody = document.getElementById("resultsBody");
const statusText = document.getElementById("statusText");

const API_BASE = "https://VERCEL_API_URL";

function getStatusClass(status) {
  if (status === "DISPO") return "status-dispo";
  if (status === "STOCK LIMITE") return "status-limite";
  return "status-indispo";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderResults(rows) {
  if (!rows || rows.length === 0) {
    resultsBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">Aucun résultat.</td>
      </tr>
    `;
    return;
  }

  resultsBody.innerHTML = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.cp)}</td>
      <td>${escapeHtml(row.magasin)}</td>
      <td>${escapeHtml(row.codeArticle)}</td>
      <td>${escapeHtml(row.stocks)}</td>
      <td class="${getStatusClass(row.status)}">${escapeHtml(row.status)}</td>
    </tr>
  `).join("");
}

searchBtn.addEventListener("click", async () => {
  const productCodes = productCodesInput.value
    .split(/\r?\n|,|;/)
    .map(x => x.trim())
    .filter(Boolean);

  const quantity = Number(quantityInput.value || 1);
  const safetyStock = Number(safetyStockInput.value || 5);

  if (productCodes.length === 0) {
    statusText.textContent = "Saisis au moins un code article.";
    renderResults([]);
    return;
  }

  statusText.textContent = "Recherche en cours...";
  renderResults([]);

  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        productCodes,
        quantity,
        safetyStock
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    renderResults(data.results || []);
    statusText.textContent = `${data.results?.length || 0} ligne(s) affichée(s).`;
  } catch (error) {
    statusText.textContent = `Erreur : ${error.message}`;
    renderResults([]);
  }
});
