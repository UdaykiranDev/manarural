import React, { useMemo, useState } from "react";
import { featuredProducts, groceryCategories, productTeluguNames, sampleBrands } from "../shared/catalog.js";
import { readStoredList, writeStoredList } from "../shared/adminStorage.js";
import { endDemoSession } from "../shared/demoAuth.js";
import "./admin.css";

const sections = {
  products: {
    title: "Products",
    fields: [
      ["name", "Product name", "text"],
      ["teluguName", "Product name in Telugu", "text"],
      ["detail", "Description", "text"],
      ["category", "Category ID", "text"],
      ["image", "Image ID / URL", "text"],
      ["variants", "Pack variants (label:price, comma separated)", "text"],
      ["rating", "Rating out of 5", "number"],
      ["ratingCount", "Rating count", "number"],
      ["color", "Card color theme", "text"],
    ],
    columns: ["name", "teluguName", "category", "variants", "rating", "ratingCount"],
  },
  categories: {
    title: "Categories",
    fields: [
      ["id", "Category ID (used by products)", "text"],
      ["name", "Category name", "text"],
      ["icon", "Icon / emoji", "text"],
      ["description", "Description", "text"],
      ["items", "Shelf items (comma separated)", "textarea"],
    ],
    columns: ["id", "name", "icon", "description", "items"],
  },
  brands: {
    title: "Brands",
    fields: [["name", "Brand name", "text"], ["category", "Category", "select-category"], ["status", "Status", "text"]],
    columns: ["name", "category", "status"],
  },
  locations: {
    title: "Locations",
    fields: [["name", "Location name", "text"], ["region", "Region", "text"], ["address", "Address", "text"], ["phone", "Phone", "tel"]],
    columns: ["name", "region", "address", "phone"],
  },
  reviews: {
    title: "Reviews",
    fields: [["type", "Review type", "select"], ["customer", "Customer name", "text"], ["product", "Product", "select-product"], ["store", "Store", "text"], ["rating", "Rating (1–5)", "number"], ["comment", "Review", "textarea"], ["status", "Status", "text"]],
    columns: ["type", "customer", "product", "store", "rating", "comment", "status"],
  },
  stores: {
    title: "Stores",
    fields: [["name", "Store name", "text"], ["location", "Location", "text"], ["address", "Address", "text"], ["phone", "Phone", "tel"], ["status", "Status", "text"]],
    columns: ["name", "location", "address", "phone", "status"],
  },
  users: {
    title: "Users",
    fields: [["name", "Name", "text"], ["email", "Email", "email"], ["phone", "Phone", "tel"], ["role", "Role", "text"], ["status", "Status", "text"]],
    columns: ["name", "email", "phone", "role", "status"],
  },
};

const emptyLists = { locations: [], reviews: [], stores: [], users: [] };
const labels = Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, value.title]));
const reportPeriods = {
  daily: "Today",
  weekly: "This week",
  monthly: "This month",
  yearly: "This year",
};

function getReportBuckets(period, now) {
  const buckets = [];
  if (period === "daily") {
    for (let hour = 0; hour < 24; hour += 1) {
      const start = new Date(now);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + 1);
      buckets.push({ start, end, label: hour % 3 === 0 ? `${String(hour).padStart(2, "0")}:00` : "" });
    }
    return buckets;
  }
  if (period === "weekly") {
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date(now);
      start.setDate(now.getDate() - offset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      buckets.push({ start, end, label: start.toLocaleDateString(undefined, { weekday: "short" }) });
    }
    return buckets;
  }
  if (period === "monthly") {
    const dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= dayCount; day += 1) {
      const start = new Date(now.getFullYear(), now.getMonth(), day);
      const end = new Date(now.getFullYear(), now.getMonth(), day + 1);
      buckets.push({ start, end, label: day === 1 || day % 5 === 0 ? String(day) : "" });
    }
    return buckets;
  }
  for (let offset = 11; offset >= 0; offset -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
    buckets.push({ start, end, label: start.toLocaleDateString(undefined, { month: "short" }) });
  }
  return buckets;
}

function createReport(period, orders, useExamples) {
  const now = new Date();
  const buckets = getReportBuckets(period, now).map((bucket) => ({ ...bucket, sales: 0, units: 0, orders: 0 }));
  if (useExamples) {
    const examples = {
      daily: [[8, 240, 2, 1], [10, 520, 5, 3], [13, 380, 3, 2], [17, 890, 7, 4], [20, 460, 4, 2]],
      weekly: [[0, 820, 11, 14], [1, 1240, 16, 21], [2, 960, 13, 17], [3, 1570, 19, 26], [4, 1180, 15, 19], [5, 1920, 24, 31], [6, 1450, 18, 23]],
      monthly: [[1, 930, 12, 16], [4, 1280, 17, 22], [8, 760, 10, 13], [12, 1840, 22, 29], [17, 1460, 18, 24], [22, 2150, 27, 35], [27, 1320, 16, 21]],
      yearly: [[0, 12400, 150, 203], [1, 13800, 168, 224], [2, 11700, 142, 188], [3, 15900, 194, 257], [4, 14600, 181, 239], [5, 18300, 220, 298], [6, 17100, 205, 273], [7, 19800, 242, 321], [8, 18700, 229, 304], [9, 22400, 270, 362], [10, 21300, 256, 341], [11, 24600, 298, 397]],
    }[period];
    if (period === "daily") {
      examples.forEach(([hour, sales, units, count]) => {
        const bucket = buckets[hour];
        if (bucket) Object.assign(bucket, { sales, units, orders: count });
      });
    } else {
      examples.forEach(([index, sales, units, count]) => {
        const bucket = buckets[index];
        if (bucket) Object.assign(bucket, { sales, units, orders: count });
      });
    }
  } else {
    orders.forEach((order) => {
      const createdAt = new Date(order.createdAt);
      const bucket = buckets.find((candidate) => createdAt >= candidate.start && createdAt < candidate.end);
      if (!bucket) return;
      bucket.sales += Number(order.total) || 0;
      bucket.orders += 1;
      bucket.units += order.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    });
  }
  return buckets;
}

function formatReportAmount(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function createId(value) {
  return `${value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function initialForm(section) {
  const form = Object.fromEntries(sections[section].fields.map(([name]) => [name, ""]));
  if (section === "brands") form.status = "Active";
  if (section === "reviews") {
    form.type = "product";
    form.rating = "5";
    form.status = "Pending";
  }
  return form;
}

function toForm(section, item) {
  const form = {};
  for (const [name] of sections[section].fields) {
    if (name === "variants") {
      form[name] = (item.variants || []).map((variant) => `${variant.label}:${variant.price}`).join(", ");
    } else if (name === "items") {
      form[name] = (item.items || []).join(", ");
    } else if (name === "teluguName") {
      form[name] = item[name] ?? productTeluguNames[item.name] ?? "";
    } else {
      form[name] = item[name] ?? "";
    }
  }
  if (section === "brands" && !form.status) form.status = "Active";
  if (section === "reviews" && !form.type) form.type = form.product ? "product" : "store";
  return form;
}

function fromForm(section, form, current) {
  const id = current?.id || form.id || createId(form.name || form.customer || form.email || section);
  if (section === "products") {
    const rating = Number(form.rating) || 0;
    const ratingCount = Number(form.ratingCount) || 0;
    const variants = form.variants.split(",").map((entry) => {
      const [label, rawPrice] = entry.trim().split(":");
      const price = Number(rawPrice);
      if (!label || !Number.isFinite(price) || price < 0) {
        throw new Error("Enter pack variants like “1 kg:68, 5 kg:325”.");
      }
      return { id: label.toLowerCase().replace(/[^a-z0-9]+/g, ""), label: label.trim(), price };
    });
    if (!variants.length) throw new Error("Add at least one pack variant.");
    if (rating < 0 || rating > 5 || ratingCount < 0 || !Number.isInteger(ratingCount)) {
      throw new Error("Product ratings must be 0–5 and the rating count must be a non-negative whole number.");
    }
    return { ...current, ...form, id, rating, ratingCount, variants };
  }
  if (section === "categories") {
    return { ...current, ...form, id, items: form.items.split(",").map((item) => item.trim()).filter(Boolean) };
  }
  if (section === "brands") return { ...current, ...form, id };
  if (section === "reviews") {
    const rating = Number(form.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Review ratings must be a whole number from 1 to 5.");
    }
    if (form.type === "product" && !form.product) throw new Error("Select a product for this review.");
    if (form.type === "store" && !form.store) throw new Error("Enter a store for this review.");
    return { ...current, ...form, id, rating, createdAt: current?.createdAt || new Date().toISOString() };
  }
  return { ...current, ...form, id };
}

function displayValue(section, item, column) {
  if (column === "variants") return (item.variants || []).map((variant) => `${variant.label} · ₹${variant.price}`).join(", ");
  if (column === "items") return `${(item.items || []).length} items`;
  if (column === "teluguName") return item.teluguName || productTeluguNames[item.name] || "—";
  return item[column] ?? "—";
}

function escapeCsv(value) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function downloadOrders(orders) {
  const headings = ["Order ID", "Date", "Status", "Customer", "Phone", "Product", "Variant", "Quantity", "Unit price (INR)", "Line total (INR)", "Order total (INR)"];
  const rows = orders.flatMap((order) => order.items.map((item) => [
    order.id,
    order.createdAt,
    order.status || "Sent to WhatsApp",
    order.customerName,
    order.phone,
    item.name,
    item.variant,
    item.quantity,
    item.unitPrice,
    item.lineTotal,
    order.total,
  ]));
  const csv = [headings, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "manarural-orders.csv";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminPanel() {
  const [data, setData] = useState(() => ({
    products: readStoredList("products", featuredProducts),
    categories: readStoredList("categories", groceryCategories),
    brands: readStoredList("brands", sampleBrands),
    ...Object.fromEntries(Object.keys(emptyLists).map((key) => [key, readStoredList(key, emptyLists[key])])),
    orders: readStoredList("orders", []),
  }));
  const [active, setActive] = useState("reports");
  const [period, setPeriod] = useState("weekly");
  const [reviewFilter, setReviewFilter] = useState("product");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(() => initialForm("products"));
  const [error, setError] = useState("");
  const currentSection = sections[active];
  const rows = sections[active] ? data[active] : [];
  const orderCount = useMemo(() => data.orders.length, [data.orders]);
  const usingExamples = data.orders.length === 0;
  const reportBuckets = useMemo(() => createReport(period, data.orders, usingExamples), [period, data.orders, usingExamples]);
  const reportTotals = useMemo(() => reportBuckets.reduce((totals, bucket) => ({
    sales: totals.sales + bucket.sales,
    orders: totals.orders + bucket.orders,
    units: totals.units + bucket.units,
  }), { sales: 0, orders: 0, units: 0 }), [reportBuckets]);
  const maxSales = Math.max(1, ...reportBuckets.map((bucket) => bucket.sales));
  const maxUnits = Math.max(1, ...reportBuckets.map((bucket) => bucket.units));
  const productReviewReports = useMemo(() => data.products.map((product) => {
    const productReviews = data.reviews.filter((review) => review.type !== "store" && (review.product === product.id || review.product === product.name));
    const average = productReviews.length
      ? productReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / productReviews.length
      : 0;
    return { product, reviews: productReviews, average };
  }), [data.products, data.reviews]);
  const storeReviewReports = useMemo(() => {
    const storeNames = new Set([
      ...data.stores.map((store) => store.name).filter(Boolean),
      ...data.reviews.filter((review) => review.type === "store").map((review) => review.store).filter(Boolean),
    ]);
    return [...storeNames].map((store) => {
      const reviews = data.reviews.filter((review) => (review.type === "store" || (!review.type && !review.product)) && review.store === store);
      const average = reviews.length
        ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
        : 0;
      return { store, reviews, average };
    });
  }, [data.stores, data.reviews]);
  const visibleReviews = useMemo(
    () => data.reviews.filter((review) => reviewFilter === "store" ? review.type === "store" || (!review.type && !review.product) : review.type !== "store" && Boolean(review.product)),
    [data.reviews, reviewFilter],
  );

  function startNew() {
    setEditing(null);
    setForm(initialForm(active));
    setError("");
  }

  function saveEntry(event) {
    event.preventDefault();
    try {
      if (active === "products" && !data.categories.some((category) => category.id === form.category)) {
        throw new Error("Choose a category ID that exists in the category list.");
      }
      if (active === "brands" && !data.categories.some((category) => category.id === form.category)) {
        throw new Error("Choose an existing category for this brand.");
      }
      if (active === "reviews" && form.type === "product" && !data.products.some((product) => product.id === form.product || product.name === form.product)) {
        throw new Error("Choose a product from the catalog for this review.");
      }
      const updatedEntry = fromForm(active, form, editing);
      const updatedRows = editing
        ? rows.map((row) => row.id === editing.id ? updatedEntry : row)
        : [...rows, updatedEntry];
      writeStoredList(active, updatedRows);
      setData((current) => ({ ...current, [active]: updatedRows }));
      setEditing(null);
      setForm(initialForm(active));
      setError("");
    } catch (saveError) {
      setError(saveError.message || "Could not save this entry.");
    }
  }

  function removeEntry(item) {
    if (active === "categories" && (data.products.some((product) => product.category === item.id) || data.brands.some((brand) => brand.category === item.id))) {
      setError("Move or delete the products and brands in this category before deleting it.");
      return;
    }
    if (!window.confirm(`Delete “${item.name || item.customer || item.email}”?`)) return;
    try {
      const updatedRows = rows.filter((row) => row.id !== item.id);
      writeStoredList(active, updatedRows);
      setData((current) => ({ ...current, [active]: updatedRows }));
      if (editing?.id === item.id) startNew();
      setError("");
    } catch (saveError) {
      setError(saveError.message || "Could not delete this entry.");
    }
  }

  function changeSection(section) {
    setActive(section);
    setEditing(null);
    setForm(sections[section] ? initialForm(section) : initialForm("products"));
    setError("");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href={import.meta.env.BASE_URL}>Mana<span>Rural</span><small>ADMIN</small></a>
        <button className="admin-store-link" onClick={() => { endDemoSession(); window.location.assign(import.meta.env.BASE_URL); }}>Sign out</button>
        <a className="admin-store-link" href={import.meta.env.BASE_URL}>← Back to storefront</a>
      </header>
      <main className="admin-main">
        <div className="admin-title"><div><p className="admin-eyebrow">STORE MANAGEMENT</p><h1>Admin panel</h1><p>Manage your catalog and keep a local order register.</p></div><div className="admin-storage-label">Saved in this browser</div></div>
        <div className="admin-warning"><b>Demo access only:</b> this frontend checks a phone number but does not verify identity. Do not use this gate to protect real admin data. Connect .NET authentication and server-side authorization before launch.</div>
        <div className="admin-warning"><b>Browser-only storage:</b> this panel has no sign-in or server database. Changes and order history stay in this browser and do not sync to other devices. Export orders regularly for backup.</div>
        <nav className="admin-tabs" aria-label="Admin sections">
          <button className={active === "reports" ? "active" : ""} onClick={() => changeSection("reports")}>Reports</button>
          {Object.keys(sections).map((section) => <button key={section} className={active === section ? "active" : ""} onClick={() => changeSection(section)}>{labels[section]}<span>{data[section].length}</span></button>)}
          <button className={active === "orders" ? "active" : ""} onClick={() => changeSection("orders")}>Orders<span>{orderCount}</span></button>
        </nav>

        {active === "reports" ? (
          <section className="admin-reports">
            <div className="admin-report-toolbar"><div><p className="admin-eyebrow">PERFORMANCE OVERVIEW</p><h2>{reportPeriods[period]} report</h2><p>{usingExamples ? "Illustrative sample figures; no saved orders yet." : "Based on submitted WhatsApp order requests for this browser."}</p></div><div className="admin-period-switch" aria-label="Report period">{Object.entries(reportPeriods).map(([key, title]) => <button key={key} className={period === key ? "active" : ""} onClick={() => setPeriod(key)}>{title}</button>)}</div></div>
            {usingExamples && <div className="admin-warning report-demo-note"><b>Sample report:</b> figures below are examples and are not saved as sales or orders. Submitted request estimates will replace the samples when available.</div>}
            <div className="admin-kpis">
              <article className="admin-kpi"><span>Estimated sales</span><strong>{formatReportAmount(reportTotals.sales)}</strong><small>{usingExamples ? "sample amount" : "submitted order estimates"}</small></article>
              <article className="admin-kpi"><span>Orders</span><strong>{reportTotals.orders}</strong><small>{usingExamples ? "sample orders" : reportPeriods[period].toLowerCase()}</small></article>
              <article className="admin-kpi"><span>Products requested</span><strong>{reportTotals.units}</strong><small>{usingExamples ? "sample units" : "items in orders"}</small></article>
              <article className="admin-kpi"><span>Products in catalog</span><strong>{data.products.length}</strong><small>{data.categories.length} categories</small></article>
            </div>
            <div className="admin-chart-grid">
              <section className="admin-card admin-chart-card"><div className="admin-chart-heading"><div><h3>Estimated sales</h3><p>Value of submitted order requests · INR</p></div><b>{formatReportAmount(reportTotals.sales)}</b></div><div className={`admin-bar-chart ${period}`} role="img" aria-label={`Estimated sales chart for ${reportPeriods[period]}`}><div className="admin-bars">{reportBuckets.map((bucket, index) => <div className="admin-bar-slot" key={`${bucket.label}-${index}`} title={`${bucket.start.toLocaleDateString()} ${period === "daily" ? bucket.start.toLocaleTimeString([], { hour: "2-digit" }) : ""}: ${formatReportAmount(bucket.sales)}`}><div className="admin-bar-track"><span style={{ height: `${Math.max(bucket.sales ? 3 : 0, bucket.sales / maxSales * 100)}%` }} /></div><small>{bucket.label}</small></div>)}</div></div></section>
              <section className="admin-card admin-chart-card"><div className="admin-chart-heading"><div><h3>Product units</h3><p>Quantity requested in each order</p></div><b>{reportTotals.units} units</b></div><div className={`admin-bar-chart ${period}`} role="img" aria-label={`Product units chart for ${reportPeriods[period]}`}><div className="admin-bars">{reportBuckets.map((bucket, index) => <div className="admin-bar-slot" key={`${bucket.label}-${index}`} title={`${bucket.label || bucket.start.toLocaleDateString()}: ${bucket.units} units`}><div className="admin-bar-track units"><span style={{ height: `${Math.max(bucket.units ? 3 : 0, bucket.units / maxUnits * 100)}%` }} /></div><small>{bucket.label}</small></div>)}</div></div></section>
            </div>
            <p className="admin-footnote">Sales are estimates calculated from basket prices when a customer submits an order request. They are not verified, paid, or fulfilled sales. Reports and orders only include records saved in this browser.</p>
          </section>
        ) : active === "orders" ? (
          <section className="admin-card">
            <div className="admin-card-heading"><div><p className="admin-eyebrow">ORDER REGISTER</p><h2>Submitted orders</h2><p>Orders are recorded when a basket is sent from this browser.</p></div><button className="admin-button primary" onClick={() => downloadOrders(data.orders)} disabled={!data.orders.length}>Export Excel CSV</button></div>
            {data.orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order / date</th><th>Status</th><th>Customer</th><th>Items</th><th>Estimate</th></tr></thead><tbody>{[...data.orders].reverse().map((order) => <tr key={order.id}><td><b>{order.id}</b><small>{new Date(order.createdAt).toLocaleString()}</small></td><td>{order.status || "Submitted"}</td><td>{order.customerName || "Guest"}<small>{order.phone || "No phone provided"}</small></td><td>{order.items.map((item) => `${item.name}${item.variant ? ` (${item.variant})` : ""} × ${item.quantity}`).join(", ")}</td><td>₹{Number(order.total).toFixed(2)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No submitted orders recorded yet.</p>}
          </section>
        ) : active === "reviews" ? (
          <section className="admin-reviews">
            <div className="admin-card-heading admin-reviews-heading"><div><p className="admin-eyebrow">CUSTOMER FEEDBACK</p><h2>Product &amp; store reviews</h2><p>Review counts and average ratings are calculated from the reviews managed here.</p></div><button className="admin-button primary" onClick={() => { setEditing(null); setReviewFilter("product"); setForm(initialForm("reviews")); setError(""); }}>Write a review</button></div>
            <div className="admin-review-switch" aria-label="Choose review reports">
              <button className={reviewFilter === "product" ? "active" : ""} onClick={() => { setReviewFilter("product"); setEditing(null); setForm({ ...initialForm("reviews"), type: "product" }); setError(""); }}>Product reviews</button>
              <button className={reviewFilter === "store" ? "active" : ""} onClick={() => { setReviewFilter("store"); setEditing(null); setForm({ ...initialForm("reviews"), type: "store" }); setError(""); }}>Store reviews</button>
            </div>
            {reviewFilter === "product" ? (
              <div className="product-review-reports">
                {productReviewReports.map(({ product, reviews: productReviews, average }) => <article className="admin-card product-review-report" key={product.id}>
                  <div className="product-review-report-title"><div><h3>{product.name}</h3><small>{productReviews.length} {productReviews.length === 1 ? "review" : "reviews"}</small></div><button className="admin-review-add" onClick={() => { setEditing(null); setForm({ ...initialForm("reviews"), type: "product", product: product.id }); setError(""); }}>Add review</button></div>
                  {productReviews.length ? <div className="admin-rating-summary"><span className="admin-review-stars" aria-label={`${average.toFixed(1)} out of 5`}>{"★".repeat(Math.round(average))}{"☆".repeat(5 - Math.round(average))}</span><strong>{average.toFixed(1)}</strong><small>{productReviews.length} customer {productReviews.length === 1 ? "review" : "reviews"}</small></div> : <div className="admin-rating-summary no-reviews"><span className="admin-review-stars">☆☆☆☆☆</span><strong>—</strong><small>No customer reviews yet</small></div>}
                  {!productReviews.length && product.ratingCount > 0 && <small className="admin-sample-rating">Catalog sample: {product.rating?.toFixed(1)} / 5 · {product.ratingCount} ratings</small>}
                  {productReviews.slice(0, 2).map((review) => <div className="admin-review-quote" key={review.id}><b>{review.customer || "Customer"}</b><span>{"★".repeat(Number(review.rating) || 0)}{"☆".repeat(5 - (Number(review.rating) || 0))}</span><p>{review.comment || "No written comment."}</p><small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date unavailable"}</small></div>)}
                </article>)}
              </div>
            ) : (
              <div className="store-review-reports">
                {storeReviewReports.length ? storeReviewReports.map(({ store, reviews: storeReviews, average }) => <article className="admin-card store-review-report" key={store}>
                  <div><p className="admin-eyebrow">STORE REVIEWS</p><h3>{store}</h3></div>
                  <div className="admin-rating-summary"><span className="admin-review-stars">{"★".repeat(Math.round(average))}{"☆".repeat(5 - Math.round(average))}</span><strong>{storeReviews.length ? average.toFixed(1) : "—"}</strong><small>{storeReviews.length} {storeReviews.length === 1 ? "review" : "reviews"}</small></div>
                  {storeReviews.length ? storeReviews.map((review) => <div className="admin-review-quote" key={review.id}><b>{review.customer || "Customer"}</b><span>{"★".repeat(Number(review.rating) || 0)}{"☆".repeat(5 - (Number(review.rating) || 0))}</span><p>{review.comment || "No written comment."}</p><small>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date unavailable"}</small></div>) : <p className="admin-empty">No customer reviews for this store yet.</p>}
                </article>) : <div className="admin-card"><p className="admin-empty">Add a store under Stores, or add the first store review with the form.</p></div>}
              </div>
            )}
            <div className="admin-content admin-review-content">
              <section className="admin-card admin-list-card">
                <div className="admin-card-heading"><div><p className="admin-eyebrow">REVIEW RECORDS</p><h2>{reviewFilter === "store" ? "Store reviews" : "Product reviews"}</h2><p>{visibleReviews.length} saved reviews</p></div></div>
                {visibleReviews.length ? <div className="admin-review-list">{[...visibleReviews].reverse().map((review) => {
                  const product = data.products.find((item) => item.id === review.product || item.name === review.product);
                  return <article className="admin-review-entry" key={review.id}>
                    <div className="admin-review-avatar">{(review.customer || "C").trim().charAt(0).toUpperCase()}</div>
                    <div className="admin-review-entry-copy"><div className="admin-review-entry-top"><b>{review.customer || "Customer"}</b>{review.status?.toLowerCase() === "verified" && <span className="admin-verified">Verified</span>}</div><small>{review.type === "store" ? review.store : product?.name || review.product} · {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Date unavailable"}</small><span className="admin-review-stars">{"★".repeat(Number(review.rating) || 0)}{"☆".repeat(5 - (Number(review.rating) || 0))}</span><p>{review.comment || "No written comment."}</p></div>
                    <div className="admin-row-actions"><button onClick={() => { setEditing(review); setForm(toForm("reviews", review)); setError(""); }}>Edit</button><button onClick={() => removeEntry(review)}>Delete</button></div>
                  </article>;
                })}</div> : <p className="admin-empty">No {reviewFilter} reviews yet. Add one using the form.</p>}
              </section>
              <section className="admin-card admin-form-card">
                <div className="admin-card-heading"><div><p className="admin-eyebrow">{editing ? "UPDATE REVIEW" : "NEW REVIEW"}</p><h2>{editing ? "Edit review" : "Add review"}</h2></div></div>
                <form onSubmit={saveEntry}>
                  {currentSection.fields.filter(([name]) => !["product", "store"].includes(name) || (form.type === "store" ? name === "store" : name === "product")).map(([name, label, type]) => <label key={name} className={type === "textarea" ? "admin-field full" : "admin-field"}><span>{label}</span>{type === "textarea" ? <textarea rows="3" value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={name === "comment"} /> : type === "select" ? <select value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}><option value="product">Product review</option><option value="store">Store review</option></select> : type === "select-product" ? <select value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required><option value="">Select a product</option>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select> : <input type={type} min={name === "rating" ? 1 : undefined} max={name === "rating" ? 5 : undefined} step={name === "rating" ? 1 : undefined} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={name !== "comment"} />}</label>)}
                  {error && <p className="admin-error" role="alert">{error}</p>}
                  <div className="admin-form-actions"><button className="admin-button primary" type="submit">{editing ? "Save changes" : "Add review"}</button><button className="admin-button" type="button" onClick={() => { setEditing(null); setForm({ ...initialForm("reviews"), type: reviewFilter }); setError(""); }}>Clear</button></div>
                </form>
              </section>
            </div>
            <p className="admin-footnote">Only reviews entered in this admin panel contribute to product and store averages. Catalog sample ratings are labeled separately.</p>
          </section>
        ) : (
          <div className="admin-content">
            <section className="admin-card admin-list-card">
              <div className="admin-card-heading"><div><p className="admin-eyebrow">MANAGE {currentSection.title.toUpperCase()}</p><h2>{currentSection.title} list</h2><p>{active === "brands" ? `${rows.length} brands · Sample brands are preloaded; availability may vary by store.` : `${rows.length} saved records`}</p></div><button className="admin-button primary" onClick={startNew}>Add {active === "products" ? "product" : active === "categories" ? "category" : active === "brands" ? "brand" : "record"}</button></div>
              {rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{currentSection.columns.map((column) => <th key={column}>{column === "ratingCount" ? "ratings" : column}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}>{currentSection.columns.map((column) => <td key={column}>{active === "brands" && column === "category" ? data.categories.find((category) => category.id === item.category)?.name || item.category : displayValue(active, item, column)}</td>)}<td className="admin-row-actions"><button onClick={() => { setEditing(item); setForm(toForm(active, item)); setError(""); }}>Edit</button><button onClick={() => removeEntry(item)}>Delete</button></td></tr>)}</tbody></table></div> : <p className="admin-empty">Nothing here yet. Add the first record.</p>}
            </section>
            <section className="admin-card admin-form-card">
              <div className="admin-card-heading"><div><p className="admin-eyebrow">{editing ? "UPDATE RECORD" : "NEW RECORD"}</p><h2>{editing ? "Edit" : "Add"} {active === "products" ? "product" : active === "categories" ? "category" : active.slice(0, -1)}</h2></div></div>
              <form onSubmit={saveEntry}>
                {currentSection.fields.filter(([name]) => active !== "reviews" || !["product", "store"].includes(name) || (form.type === "store" ? name === "store" : name === "product")).map(([name, label, type]) => <label key={name} className={type === "textarea" ? "admin-field full" : "admin-field"}><span>{label}</span>{type === "textarea" ? <textarea rows="3" value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={name === "items" || (active === "reviews" && name === "comment")} /> : type === "select" ? <select value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}><option value="product">Product review</option><option value="store">Store review</option></select> : type === "select-product" ? <select value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required><option value="">Select a product</option>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select> : type === "select-category" ? <select value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required><option value="">Select a category</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select> : <input type={type} step={type === "number" ? "1" : undefined} min={active === "reviews" && name === "rating" ? 1 : undefined} max={active === "reviews" && name === "rating" ? 5 : undefined} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} required={active === "reviews" ? ["customer", "rating", "status", "product", "store"].includes(name) : !["rating", "ratingCount"].includes(name)} disabled={name === "id" && Boolean(editing)} />}</label>)}
                {active === "reviews" && form.type === "product" && <datalist id="admin-product-options">{data.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</datalist>}
                {error && <p className="admin-error" role="alert">{error}</p>}
                <div className="admin-form-actions"><button className="admin-button primary" type="submit">{editing ? "Save changes" : "Add record"}</button><button className="admin-button" type="button" onClick={startNew}>Clear</button></div>
              </form>
            </section>
          </div>
        )}
        <p className="admin-footnote">This frontend-only panel is not protected by authentication. Do not enter sensitive customer information or expose it as a public production admin.</p>
      </main>
    </div>
  );
}
