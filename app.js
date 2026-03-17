const searchBtn = document.getElementById("searchBtn");
const productCodeInput = document.getElementById("productCode");
const quantityInput = document.getElementById("quantity");
const safetyStockInput = document.getElementById("safetyStock");
const resultsBody = document.getElementById("resultsBody");
const statusText = document.getElementById("statusText");

const productCard = document.getElementById("productCard");
const productImage = document.getElementById("productImage");
const productTitle = document.getElementById("productTitle");
const productRef = document.getElementById("productRef");
const productPrice = document.getElementById("productPrice");
const productVipRow = document.getElementById("productVipRow");
const productVipBadge = document.getElementById("productVipBadge");
const productDiscount = document.getElementById("productDiscount");
const productOldPrice = document.getElementById("productOldPrice");

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

function clearProductCard() {
  productCard.classList.add("hidden");
  productImage.src = "";
  productImage.alt = "";
  productTitle.textContent = "";
  productRef.textContent = "";
  productPrice.textContent = "";
  productVipBadge.textContent = "";
  productDiscount.textContent = "";
  productOldPrice.textContent = "";
  productVipRow.classList.add("hidden");
}

function renderProduct(product) {
  if (!product) {
    clearProductCard();
    return;
  }

  productImage.src = product.imageUrl || "";
  productImage.alt = product.libelle || product.codeArticle || "Produit";
  productTitle.textContent = product.libelle || "";
  productRef.textContent = product.codeArticle ? `Réf. ${product.codeArticle}` : "";
  productPrice.textContent = product.prix || "";

  const showPromoRow = Boolean(
    product?.vip?.enabled ||
    product?.ancienPrix ||
    product?.vip?.discountPercent
  );

  if (showPromoRow) {
    productVipBadge.textContent = product?.vip?.enabled
      ? (product.vip.label || "Offre VIP")
      : "Promo";

    productDiscount.textContent = product?.vip?.discountPercent
      ? `-${product.vip.discountPercent}%`
      : "";

    productOldPrice.textContent = product.ancienPrix || "";

    productVipRow.classList.remove("hidden");
  } else {
    productVipBadge.textContent = "";
    productDiscount.textContent = "";
    productOldPrice.textContent = "";
    productVipRow.classList.add("hidden");
  }

  productCard.classList.remove("hidden");
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

  resultsBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.cp)}</td>
          <td>${escapeHtml(row.magasin)}</td>
          <td>${escapeHtml(row.codeArticle)}</td>
          <td>${escapeHtml(row.stocks)}</td>
          <td>
            <span class="${getStatusClass(row.status)}">
              ${escapeHtml(row.status)}
            </span>
          </td>
        </tr>
      `
    )
    .join("");
}

async function runSearch() {
  const productCode = productCodeInput.value.trim();
  const quantity = Number(quantityInput.value || 1);
  const safetyStock = Number(safetyStockInput.value || 5);

  if (!productCode) {
    statusText.textContent = "Saisis un code article.";
    clearProductCard();
    renderResults([]);
    return;
  }

  statusText.textContent = "Recherche en cours...";
  clearProductCard();
  renderResults([]);

  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productCode,
        quantity,
        safetyStock,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    renderProduct(data.product);
    renderResults(data.results || []);
    statusText.textContent = `${data.results?.length || 0} ligne(s) affichée(s).`;
  } catch (error) {
    clearProductCard();
    renderResults([]);
    statusText.textContent = `Erreur : ${error.message}`;
  }
}

searchBtn.addEventListener("click", runSearch);

productCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runSearch();
  }
});