export const adminStorageKeys = {
  products: "manarural:products",
  categories: "manarural:categories",
  brands: "manarural:brands",
  locations: "manarural:locations",
  reviews: "manarural:reviews",
  stores: "manarural:stores",
  users: "manarural:users",
  orders: "manarural:orders",
};

const productSampleCatalogVersionKey = "manarural:products:sample-catalog-version";
const productSampleCatalogVersion = "2";

export function readStoredList(section, fallback) {
  const value = window.localStorage.getItem(adminStorageKeys[section]);
  if (!value) return fallback;
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(`Saved ${section} data must be a list.`);
  }
  if (section === "products" && window.localStorage.getItem(productSampleCatalogVersionKey) !== productSampleCatalogVersion) {
    const productIds = new Set(parsed.map((product) => product.id));
    const migrated = [
      ...parsed,
      ...fallback.filter((product) => !productIds.has(product.id)),
    ];
    window.localStorage.setItem(adminStorageKeys.products, JSON.stringify(migrated));
    window.localStorage.setItem(productSampleCatalogVersionKey, productSampleCatalogVersion);
    return migrated;
  }
  return parsed;
}

export function writeStoredList(section, items) {
  window.localStorage.setItem(adminStorageKeys[section], JSON.stringify(items));
  if (section === "products") {
    window.localStorage.setItem(productSampleCatalogVersionKey, productSampleCatalogVersion);
  }
}
