const searchBtn = document.getElementById("searchBtn");
const productCodesInput = document.getElementById("productCodes");
const quantityInput = document.getElementById("quantity");
const safetyStockInput = document.getElementById("safetyStock");
const resultsBody = document.getElementById("resultsBody");
const statusText = document.getElementById("statusText");

const API_BASE = "https://gifi-stock-check.vercel.app";

function getStatusClass(status) {
  if (status === "Disponible") return "status-dispo";
  if (status === "Stock limité") return "status-limite";
  return "status-indispo";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderResults(rows) {
  if (!rows || rows.length === 0) {
    resultsBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty">Aucun résultat.</td>
      </tr>
    `;
    return;
  }

  resultsBody.innerHTML = rows
    .map((row) => {
      const imageCell = row.imageUrl
        ? `<img class="product-thumb" src="${escapeHtml(row.imageUrl)}" alt="${escapeHtml(row.libelle || row.codeArticle)}" loading="lazy">`
        : `<div class="product-thumb product-thumb--empty">—</div>`;

      return `
        <tr>
          <td>${escapeHtml(row.cp)}</td>
          <td>${escapeHtml(row.magasin)}</td>
          <td>${escapeHtml(row.codeArticle)}</td>
          <td class="product-cell">
            ${imageCell}
          </td>
          <td>${escapeHtml(row.libelle)}</td>
          <td>${escapeHtml(row.stocks)}</td>
          <td>
            <span class="${getStatusClass(row.status)}">
              ${escapeHtml(row.status)}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

searchBtn.addEventListener("click", async () => {
  const productCodes = productCodesInput.value
    .split(/\r?\n|,|;/)
    .map((x) => x.trim())
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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productCodes, quantity, safetyStock }),
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