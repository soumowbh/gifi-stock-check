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
    .replace(/saint/g, "st")
    .replace(/sainte/g, "ste")
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
  if (stock < Math.ceil(Number(safetyStock) || 0)) return "Stock limité";
  return "Disponible";
}

function parsePriceToNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value)
    .replace(/[€\s]/g, "")
    .replace(",", ".");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatEuro(value) {
  if (!Number.isFinite(value)) return "";
  return `${value.toFixed(2).replace(".", ",")} €`;
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
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

async function fetchProductDetails(productCode) {
  const productId = toProductId(productCode);

  const url =
    `https://www.gifi.fr/on/demandware.store/Sites-GIFI_FR-Site/fr_FR/Product-Variation` +
    `?pid=${encodeURIComponent(productId)}`;

  const data = await fetchJson(url);
  const product = data?.product || {};

  const imageUrl =
    product?.images?.pdp_large?.[0]?.absURL ||
    product?.images?.large?.[0]?.absURL ||
    product?.images?.small?.[0]?.absURL ||
    product?.images?.pdp_zoom?.[0]?.absURL ||
    "";

  const salesFormatted = product?.price?.sales?.formatted || "";
  const salesValue = parsePriceToNumber(product?.price?.sales?.value);

  const listFormatted = product?.price?.list?.formatted || "";
  const listValue = parsePriceToNumber(product?.price?.list?.value);

  const vipEnabled = Boolean(product?.vipTag?.name);
  const vipLabel = product?.vipTag?.name || "";
  const vipPriceInfoValue = parsePriceToNumber(product?.vipTag?.priceInfo);

  let oldPriceFormatted = "";
  let oldPriceValue = null;

  if (listFormatted && listValue && listValue > 0) {
    oldPriceFormatted = listFormatted;
    oldPriceValue = listValue;
  } else if (vipPriceInfoValue && vipPriceInfoValue > 0) {
    oldPriceFormatted = formatEuro(vipPriceInfoValue);
    oldPriceValue = vipPriceInfoValue;
  }

  let discountPercent = null;
  if (
    oldPriceValue &&
    salesValue &&
    oldPriceValue > 0 &&
    salesValue > 0 &&
    salesValue < oldPriceValue
  ) {
    discountPercent = Math.round(((oldPriceValue - salesValue) / oldPriceValue) * 100);
  }

  const ecoTaxMessage = product?.pdpInfo?.pdpDisplayEcoTaxMsg || "";

  return {
    productId,
    codeArticle: String(productCode).replace(/\D/g, ""),
    libelle: product?.productName || "",
    imageUrl,
    prix: salesFormatted,
    prixValeur: salesValue,
    ancienPrix: oldPriceFormatted,
    ancienPrixValeur: oldPriceValue,
    ecoTaxMessage,
    disponibleWeb: Boolean(product?.available),
    vip: {
      enabled: vipEnabled,
      label: vipLabel,
      discountPercent,
    },
  };
}

async function fetchStoreStocks(productCode, quantity, safetyStock, postalCode) {
  const productId = toProductId(productCode);
  const productsParam = encodeURIComponent(`${productId}:${quantity}`);

  const url =
    `https://www.gifi.fr/on/demandware.store/Sites-GIFI_FR-Site/fr_FR/Stores-InventorySearch` +
    `?showMap=false&horizontalView=true&isForm=true` +
    `&products=${productsParam}` +
    `&safetyStock=${encodeURIComponent(String(Number(safetyStock)))}` +
    `&postalCode=${encodeURIComponent(postalCode)}`;

  return await fetchJson(url);
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
    { length: Math.min(limit, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
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
    const productCode = String(req.body?.productCode || "").trim();
    const quantity = Number(req.body?.quantity ?? 1);
    const safetyStock = Number(req.body?.safetyStock ?? 5);

    if (!productCode) {
      return res.status(400).json({ error: "Aucun code article fourni" });
    }

    const product = await fetchProductDetails(productCode);

    const allowedPostalCodes = new Set(["69100", "69400"]);
    const filteredStores = STORES.filter(
      (store, index, array) =>
        allowedPostalCodes.has(store.postalCode) &&
        index === array.findIndex((s) => s.postalCode === store.postalCode)
    );

    const rawResponses = await mapWithConcurrency(
      filteredStores,
      2,
      async (storeSearch) => {
        const data = await fetchStoreStocks(
          productCode,
          quantity,
          safetyStock,
          storeSearch.postalCode
        );
        return { postalCode: storeSearch.postalCode, data };
      }
    );

    const results = [];
    const seen = new Set();

    for (const item of rawResponses) {
      if (!item || item.error || !item.data) continue;

      const stores = Array.isArray(item.data?.stores) ? item.data.stores : [];

      for (const store of stores) {
        const storeId = store?.id || "";
        const uniqueKey = `${product.codeArticle}|${storeId}`;

        if (seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        const stockInfo = store?.productStockInfo || {};
        const stock = Number.isFinite(Number(stockInfo.stock))
          ? Number(stockInfo.stock)
          : 0;

        results.push({
          cp: resolveStorePostalCode(store?.name || ""),
          magasin: store?.name || "",
          codeArticle: product.codeArticle,
          stocks: stock,
          status: getBusinessStatus(stock, safetyStock),
        });
      }
    }

    results.sort((a, b) => {
      if (a.cp !== b.cp) return a.cp.localeCompare(b.cp);
      return a.magasin.localeCompare(b.magasin);
    });

    return res.status(200).json({
      product,
      results,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}