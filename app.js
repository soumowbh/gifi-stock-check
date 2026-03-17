const searchBtn = document.getElementById("searchBtn");
const productCodeInput = document.getElementById("productCode");
const quantityInput = document.getElementById("quantity");
const safetyStockInput = document.getElementById("safetyStock");
const resultsBody = document.getElementById("resultsBody");
const statusText = document.getElementById("statusText");

const productCard = document.getElementById("productCard");
<<<<<<< HEAD
=======
const productGallery = document.getElementById("productGallery");
<<<<<<< HEAD
>>>>>>> parent of e3fbee9 (Fix product gallery)
=======
>>>>>>> parent of e3fbee9 (Fix product gallery)
const productTitle = document.getElementById("productTitle");
const productRef = document.getElementById("productRef");
const productDescription = document.getElementById("productDescription");
const productMeta = document.getElementById("productMeta");

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

const limonestCard = document.getElementById("limonestCard");
const limonestStock = document.getElementById("limonestStock");
const limonestStatus = document.getElementById("limonestStatus");

const productGallery = document.getElementById("productGallery");
const productGalleryDots = document.getElementById("productGalleryDots");
const productGalleryCounter = document.getElementById("productGalleryCounter");
const galleryThumbs = document.getElementById("galleryThumbs");
const galleryPrev = document.getElementById("galleryPrev");
const galleryNext = document.getElementById("galleryNext");

const API_BASE = "https://gifi-stock-check.vercel.app";

let currentGalleryImages = [];
let currentGalleryIndex = 0;
let currentProductData = null;

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
    .replaceAll("'", "&#039;");
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

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/[^\d,.\-€]/g, "")
    .replace(".", ",")
    .replace("€", "");

  const [integerPart = "", decimalPart = ""] = normalized.split(",");

  return {
    integer: integerPart || "",
    decimal: decimalPart || "",
    currency: "€",
  };
}

function setPriceParts(targetInteger, targetDecimal, targetCurrency, formattedPrice) {
  const parts = parseFormattedPrice(formattedPrice);
  targetInteger.textContent = parts.integer;
  targetDecimal.textContent = parts.decimal;
  targetCurrency.textContent = parts.currency;
}

function normalizeImage(url) {
  if (!url) return "";
  return String(url).trim();
}

function uniqueImages(images) {
  const seen = new Set();
  const out = [];

  for (const image of images || []) {
    const url = normalizeImage(image);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }

  return out;
}

function getResponsiveImages(product) {
  const mobileImages = uniqueImages(product?.images?.pdp_mobile || []);
  const tabletImages = uniqueImages(product?.images?.pdp_tablet || []);
  const largeImages = uniqueImages(product?.images?.pdp_large || []);
  const commonImages = uniqueImages(product?.images?.all || []);

  if (window.innerWidth <= 767) {
    return mobileImages.length
      ? mobileImages
      : tabletImages.length
        ? tabletImages
        : largeImages.length
          ? largeImages
          : commonImages;
  }

  if (window.innerWidth <= 1024) {
    return tabletImages.length
      ? tabletImages
      : largeImages.length
        ? largeImages
        : mobileImages.length
          ? mobileImages
          : commonImages;
  }

  return largeImages.length
    ? largeImages
    : tabletImages.length
      ? tabletImages
      : mobileImages.length
        ? mobileImages
        : commonImages;
}

function clearLimonestCard() {
  limonestStock.textContent = "";
  limonestStatus.textContent = "";
  limonestStatus.className = "mini-status";
  limonestCard.classList.add("hidden");
}

function updateGalleryThumbs() {
  if (!currentGalleryImages.length) {
    galleryThumbs.innerHTML = "";
    return;
  }

  galleryThumbs.innerHTML = currentGalleryImages
    .map((url, index) => {
      return `
        <button
          type="button"
          class="gallery-thumb ${index === currentGalleryIndex ? "is-active" : ""}"
          data-index="${index}"
          aria-label="Voir l'image ${index + 1}"
        >
          <img
            src="${escapeHtml(url)}"
            alt="Miniature produit ${index + 1}"
            loading="lazy"
            decoding="async"
          />
        </button>
      `;
    })
    .join("");

<<<<<<< HEAD
<<<<<<< HEAD
  galleryThumbs.querySelectorAll(".gallery-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      scrollToGalleryIndex(Number(thumb.dataset.index));
    });
  });
}

function updateGalleryDots() {
  if (!currentGalleryImages.length) {
    productGalleryDots.innerHTML = "";
    productGalleryCounter.classList.add("hidden");
    productGalleryCounter.textContent = "";
    return;
  }

  productGalleryDots.innerHTML = currentGalleryImages
    .map((_, index) => {
      return `
        <button
          type="button"
          class="gallery-dot ${index === currentGalleryIndex ? "is-active" : ""}"
          data-index="${index}"
          aria-label="Aller à l'image ${index + 1}"
        ></button>
      `;
    })
    .join("");

  productGalleryDots.querySelectorAll(".gallery-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      scrollToGalleryIndex(Number(dot.dataset.index));
    });
  });

  productGalleryCounter.classList.toggle("hidden", currentGalleryImages.length <= 1);
  productGalleryCounter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;
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

  updateGalleryThumbs();
  updateGalleryDots();
  updateGalleryNav();
}

function handleGalleryScroll() {
  if (!productGallery || !currentGalleryImages.length) return;

  const width = productGallery.clientWidth || 1;
  const index = Math.round(productGallery.scrollLeft / width);

  if (index !== currentGalleryIndex) {
    currentGalleryIndex = index;
    updateGalleryThumbs();
    updateGalleryDots();
    updateGalleryNav();
  }
=======
  return largeImages.length ? largeImages : (tabletImages.length ? tabletImages : mobileImages);
>>>>>>> parent of e3fbee9 (Fix product gallery)
=======
  return largeImages.length ? largeImages : (tabletImages.length ? tabletImages : mobileImages);
>>>>>>> parent of e3fbee9 (Fix product gallery)
}

function renderGallery(product) {
  const images = getResponsiveImages(product);
<<<<<<< HEAD
<<<<<<< HEAD

  currentGalleryImages = images;
  currentGalleryIndex = 0;

  if (!images.length) {
    productGallery.innerHTML = `
      <div class="product-gallery__item">
        <img
          src="https://placehold.co/900x900?text=Pas+d%27image"
          alt="Aucune image disponible"
        />
      </div>
    `;
    galleryThumbs.innerHTML = "";
    productGalleryDots.innerHTML = "";
    galleryPrev.classList.add("hidden");
    galleryNext.classList.add("hidden");
    productGalleryCounter.classList.add("hidden");
=======

  if (!images.length) {
    productGallery.innerHTML = "";
>>>>>>> parent of e3fbee9 (Fix product gallery)
=======

  if (!images.length) {
    productGallery.innerHTML = "";
>>>>>>> parent of e3fbee9 (Fix product gallery)
    return;
  }

  productGallery.innerHTML = images
    .map((url, index) => {
      const eager = index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
      return `
        <div class="product-gallery__item">
          <img
            src="${escapeHtml(url)}"
            alt="${escapeHtml(product?.libelle || "Produit")}"
            ${eager}
            decoding="async"
          />
        </div>
      `;
    })
    .join("");

  productGallery.scrollLeft = 0;
<<<<<<< HEAD
<<<<<<< HEAD
  updateGalleryThumbs();
  updateGalleryDots();
  updateGalleryNav();
=======
>>>>>>> parent of e3fbee9 (Fix product gallery)
}

function renderMeta(product) {
  const chips = [];

  if (product?.vip?.enabled) {
    chips.push(`<span class="product-chip">${escapeHtml(product.vip.label || "Offre VIP")}</span>`);
  }

  if (product?.collection) {
    chips.push(`<span class="product-chip">${escapeHtml(product.collection)}</span>`);
  }

  if (product?.brand) {
    chips.push(`<span class="product-chip">${escapeHtml(product.brand)}</span>`);
  }

  if (product?.category) {
    chips.push(`<span class="product-chip">${escapeHtml(product.category)}</span>`);
  }

  productMeta.innerHTML = chips.join("");
  productMeta.classList.toggle("hidden", chips.length === 0);
}

function clearProductCard() {
<<<<<<< HEAD
  currentProductData = null;
  currentGalleryImages = [];
  currentGalleryIndex = 0;

  productCard.classList.add("hidden");
  productGallery.innerHTML = "";
  productGalleryDots.innerHTML = "";
  productGalleryCounter.textContent = "";
  productGalleryCounter.classList.add("hidden");
  galleryThumbs.innerHTML = "";
  galleryPrev.classList.add("hidden");
  galleryNext.classList.add("hidden");

=======
  window.__currentProductData__ = null;
  productCard.classList.add("hidden");
  productGallery.innerHTML = "";
>>>>>>> parent of e3fbee9 (Fix product gallery)
=======
}

function clearProductCard() {
  window.__currentProductData__ = null;
  productCard.classList.add("hidden");
  productGallery.innerHTML = "";
>>>>>>> parent of e3fbee9 (Fix product gallery)
  productTitle.textContent = "";
  productRef.textContent = "";
  productDescription.textContent = "";
  productDescription.classList.add("hidden");
  productMeta.innerHTML = "";
  productMeta.classList.add("hidden");

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
  currentProductData = product;

  if (!product) {
    clearProductCard();
    return;
  }

  renderGallery(product);

  productTitle.textContent = product.libelle || "Produit";
  productRef.textContent = product.codeArticle ? `Réf. ${product.codeArticle}` : "";

  setPriceParts(
    productCurrentInteger,
    productCurrentDecimal,
    productCurrentCurrency,
    product.prix || ""
  );

  const showPromoRow = Boolean(
    product?.vip?.enabled || product?.ancienPrix || product?.vip?.discountPercent
  );

  if (showPromoRow) {
    productPromoBadge.textContent = product?.vip?.enabled
      ? product.vip.label || "Offre VIP"
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
    productPromoRow.classList.add("hidden");
  }

  if (product?.ecoTaxMessage) {
    productEcoTax.textContent = product.ecoTaxMessage;
    productEcoTax.classList.remove("hidden");
  } else {
    productEcoTax.classList.add("hidden");
  }

  if (product?.description) {
    productDescription.textContent = product.description;
    productDescription.classList.remove("hidden");
  } else {
    productDescription.textContent = "";
    productDescription.classList.add("hidden");
  }

  renderMeta(product);

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

  limonestStock.textContent = `${limonest.stocks}`;
  limonestStatus.textContent = limonest.status;
  limonestStatus.className = `mini-status ${getStatusClass(limonest.status)}`;
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
    .map((row) => {
      return `
        <tr>
          <td>${escapeHtml(row.magasin)}</td>
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

    renderProduct(data.product || null);
    renderLimonestSummary(data.results || []);
    renderResults(data.results || []);

    const lineCount = data.results?.length || 0;
    statusText.textContent = `${lineCount} ligne(s) affichée(s).`;
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
<<<<<<< HEAD
<<<<<<< HEAD
  if (currentProductData) {
    renderGallery(currentProductData);
=======
=======
>>>>>>> parent of e3fbee9 (Fix product gallery)
  if (!productCard.classList.contains("hidden") && productTitle.textContent) {
    // on relance un rendu léger si un produit est déjà affiché
    const currentProduct = window.__currentProductData__;
    if (currentProduct) {
      renderGallery(currentProduct);
    }
<<<<<<< HEAD
>>>>>>> parent of e3fbee9 (Fix product gallery)
=======
>>>>>>> parent of e3fbee9 (Fix product gallery)
  }
});