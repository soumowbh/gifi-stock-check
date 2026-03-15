const STORES = [
  { city: "Villefranche-sur-Saone", postalCode: "69400" },
  { city: "Neuville-sur-Saone", postalCode: "69250" },
  { city: "Limonest", postalCode: "69760" },
  { city: "L'Arbresle", postalCode: "69210" },
  { city: "Beynost", postalCode: "01700" },
  { city: "Villeurbanne", postalCode: "69100" },
  { city: "Saint-Genis-Laval", postalCode: "69230" },
  { city: "Saint-Priest", postalCode: "69800" },
  { city: "Givors", postalCode: "69700" },
  { city: "Vaulx-en-Velin", postalCode: "69120" }
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
  { storeName: "Gifi Meyzieu", postalCode: "69330" }
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
    if (normalized === refName || normalized.includes(refName) || refName.includes(normalized)) {
      return ref.postalCode;
    }
  }

  return "";
}

function toProductId(productCode) {
  const clean = String(productCode).replace(/\D/g, "");
  if (clean.length !== 6) {
    throw new Error(`Code article invalide : ${productCode}`);
  }
  return `000000000000${clean}`;
}

function getBusinessStatus(stock, safetyStock) {
  if (stock <= 0) return "INDISPO";
  if (stock < Math.ceil(safetyStock)) return "STOCK LIMITE";
  return "DISPO";
}

async function fetchGifiStores(postalCode, productCode, quantity, safetyStock) {
  const productId = toProductId(productCode);
  const productsParam = encodeURIComponent(`${productId}:${quantity}`);
  const safetyStockFormatted = Number(safetyStock).toFixed(1);

  const url =
    `https://www.gifi.fr/on/demandware.store/Sites-GIFI_FR-Site/fr_FR/Stores-FindStores` +
    `?products=${productsParam}&safetyStock=${safetyStockFormatted}&postalCode=${encodeURIComponent(postalCode)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Erreur GiFi HTTP ${response.status}`);
  }

  return response.json();
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
    const productCodes = Array.isArray(req.body?.productCodes) ? req.body.productCodes : [];
    const quantity = Number(req.body?.quantity ?? 1);
    const safetyStock = Number(req.body?.safetyStock ?? 5);

    if (productCodes.length === 0) {
      return res.status(400).json({ error: "Aucun code article fourni" });
    }

    const allResults = [];
    const seen = new Set();

    for (const productCode of productCodes) {
      for (const storeSearch of STORES) {
        let data;

        try {
          data = await fetchGifiStores(
            storeSearch.postalCode,
            productCode,
            quantity,
            safetyStock
          );
        } catch {
          continue;
        }

        const stores = Array.isArray(data?.stores) ? data.stores : [];

        for (const store of stores) {
          const storeId = store?.id || "";
          const uniqueKey = `${productCode}|${storeId}`;

          if (seen.has(uniqueKey)) {
            continue;
          }
          seen.add(uniqueKey);

          const stockInfo = store?.productStockInfo || {};
          const stock = Number.isFinite(Number(stockInfo.stock)) ? Number(stockInfo.stock) : 0;

          allResults.push({
            cp: resolveStorePostalCode(store?.name || ""),
            magasin: store?.name || "",
            codeArticle: productCode,
            stocks: stock,
            status: getBusinessStatus(stock, safetyStock)
          });
        }
      }
    }

    allResults.sort((a, b) => {
      if (a.cp !== b.cp) return a.cp.localeCompare(b.cp);
      if (a.magasin !== b.magasin) return a.magasin.localeCompare(b.magasin);
      return a.codeArticle.localeCompare(b.codeArticle);
    });

    return res.status(200).json({ results: allResults });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
