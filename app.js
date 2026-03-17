const searchBtn = document.getElementById("searchBtn");
const productCodeInput = document.getElementById("productCode");
const quantityInput = document.getElementById("quantity");
const safetyStockInput = document.getElementById("safetyStock");
const resultsBody = document.getElementById("resultsBody");
const statusText = document.getElementById("statusText");

const productCard = document.getElementById("productCard");
const productGallery = document.getElementById("productGallery");
const productGalleryDots = document.getElementById("productGalleryDots");
const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");
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

let currentGalleryImages = [];
let currentGalleryIndex = 0;

function clearLimonestCard() {
  limonestStatus.textContent = "";
  limonestStatus.className = "limonest-inline__badge";
  limonestCard.classList.add("hidden");
}
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

function clearLimonestCard() {
  limonestStock.textContent = "";
  limonestStatus.textContent = "";
  limonestStatus.className = "mini-status";
  limonestCard.classList.add("hidden");
}

function getResponsiveImages(product) {
  const mobileImages = product?.images?.pdp_mobile || [];
  const tabletImages = product?.images?.pdp_tablet || [];
  const largeImages = product?.images?.pdp_large || [];

  if (window.innerWidth <= 767) {
    return mobileImages.length
      ? mobileImages
      : (tabletImages.length ? tabletImages : largeImages);
  }

  if (window.innerWidth <= 1024) {
    return tabletImages.length
      ? tabletImages
      : (largeImages.length ? largeImages : mobileImages);
  }

  return largeImages.length
    ? largeImages
    : (tabletImages.length ? tabletImages : mobileImages);
}

function updateGalleryDots() {
  if (!currentGalleryImages.length) {
    productGalleryDots.innerHTML = "";
    return;
  }

  productGalleryDots.innerHTML = currentGalleryImages
    .map(
      (_, index) => `
        <button
          type="button"
          class="gallery-dot ${index === currentGalleryIndex ? "is-active" : ""}"
          data-index="${index}"
          aria-label="Aller à l'image ${index + 1}">
        </button>
      `
    )
    .join("");

  productGalleryDots.querySelectorAll(".gallery-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.index);
      scrollToGalleryIndex(index);
    });
  });
}

function updateGalleryNav() {
  const hasMultiple = currentGalleryImages.length > 1;

  galleryPrev.classList.toggle("hidden", !hasMultiple);
  galleryNext.classList.toggle("hidden", !hasMultiple);

  if (!hasMultiple) return;

  galleryPrev.disabled = currentGalleryIndex <= 0;
  galleryNext.disabled = currentGalleryIndex >= currentGalleryImages.length - 1;
}

function scrollToGalleryIndex(index) {
  if (!productGallery || !currentGalleryImages.length) return;

  const safeIndex = Math.max(0, Math.min(index, currentGalleryImages.length - 1));
  const width = productGallery.clientWidth || 1;

  currentGalleryIndex = safeIndex;

  productGallery.scrollTo({
    left: width * safeIndex,
    behavior: "smooth",
  });

  updateGalleryDots();
  updateGalleryNav();
}

function handleGalleryScroll() {
  if (!productGallery) return;

  const width = productGallery.clientWidth || 1;
  const index = Math.round(productGallery.scrollLeft / width);

  if (index !== currentGalleryIndex) {
    currentGalleryIndex = index;
    updateGalleryDots();
    updateGalleryNav();
  }
}

function renderGallery(product) {
  const images = getResponsiveImages(product);

  currentGalleryImages = images;
  currentGalleryIndex = 0;

  if (!images.length) {
    productGallery.innerHTML = "";
    productGalleryDots.innerHTML = "";
    galleryPrev.classList.add("hidden");
    galleryNext.classList.add("hidden");
    return;
  }

  productGallery.innerHTML = images
    .map(
      (url, index) => `
        <div class="product-gallery__item">
          <img
            src="${escapeHtml(url)}"
            alt="${escapeHtml(product?.libelle || `Photo ${index + 1}`)}"
            loading="${index === 0 ? "eager" : "lazy"}"
          />
        </div>
      `
    )
    .join("");

  productGallery.scrollLeft = 0;
  updateGalleryDots();
  updateGalleryNav();
}

function clearProductCard() {
  window.__currentProductData__ = null;

  productGallery.innerHTML = "";
  productGalleryDots.innerHTML = "";
  currentGalleryImages = [];
  currentGalleryIndex = 0;

  galleryPrev.classList.add("hidden");
  galleryNext.classList.add("hidden");

  productCard.classList.add("hidden");
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

  clearLimonestCard();
}

function renderProduct(product) {
  window.__currentProductData__ = product;

  if (!product) {
    clearProductCard();
    return;
  }

  renderGallery(product);

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

function renderLimonestSummary(rows) {
  const limonest = (rows || []).find((row) =>
    String(row.magasin || "").toLowerCase().includes("limonest")
  );

  if (!limonest) {
    clearLimonestCard();
    return;
  }

  const stock = Number(limonest.stocks ?? 0);
  const status = String(limonest.status || "").toLowerCase();

  let text = "";
  let statusClass = "";

  if (status.includes("disponible")) {
    text = `Stock disponible ${stock} à Limonest`;
    statusClass = "status-dispo";
  } else if (status.includes("limité")) {
    text = `Stock limité ${stock} à Limonest`;
    statusClass = "status-limite";
  } else {
    text = `Stock indisponible ${stock} à Limonest`;
    statusClass = "status-indispo";
  }

  limonestStatus.textContent = text;
  limonestStatus.className = `limonest-inline__badge ${statusClass}`;
  limonestCard.classList.remove("hidden");
}

function renderResults(rows) {
  if (!rows || rows.length === 0) {
    resultsBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty">Aucun résultat.</td>
      </tr>
    `;
    return;
  }

  resultsBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.magasin)}</td>
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
  const quantity = Number(quantityInput?.value || 1);
  const safetyStock = Number(safetyStockInput?.value || 5);

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
    renderLimonestSummary(data.results || []);
    renderResults(data.results || []);
    statusText.textContent = `${data.results?.length || 0} ligne(s) affichée(s).`;
  } catch (error) {
    clearProductCard();
    renderResults([]);
    statusText.textContent = `Erreur : ${error.message}`;
  }
}

searchBtn.addEventListener("click", () => {
  productCodeInput.blur();
  runSearch();
});

productCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    productCodeInput.blur();
    runSearch();
  }
});

galleryPrev.addEventListener("click", () => {
  scrollToGalleryIndex(currentGalleryIndex - 1);
});

galleryNext.addEventListener("click", () => {
  scrollToGalleryIndex(currentGalleryIndex + 1);
});

productGallery.addEventListener("scroll", handleGalleryScroll, { passive: true });

window.addEventListener("resize", () => {
  const currentProduct = window.__currentProductData__;
  if (currentProduct) {
    renderGallery(currentProduct);
  }
});