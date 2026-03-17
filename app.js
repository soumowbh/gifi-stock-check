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

const productCurrentInteger = document.getElementById("productCurrentInteger");
const productCurrentDecimal = document.getElementById("productCurrentDecimal");
const productCurrentCurrency = document.getElementById("productCurrentCurrency");

const productPromoRow = document.getElementById("productPromoRow");
const productPromoBadge = document.getElementById("productPromoBadge");
const productDiscount = document.getElementById("productDiscount");
const productOldPriceInteger = document.getElementById("productOldPriceInteger");
const productOldPriceDecimal = document.getElementById("productOldPriceDecimal");
const productOldPriceCurrency = document.getElementById("productOldPriceCurrency");

const productEcoTax = document.getElementById("productEcoTax");

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

function parseFormattedPrice(price) {
  const raw = String(price || "").trim();
  if (!raw) {
    return {
      integer: "",
      decimal: "",
      currency: "€",
    };
  }

  const cleaned = raw.replace(/\s/g, "").replace("€", "");
  const [integerPart = "", decimalPart = ""] = cleaned.split(",");

  return {
    integer: integerPart,
    decimal: decimalPart,
    currency: "€",
  };
}

function setPriceParts(targetInteger, targetDecimal, targetCurrency, formattedPrice) {
  const parts = parseFormattedPrice(formattedPrice);
  targetInteger.textContent = parts.integer;
  targetDecimal.textContent = parts.decimal;
  targetCurrency.textContent = parts.currency;
}

function clearProductCard() {
  productCard.classList.add("hidden");
  productImage.src = "";
  productImage.alt = "";
  productTitle.textContent = "";
  productRef.textContent = "";

  productCurrentInteger.textContent = "";
  productCurrentDecimal.textContent = "";
  productCurrentCurrency.textContent = "€";

  productPromoBadge.textContent = "";
  productDiscount.textContent = "";
  productOldPriceInteger.textContent = "";
  productOldPriceDecimal.textContent = "";
  productOldPriceCurrency.textContent = "€";
  productPromoRow.classList.add("hidden");

  productEcoTax.textContent = "";
  productEcoTax.classList.add("hidden");
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

  setPriceParts(
    productCurrentInteger,
    productCurrentDecimal,
    productCurrentCurrency,
    product.prix || ""
  );

  const showPromoRow = Boolean(
    product?.vip?.enabled ||
    product?.ancienPrix ||
    product?.vip?.discountPercent
  );

  if (showPromoRow) {
    productPromoBadge.textContent = product?.vip?.enabled
      ? (product.vip.label || "Offre VIP")
      : "Promo";

    productDiscount.textContent = product?.vip?.discountPercent
      ? `-${product.vip.discountPercent}%`
      : "";

    setPriceParts(
      productOldPriceInteger,
      productOldPriceDecimal,
      productOldPriceCurrency,
      product.ancienPrix || ""
    );

    productPromoRow.classList.remove("hidden");
  } else {
    productPromoBadge.textContent = "";
    productDiscount.textContent = "";
    productOldPriceInteger.textContent = "";
    productOldPriceDecimal.textContent = "";
    productOldPriceCurrency.textContent = "€";
    productPromoRow.classList.add("hidden");
  }

  if (product?.ecoTaxMessage) {
    productEcoTax.textContent = product.ecoTaxMessage;
    productEcoTax.classList.remove("hidden");
  } else {
    productEcoTax.textContent = "";
    productEcoTax.classList.add("hidden");
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