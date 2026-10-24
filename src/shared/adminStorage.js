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
const productSampleCatalogVersion = "3";
const previousSampleProductImages = {
  beverages: "photo-1544145945-f90425340c7e",
  toothpaste: "photo-1609840114035-3c981b782dfe",
  shampoo: "photo-1600857544200-b2f666a9a2ec",
  toothbrush: "photo-1609840114035-3c981b782dfe",
  detergent: "photo-1604335399105-a0c585fd81a1",
};

export function readStoredList(section, fallback) {
  const value = window.localStorage.getItem(adminStorageKeys[section]);
  if (!value) return fallback;
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(`Saved ${section} data must be a list.`);
  }
  if (section === "products" && window.localStorage.getItem(productSampleCatalogVersionKey) !== productSampleCatalogVersion) {
    const productIds = new Set(parsed.map((product) => product.id));
    const latestProducts = new Map(fallback.map((product) => [product.id, product]));
    const refreshed = parsed.map((product) => {
      const previousImage = previousSampleProductImages[product.id];
      const latestProduct = latestProducts.get(product.id);
      return previousImage && latestProduct && product.image === previousImage
        ? { ...product, image: latestProduct.image }
        : product;
    });
    const migrated = [
      ...refreshed,
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
