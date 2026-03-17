const STORES = [
  { city: "Villefranche-sur-Saone", postalCode: "69400" },
  { city: "Villeurbanne", postalCode: "69100" },
];

const STORE_REFERENCE = [
  { storeName: "Gifi Villefranche", postalCode: "69400" },
  { storeName: "Gifi Neuville", postalCode: "69250" },
  { storeName: "Gifi Limonest", postalCode: "69760" },
  { storeName: "Gifi L'Arbresle", postalCode: "69210" },
  { storeName: "Gifi Beynost", postalCode: "01700" },
  { storeName: "Gifi Villeurbanne", postalCode: "69100" },
  { storeName: "Gifi Pierre Benite", postalCode: "69310" },
  { storeName: "Gifi St Priest", postalCode: "69800" },
  { storeName: "Gifi Givors", postalCode: "69700" },
  { storeName: "Gifi Vaulx En Velin", postalCode: "69120" },
  { storeName: "Gifi Meyzieu", postalCode: "69330" },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^gifi\s+/, "")
    .replace(/sainte/g, "ste")
    .replace(/saint/g, "st")
    .replace(/sur[\s-]?saone/g, "sursaone")
    .replace(/en[\s-]?velin/g, "envelin")
    .replace(/[^a-z0-9]/g, "");
}

function resolveStorePostalCode(storeName) {
  const normalized = normalizeText(storeName);

  for (const ref of STORE_REFERENCE) {
    const refName = normalizeText(ref.storeName);
    if (
      normalized === refName ||
      normalized.includes(refName) ||
      refName.includes(normalized)
    ) {
      return ref.postalCode;
    }
  }

  return "";
}

function toProductId(productCode) {
  const clean = String(productCode || "").replace(/\D/g, "");

  if (clean.length !== 6) {
    throw new Error(`Code article invalide : ${productCode}`);
  }

  return `000000000000${clean}`;
}

function getBusinessStatus(stock, safetyStock) {
  if (stock <= 0) return "Indisponible";
  if (stock < Math.ceil(safetyStock)) return "Stock limité";
  return "Disponible";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (!value) {
    return [];
  }
  return [value].filter(Boolean);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function extractImageUrlsFromHtml(html) {
  const matches = html.match(/https:\/\/www\.gifi\.fr\/dw\/image[^"' )]+/g) || [];
  return unique(matches);
}

function extractTextByRegex(html, regex) {
  const match = html.match(regex);
  return match?.[1]?.trim() || "";
}

function htmlEntityDecode(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&euro;/gi, "€")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Erreur HTML GiFi HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function enrichProductFromPdp(product) {
  const productUrl = firstNonEmpty(
    product?.url,
    product?.productUrl,
    product?.pdpUrl,
    product?.link
  );

  if (!productUrl) {
    return product;
  }

  try {
    const html = await fetchHtml(productUrl);

    const pageTitle = htmlEntityDecode(
      extractTextByRegex(
        html,
        /<title>\s*([^<]+?)\s*\|\s*GIFI\s*<\/title>/i
      )
    );

    const ecoTaxMessage = htmlEntityDecode(
      extractTextByRegex(
        html,
        />(Dont\s*[^<]*éco-part[^<]*)</i
      )
    );

    const description = htmlEntityDecode(
      extractTextByRegex(
        html,
        /## Description du produit[\s\S]*?<p[^>]*>(.*?)<\/p>/i
      )
    );

    const images = extractImageUrlsFromHtml(html);

    return {
      ...product,
      libelle: product.libelle || pageTitle || product.libelle,
      ecoTaxMessage: product.ecoTaxMessage || ecoTaxMessage,
      description: product.description || description,
      images: {
        pdp_large: product?.images?.pdp_large?.length ? product.images.pdp_large : images,
        pdp_tablet: product?.images?.pdp_tablet?.length ? product.images.pdp_tablet : images,
        pdp_mobile: product?.images?.pdp_mobile?.length ? product.images.pdp_mobile : images,
        all: unique([
          ...(product?.images?.all || []),
          ...images,
        ]),
      },
    };
  } catch {
    return product;
  }
}

async function fetchGifiStores(postalCode, productCode, quantity, safetyStock) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const productId = toProductId(productCode);
    const productsParam = encodeURIComponent(`${productId}:${quantity}`);
    const safetyStockFormatted = Number(safetyStock).toFixed(1);

    const url =
      `https://www.gifi.fr/on/demandware.store/Sites-GIFI_FR-Site/fr_FR/Stores-FindStores` +
      `?products=${productsParam}&safetyStock=${safetyStockFormatted}&postalCode=${encodeURIComponent(postalCode)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Erreur GiFi HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function mapWithConcurrency(items, limit, asyncMapper) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      try {
        results[currentIndex] = await asyncMapper(items[currentIndex], currentIndex);
      } catch (error) {
        results[currentIndex] = { error: error.message };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length || 1) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

function extractImagesFromAnyShape(source) {
  const raw = unique([
    ...toArray(source?.images?.pdp_mobile),
    ...toArray(source?.images?.pdp_tablet),
    ...toArray(source?.images?.pdp_large),
    ...toArray(source?.images?.large),
    ...toArray(source?.images?.medium),
    ...toArray(source?.images?.small),
    ...toArray(source?.pdp_mobile),
    ...toArray(source?.pdp_tablet),
    ...toArray(source?.pdp_large),
    ...toArray(source?.image),
    ...toArray(source?.imageUrl),
    ...toArray(source?.image_url),
    ...toArray(source?.primaryImage),
    ...toArray(source?.primaryImageUrl),
    ...toArray(source?.gallery),
  ]);

  return {
    pdp_mobile: raw,
    pdp_tablet: raw,
    pdp_large: raw,
    all: raw,
  };
}

function normalizeProductCandidate(candidate, fallbackCode) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const prix = firstNonEmpty(
    candidate.prix,
    candidate.price,
    candidate.formattedPrice,
    candidate.salesPrice,
    candidate.currentPrice
  );

  const ancienPrix = firstNonEmpty(
    candidate.ancienPrix,
    candidate.oldPrice,
    candidate.listPrice,
    candidate.strikePrice,
    candidate.compareAtPrice
  );

  const vipEnabled = Boolean(
    candidate?.vip?.enabled ||
    candidate?.isVip ||
    /vip/i.test(String(candidate?.vipLabel || "")) ||
    /vip/i.test(String(candidate?.promoLabel || ""))
  );

  const vipLabel = firstNonEmpty(
    candidate?.vip?.label,
    candidate.vipLabel,
    candidate.promoLabel,
    vipEnabled ? "Offre VIP" : ""
  );

  const vipDiscountPercent = firstNonEmpty(
    candidate?.vip?.discountPercent,
    candidate.discountPercent,
    candidate.vipDiscountPercent
  );

  return {
    codeArticle: firstNonEmpty(candidate.codeArticle, candidate.code, fallbackCode),
    libelle: firstNonEmpty(candidate.libelle, candidate.name, candidate.productName, candidate.title),
    prix: prix || "",
    ancienPrix: ancienPrix || "",
    ecoTaxMessage: firstNonEmpty(
      candidate.ecoTaxMessage,
      candidate.ecoTax,
      candidate.environmentalFeeLabel
    ),
    description: firstNonEmpty(candidate.description, candidate.shortDescription),
    collection: firstNonEmpty(candidate.collection, candidate.collectionName),
    brand: firstNonEmpty(candidate.brand, candidate.brandName),
    category: firstNonEmpty(candidate.category, candidate.categoryName),
    url: firstNonEmpty(candidate.url, candidate.productUrl, candidate.pdpUrl, candidate.link),
    vip: {
      enabled: vipEnabled,
      label: vipLabel || "",
      discountPercent: vipDiscountPercent || "",
    },
    images: extractImagesFromAnyShape(candidate),
  };
}

function pickProductFromResponsePayload(payload, productCode) {
  const stores = Array.isArray(payload?.stores) ? payload.stores : [];

  for (const store of stores) {
    const stockInfo = store?.productStockInfo || {};
    const candidates = [
      stockInfo,
      stockInfo.product,
      stockInfo.productData,
      stockInfo.productDetails,
      store?.product,
      store?.productData,
      store?.productDetails,
      payload?.product,
      payload?.productData,
      payload?.productDetails,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeProductCandidate(candidate, productCode);
      if (
        normalized &&
        (normalized.libelle || normalized.prix || (normalized.images?.all || []).length)
      ) {
        return normalized;
      }
    }
  }

  return {
    codeArticle: productCode,
    libelle: "",
    prix: "",
    ancienPrix: "",
    ecoTaxMessage: "",
    description: "",
    collection: "",
    brand: "",
    category: "",
    url: "",
    vip: {
      enabled: false,
      label: "",
      discountPercent: "",
    },
    images: {
      pdp_mobile: [],
      pdp_tablet: [],
      pdp_large: [],
      all: [],
    },
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const rawSingleCode = req.body?.productCode;
    const rawMultipleCodes = Array.isArray(req.body?.productCodes) ? req.body.productCodes : [];
    const quantity = Number(req.body?.quantity ?? 1);
    const safetyStock = Number(req.body?.safetyStock ?? 5);

    const normalizedCodes = unique([
      ...(rawSingleCode ? [String(rawSingleCode)] : []),
      ...rawMultipleCodes.map(String),
    ]).filter(Boolean);

    if (normalizedCodes.length === 0) {
      return res.status(400).json({ error: "Aucun code article fourni" });
    }

    const productCode = normalizedCodes[0];

    const filteredStores = STORES.filter(
      (store, index, array) =>
        index === array.findIndex((s) => s.postalCode === store.postalCode)
    );

    const rawResponses = await mapWithConcurrency(
      filteredStores,
      3,
      async (storeSearch) => {
        const data = await fetchGifiStores(
          storeSearch.postalCode,
          productCode,
          quantity,
          safetyStock
        );

        return {
          postalCode: storeSearch.postalCode,
          data,
        };
      }
    );

    const allResults = [];
    const seen = new Set();
    let product = null;

    for (const item of rawResponses) {
      if (!item || item.error || !item.data) {
        continue;
      }

      if (!product) {
        product = pickProductFromResponsePayload(item.data, productCode);
      }

      const stores = Array.isArray(item.data?.stores) ? item.data.stores : [];

      for (const store of stores) {
        const storeId = store?.id || `${store?.name || ""}|${store?.postalCode || ""}`;
        const uniqueKey = `${productCode}|${storeId}`;

        if (seen.has(uniqueKey)) {
          continue;
        }

        seen.add(uniqueKey);

        const stockInfo = store?.productStockInfo || {};
        const stock = Number.isFinite(Number(stockInfo.stock))
          ? Number(stockInfo.stock)
          : 0;

        allResults.push({
          cp: resolveStorePostalCode(store?.name || ""),
          magasin: store?.name || "",
          codeArticle: productCode,
          stocks: stock,
          status: getBusinessStatus(stock, safetyStock),
        });
      }
    }

    allResults.sort((a, b) => {
      if (a.cp !== b.cp) return a.cp.localeCompare(b.cp);
      if (a.magasin !== b.magasin) return a.magasin.localeCompare(b.magasin);
      return String(a.codeArticle).localeCompare(String(b.codeArticle));
    });

    if (!product) {
      product = {
        codeArticle: productCode,
        libelle: "",
        prix: "",
        ancienPrix: "",
        ecoTaxMessage: "",
        description: "",
        collection: "",
        brand: "",
        category: "",
        url: "",
        vip: {
          enabled: false,
          label: "",
          discountPercent: "",
        },
        images: {
          pdp_mobile: [],
          pdp_tablet: [],
          pdp_large: [],
          all: [],
        },
      };
    }

    product = await enrichProductFromPdp(product);

    return res.status(200).json({
      product,
      results: allResults,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Erreur serveur",
    });
  }
}