import React, { useMemo, useState } from "react";
import {
  digitalServices,
  featuredProducts,
  groceryCategories,
  sampleShelfPrices,
  sampleBrands,
  productTeluguNames,
  whatsappNumber,
} from "../shared/catalog.js";
import { readStoredList } from "../shared/adminStorage.js";
import { endDemoSession, getDemoSession } from "../shared/demoAuth.js";
import "./styles.css";

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.4 4.4" /></svg>;
  if (name === "bag") return <svg {...common}><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
  if (name === "close") return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
  if (name === "minus") return <svg {...common}><path d="M5 12h14" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14m-7-7h14" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" /></svg>;
  if (name === "whatsapp") return <svg {...common}><path d="M20.2 11.7a8.2 8.2 0 0 1-12.1 7.2L4 20l1.2-4A8.2 8.2 0 1 1 20.2 11.7Z" /><path d="M8.5 8.2c.2-.5.5-.5.8-.5h.4c.2 0 .3.1.4.4l.6 1.4c.1.3.1.4-.1.6l-.5.6c-.2.2-.2.4-.1.6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.7-.8c.2-.2.4-.3.7-.2l1.3.6c.3.1.4.3.4.5 0 .3-.2 1-.6 1.3-.4.4-1 .6-1.6.6s-1.7-.3-2.9-1.1c-1.5-1-2.5-2.3-2.8-3.3-.4-1.1-.1-2.1.2-2.7Z" /></svg>;
  return null;
}

function whatsappLink(message) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

const formatPrice = (price) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
}).format(price);

function getProductDisplayName(product) {
  const teluguName = product.teluguName || productTeluguNames[product.name];
  return teluguName ? `${product.name} (${teluguName})` : product.name;
}

function getProductImageSrc(image, width, height) {
  if (!image) return "";
  if (/^(data:image\/|https?:\/\/)/i.test(image)) return image;
  if (image.startsWith("/") || image.includes("/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(image)) {
    return image.startsWith("/") ? image : `${import.meta.env.BASE_URL}${image}`;
  }
  return `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}${height ? `&h=${height}` : ""}&q=82`;
}

const scheduledServiceFields = {
  "Mobile recharge": [
    { name: "mobileNumber", label: "Mobile number", type: "tel", required: true, placeholder: "10-digit mobile number", pattern: "[0-9]{10}" },
    { name: "operator", label: "Operator", type: "text", required: true, placeholder: "e.g. Jio, Airtel, Vi, BSNL" },
    { name: "amount", label: "Recharge amount (₹)", type: "number", required: true, min: "1", step: "1" },
  ],
  "DTH & cable": [
    { name: "provider", label: "DTH / cable provider", type: "text", required: true, placeholder: "e.g. Tata Play, Airtel, local cable" },
    { name: "subscriberId", label: "Subscriber / customer ID", type: "text", required: true },
    { name: "amount", label: "Recharge amount (₹)", type: "number", required: true, min: "1", step: "1" },
  ],
  "Electricity bills": [
    { name: "provider", label: "Electricity provider / DISCOM", type: "text", required: true },
    { name: "consumerNumber", label: "Consumer / service number", type: "text", required: true },
    { name: "amount", label: "Bill amount (₹)", type: "number", required: true, min: "1", step: "0.01" },
  ],
  "Gas Cylinder Booking": [
    { name: "consumerNumber", label: "Gas customer / consumer number", type: "text", required: true },
    { name: "provider", label: "Gas provider", type: "text", required: true, placeholder: "e.g. Indane, Bharat Gas, HP Gas" },
  ],
  "PAN & document prints": [
    { name: "documentService", label: "Document / service needed", type: "text", required: true, placeholder: "e.g. PAN application, Aadhaar print" },
    { name: "applicantName", label: "Applicant name", type: "text", required: true, autoComplete: "name" },
    { name: "details", label: "Additional details", type: "text", required: false, placeholder: "Tell us what help you need" },
  ],
  "Travel bookings": [
    { name: "travelMode", label: "Travel type", type: "select", required: true, options: ["Flight", "Train", "Bus"] },
    { name: "travelClass", label: "Train class", type: "select", required: true, options: ["Sleeper", "AC class"] },
    { name: "origin", label: "From", type: "text", required: true },
    { name: "destination", label: "To", type: "text", required: true },
    { name: "travelDate", label: "Travel date", type: "date", required: true },
    { name: "passengers", label: "Number of passengers", type: "number", required: true, min: "1", step: "1" },
  ],
  "OTT subscriptions": [
    { name: "platform", label: "Streaming platform", type: "text", required: true, placeholder: "e.g. Netflix, Prime Video" },
    { name: "plan", label: "Plan / duration", type: "text", required: true, placeholder: "e.g. monthly, annual" },
    { name: "accountContact", label: "Account email or mobile", type: "text", required: true },
  ],
  "Gift cards": [
    { name: "brand", label: "Gift card brand", type: "text", required: true, placeholder: "e.g. Google Play" },
    { name: "amount", label: "Gift card amount (₹)", type: "number", required: true, min: "1", step: "1" },
    { name: "recipient", label: "Recipient contact (optional)", type: "text", required: false },
  ],
};

const recurringServiceTitles = new Set(["Mobile recharge", "DTH & cable", "Electricity bills"]);
const digitalServicePrices = [
  { service: "Xerox (Black & White)", telugu: "జిరాక్స్ (నలుపు & తెలుపు)", detail: "1 page / 1 పేజీ", price: "₹3.00" },
  { service: "Xerox (Double Side)", telugu: "జిరాక్స్ (రెండు వైపులా)", detail: "1 page / 1 పేజీ", price: "₹5.00" },
  { service: "Computer / WhatsApp Print (B&W)", telugu: "కంప్యూటర్ / వాట్సాప్ ప్రింట్ (నలుపు & తెలుపు)", detail: "1 page / 1 పేజీ", price: "₹10.00" },
  { service: "Color Print (A4)", telugu: "కలర్ ప్రింట్ (A4)", detail: "1 page / 1 పేజీ", price: "₹10.00" },
  { service: "Lamination (Aadhaar / ID Card)", telugu: "లామినేషన్ (ఆధార్ / గుర్తింపు కార్డు)", detail: "1 card / 1 కార్డు", price: "₹20.00" },
  { service: "Lamination (A4 Certificate)", telugu: "లామినేషన్ (A4 సర్టిఫికేట్)", detail: "1 page / 1 పేజీ", price: "₹30.00" },
  { service: "Electricity Bill Payment", telugu: "విద్యుత్ బిల్లు చెల్లింపు", detail: "1 bill / 1 బిల్లు", price: "₹5–₹10" },
  { service: "Gas Cylinder Booking", telugu: "గ్యాస్ సిలిండర్ బుకింగ్", detail: "1 booking / 1 బుకింగ్", price: "₹10.00" },
  { service: "Train Ticket Booking (Sleeper)", telugu: "రైలు టికెట్ బుకింగ్ (స్లీపర్)", detail: "1 ticket / 1 టికెట్", price: "₹30.00" },
  { service: "Train Ticket Booking (AC Class)", telugu: "రైలు టికెట్ బుకింగ్ (ఏసీ)", detail: "1 ticket / 1 టికెట్", price: "₹50.00" },
  { service: "Mobile & DTH Recharge", telugu: "మొబైల్ & DTH రీఛార్జ్", detail: "1 recharge / 1 రీఛార్జ్", price: "Below ₹199: ₹5; above ₹200: ₹10" },
];
const printServiceOptions = [
  { id: "xerox-bw", label: "Xerox (Black & White)", unit: "page", rate: 3 },
  { id: "xerox-double", label: "Xerox (Double Side)", unit: "page", rate: 5 },
  { id: "computer-print-bw", label: "Computer / WhatsApp Print (B&W)", unit: "page", rate: 10 },
  { id: "color-print-a4", label: "Color Print (A4)", unit: "page", rate: 10 },
  { id: "lamination-id", label: "Lamination (Aadhaar / ID Card)", unit: "card", rate: 20 },
  { id: "lamination-a4", label: "Lamination (A4 Certificate)", unit: "page", rate: 30 },
];
const rechargeServiceTitles = new Set(["Mobile recharge", "DTH & cable"]);
const getServiceScheduleOptions = (serviceTitle) => recurringServiceTitles.has(serviceTitle)
  ? [
      ["once", "As soon as possible"],
      ["date", "Choose a date"],
      ["monthly", "Repeat monthly"],
      ["weekly", "Repeat weekly"],
    ]
  : [["once", "As soon as possible"], ["date", "Choose a date"]];

function getServicePriceEstimate(service, details) {
  const amount = Number(details.amount);
  const passengerCount = Number(details.passengers);
  let serviceFee = null;
  let serviceFeeMax = null;
  let transactionAmount = Number.isFinite(amount) && amount > 0 ? amount : null;
  let transactionLabel = "";
  let externalAmountToConfirm = false;

  if (rechargeServiceTitles.has(service) && transactionAmount !== null) {
    serviceFee = transactionAmount < 199 ? 5 : transactionAmount > 200 ? 10 : null;
    transactionLabel = service === "Mobile recharge" ? "Recharge amount" : "DTH recharge amount";
  } else if (service === "Electricity bills") {
    serviceFee = 5;
    serviceFeeMax = 10;
    transactionLabel = "Electricity bill amount";
  } else if (service === "Gas Cylinder Booking") {
    serviceFee = 10;
    externalAmountToConfirm = true;
  } else if (service === "Travel bookings" && details.travelMode === "Train" && Number.isInteger(passengerCount) && passengerCount > 0) {
    const perTicketFee = details.travelClass === "Sleeper" ? 30 : details.travelClass === "AC class" ? 50 : null;
    if (perTicketFee !== null) {
      serviceFee = perTicketFee * passengerCount;
      externalAmountToConfirm = true;
    }
  }

  const lowTotal = serviceFee === null
    ? null
    : serviceFee + (transactionAmount ?? 0);
  const highTotal = serviceFeeMax === null
    ? lowTotal
    : serviceFeeMax + (transactionAmount ?? 0);
  return { serviceFee, serviceFeeMax, transactionAmount, transactionLabel, lowTotal, highTotal, externalAmountToConfirm };
}

function App() {
  const demoSession = getDemoSession();
  const [activeTab, setActiveTab] = useState("groceries");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [products] = useState(() => readStoredList("products", featuredProducts));
  const [categories] = useState(() => readStoredList("categories", groceryCategories));
  const [brands] = useState(() => readStoredList("brands", sampleBrands));
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [cart, setCart] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedBrands, setSelectedBrands] = useState({});
  const [printServiceOpen, setPrintServiceOpen] = useState(false);
  const [scheduledService, setScheduledService] = useState("");
  const [serviceSchedule, setServiceSchedule] = useState("once");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduleContact, setScheduleContact] = useState("");
  const [scheduledDetails, setScheduledDetails] = useState({});
  const [printQuantity, setPrintQuantity] = useState(1);
  const [printPages, setPrintPages] = useState(1);
  const [printServiceType, setPrintServiceType] = useState("xerox-bw");
  const [printOptions, setPrintOptions] = useState({
    paperSize: "A4",
    pageRange: "",
  });
  const [printFiles, setPrintFiles] = useState([]);
  const [printStatus, setPrintStatus] = useState("No files selected yet.");
  const [printCart, setPrintCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const servicePriceEstimate = getServicePriceEstimate(scheduledService, scheduledDetails);

  const inventoryItems = useMemo(() => categories.flatMap((category) => {
    const image = products.find((product) => product.category === category.id)?.image;
    return category.items.map((name, index) => ({
      id: `${category.id}-${index}`,
      name,
      teluguName: productTeluguNames[name] || "",
      detail: category.name,
      category: category.id,
      image,
      ...sampleShelfPrices[category.id]?.[name],
    }));
  }), [categories, products]);
  const allProducts = [...products, ...inventoryItems];
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.category === activeCategory;
      const matchesSearch = !query || `${getProductDisplayName(product)} ${product.detail}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const matchingItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return inventoryItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      return matchesCategory && `${getProductDisplayName(item)} ${item.detail}`.toLowerCase().includes(query);
    });
  }, [activeCategory, inventoryItems, search]);

  const visibleCategories = activeCategory === "all"
    ? categories
    : categories.filter((category) => category.id === activeCategory);
  const getProductBrands = (product) => brands.filter(
    (brand) => brand.category === product.category && brand.status?.toLowerCase() !== "inactive",
  );
  const cartItems = allProducts.flatMap((product) => {
    if (!product.variants) {
      return cart[product.id] ? [{
        ...product,
        cartKey: product.id,
        quantity: cart[product.id],
        unitPrice: product.price,
        unitLabel: product.label,
      }] : [];
    }
    const productBrands = getProductBrands(product);
    const brandOptions = [{ id: "", name: "Any available brand" }, ...productBrands];
    return product.variants.flatMap((variant) => brandOptions.flatMap((brand) => {
      const cartKey = `${product.id}::${brand.id || "any"}::${variant.id}`;
      return cart[cartKey] ? [{ ...product, variant, brand: brand.id ? brand : null, cartKey, quantity: cart[cartKey] }] : [];
    }));
  });
  const basketItems = [
    ...cartItems,
    ...printCart.map((job) => ({
      id: job.id,
      cartKey: job.id,
      name: "Xerox & printing",
      detail: "Document printing request",
      quantity: job.quantity,
      files: job.files,
      printOptions: job.options,
      serviceName: job.serviceName,
      pagesPerCopy: job.pagesPerCopy,
      unitPrice: job.unitRate * job.pagesPerCopy,
      unitLabel: `${job.pagesPerCopy} ${job.unit}`,
      serviceSubtotal: job.unitRate * job.pagesPerCopy * job.quantity,
    })),
  ];
  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0)
    + printCart.reduce((total, job) => total + job.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.variant?.price ?? item.unitPrice ?? 0) * item.quantity, 0);
  const printSubtotal = printCart.reduce((total, job) => total + job.unitRate * job.pagesPerCopy * job.quantity, 0);
  const groceryDeliveryCharge = cartItems.length ? (cartTotal <= 300 ? 30 : 0) : 0;
  const printDeliveryCharge = printCart.length ? (printSubtotal <= 300 ? 30 : 0) : 0;
  const deliveryCharge = groceryDeliveryCharge + printDeliveryCharge;
  const orderTotal = cartTotal + printSubtotal + deliveryCharge;
  const hasUnpricedItems = basketItems.some((item) => !Number.isFinite(item.variant?.price ?? item.unitPrice));
  const isLocalDelivery = deliveryPincode.trim() === "531036";
  const canProceedToCheckout = basketItems.length > 0 && !hasUnpricedItems && isLocalDelivery;
  const checkoutOrderLines = basketItems.map((item) => {
    const unitPrice = item.variant?.price ?? item.unitPrice;
    const unitLabel = item.variant?.label ?? item.unitLabel;
    const priceDetails = Number.isFinite(unitPrice)
      ? `${formatPrice(unitPrice)} each${unitLabel ? ` (${unitLabel})` : ""} — ${formatPrice(item.serviceSubtotal ?? unitPrice * item.quantity)}`
      : "Price to confirm";
    const brandDetails = item.brand ? ` · ${item.brand.name}` : "";
    const serviceDetails = item.serviceName ? ` · ${item.serviceName}` : "";
    return `${getProductDisplayName(item)}${brandDetails}${serviceDetails} x ${item.quantity} — ${priceDetails}`;
  });

  async function sendWhatsAppOrder(event) {
    event.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setNotice("Please enter your name, mobile number, and delivery address.");
      window.setTimeout(() => setNotice(""), 3000);
      return;
    }
    if (!basketItems.length || hasUnpricedItems || !isLocalDelivery) {
      setNotice("Please check your items and confirm delivery to PIN code 531036.");
      window.setTimeout(() => setNotice(""), 3000);
      return;
    }

    const message = [
      "Namaste ManaRural! I would like to place this order.",
      "",
      `Name: ${customerName.trim()}`,
      `Mobile: +91 ${customerPhone.trim()}`,
      `Delivery address: ${deliveryAddress.trim()}`,
      `PIN code: ${deliveryPincode.trim()}`,
      "",
      "Selected items:",
      ...checkoutOrderLines.map((line) => `• ${line}`),
      "",
      ...(cartItems.length ? [`Grocery subtotal: ${formatPrice(cartTotal)}`] : []),
      ...(printCart.length ? [`Xerox & printing subtotal: ${formatPrice(printSubtotal)}`] : []),
      `Grocery delivery charge: ${groceryDeliveryCharge ? formatPrice(groceryDeliveryCharge) : "None"}`,
      `Xerox & printing delivery charge: ${printDeliveryCharge ? formatPrice(printDeliveryCharge) : "None"}`,
      `Order total: ${formatPrice(orderTotal)}`,
    ].join("\n");

    const printDocuments = printCart.flatMap((job) => job.documents);
    if (printDocuments.length && navigator.share && navigator.canShare?.({ files: printDocuments })) {
      try {
        await navigator.share({ title: "ManaRural order request", text: message, files: printDocuments });
        setNotice("Share sheet closed. Check WhatsApp and send the request with your selected documents.");
        window.setTimeout(() => setNotice(""), 5000);
        return;
      } catch (shareError) {
        if (shareError.name === "AbortError") return;
      }
    }
    const attachmentNote = printDocuments.length
      ? "\nPlease attach the selected print documents in this WhatsApp chat."
      : "";
    window.open(whatsappLink(`${message}${attachmentNote}`), "_blank", "noopener,noreferrer");
    if (printDocuments.length) {
      setNotice("WhatsApp opened with your order details. Attach the selected print documents in the chat.");
      window.setTimeout(() => setNotice(""), 5000);
    }
  }

  function changeQuantity(id, amount) {
    if (id.startsWith("print-job-")) {
      setPrintCart((current) => {
        return current.flatMap((job) => {
          if (job.id !== id) return [job];
          const quantity = job.quantity + amount;
          return quantity > 0 ? [{ ...job, quantity }] : [];
        });
      });
      return;
    }
    setCart((current) => {
      const next = { ...current, [id]: (current[id] || 0) + amount };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }

  function addToCart(product, variant, brandId = "") {
    changeQuantity(variant ? `${product.id}::${brandId || "any"}::${variant.id}` : product.id, 1);
    setNotice(`${getProductDisplayName(product)} added to your list`);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function addPrintJobToCart() {
    if (!printFiles.length) {
      setPrintStatus("Choose at least one document before adding this print request.");
      return;
    }
    const selectedPrintService = printServiceOptions.find((service) => service.id === printServiceType);
    setPrintCart((current) => [...current, {
      id: `print-job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      quantity: printQuantity,
      files: printFiles.map((file) => file.name),
      documents: [...printFiles],
      options: { ...printOptions },
      serviceName: selectedPrintService.label,
      unit: selectedPrintService.unit,
      unitRate: selectedPrintService.rate,
      pagesPerCopy: printPages,
    }]);
    setCartOpen(true);
  }

  async function buyPrintJobNow() {
    if (!printFiles.length) {
      setPrintStatus("Choose at least one document before requesting printing.");
      return;
    }
    const selectedPrintService = printServiceOptions.find((service) => service.id === printServiceType);
    const files = printFiles.map((file) => file.name);
    const serviceSubtotal = selectedPrintService.rate * printPages * printQuantity;
    const deliveryFee = serviceSubtotal <= 300 ? 30 : 0;
    const message = [
      "Namaste ManaRural! I would like to request Xerox / printing.",
      `Print service: ${selectedPrintService.label}`,
      `Copies: ${printQuantity}`,
      `${selectedPrintService.unit === "card" ? "Cards" : "Pages"} per copy: ${printPages}`,
      `Service charge: ${formatPrice(selectedPrintService.rate)} per ${selectedPrintService.unit}`,
      `Print options: ${formatPrintOptions(printOptions)}`,
      `Page range: ${printOptions.pageRange.trim() || "All pages"}`,
      `Documents: ${files.join(", ")}`,
      `Printing service subtotal: ${formatPrice(serviceSubtotal)}`,
      `Print delivery charge: ${deliveryFee ? formatPrice(deliveryFee) : "Free (service subtotal above ₹300)"}`,
      `Estimated total: ${formatPrice(serviceSubtotal + deliveryFee)}`,
      "Please confirm the final amount and delivery availability before processing. This is a request, not a confirmed order.",
    ].join("\n");

    try {
      if (navigator.share && navigator.canShare?.({ files: printFiles })) {
        setPrintStatus("Opening your device share sheet with the selected documents and print details. Choose WhatsApp to send them.");
        await navigator.share({
          title: "ManaRural Xerox & printing request",
          text: message,
          files: printFiles,
        });
        setPrintStatus(`Share sheet closed. Estimated service charge ${formatPrice(serviceSubtotal)} + delivery ${deliveryFee ? formatPrice(deliveryFee) : "Free"} = ${formatPrice(serviceSubtotal + deliveryFee)}. Check WhatsApp and send the selected documents and request.`);
        return;
      }
    } catch (shareError) {
      if (shareError.name === "AbortError") {
        setPrintStatus("Sharing was cancelled. Your selected documents are still available here; try again when ready.");
        return;
      }
      setPrintStatus(`Your browser could not share files directly. Estimated total is ${formatPrice(serviceSubtotal + deliveryFee)} including delivery. WhatsApp will open with the request; attach the documents there.`);
      window.open(whatsappLink(`${message}\n\nPlease attach the selected documents in this chat.`), "_blank", "noopener,noreferrer");
      return;
    }

    setPrintStatus(`Estimated service charge ${formatPrice(serviceSubtotal)} + delivery ${deliveryFee ? formatPrice(deliveryFee) : "Free"} = ${formatPrice(serviceSubtotal + deliveryFee)}. WhatsApp will open with the request; attach the documents there.`);
    window.open(whatsappLink(`${message}\n\nPlease attach the selected documents in this chat.`), "_blank", "noopener,noreferrer");
  }

  function addPrintFiles(files) {
    const acceptedExtensions = /\.(pdf|jpe?g|png|docx?)$/i;
    const incomingFiles = Array.from(files);
    const supportedFiles = incomingFiles.filter((file) => acceptedExtensions.test(file.name));
    const rejectedCount = incomingFiles.length - supportedFiles.length;
    const additions = supportedFiles.filter((file) => !printFiles.some(
      (existing) => existing.name === file.name && existing.size === file.size,
    ));
    const nextFiles = [...printFiles, ...additions];
    setPrintFiles(nextFiles);
    if (nextFiles.length) {
      setPrintStatus(`${nextFiles.length} document${nextFiles.length === 1 ? "" : "s"} selected in this browser. They have not been uploaded yet.`);
    } else if (rejectedCount) {
      setPrintStatus("No supported documents selected. Choose PDF, JPG, PNG, DOC, or DOCX files.");
    }
    if (rejectedCount) {
      setNotice(`${rejectedCount} unsupported file${rejectedCount === 1 ? " was" : "s were"} skipped. Choose PDF, JPG, PNG, DOC, or DOCX.`);
      window.setTimeout(() => setNotice(""), 4000);
    }
  }

  function removePrintFile(fileIndex) {
    const nextFiles = printFiles.filter((_, index) => index !== fileIndex);
    setPrintFiles(nextFiles);
    setPrintStatus(nextFiles.length
      ? `${nextFiles.length} document${nextFiles.length === 1 ? "" : "s"} selected in this browser. They have not been uploaded yet.`
      : "No files selected yet.");
  }

  function formatPrintOptions(options) {
    return [options.paperSize, `Page range: ${options.pageRange.trim() || "All"}`].join(" · ");
  }

  function requestService(service) {
    if (scheduledServiceFields[service.title]) {
      setPrintServiceOpen(false);
      setScheduledService(service.title);
      setServiceSchedule("once");
      setScheduledDate("");
      setScheduleContact("");
      setScheduledDetails({});
      return;
    }
    window.open(whatsappLink(`Namaste ManaRural! I would like to enquire about ${service.title}. Please share the details.`), "_blank", "noopener,noreferrer");
  }

  function sendScheduledServiceRequest(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const details = scheduledServiceFields[scheduledService]
      .map(({ name, label }) => `${label}: ${formData.get(name)}`)
      .filter((line) => !line.endsWith(": "))
      .join("\n");
    const scheduleDetails = serviceSchedule === "once"
      ? "Schedule: One-time request (as soon as possible)"
      : serviceSchedule === "date"
        ? `Schedule: One-time request for ${scheduledDate}`
        : `Schedule: Repeat ${serviceSchedule}, starting ${scheduledDate}`;
    const estimateLines = [
      servicePriceEstimate.serviceFee === null
        ? "ManaRural service fee: To be confirmed"
        : `ManaRural service fee: ${formatPrice(servicePriceEstimate.serviceFee)}${servicePriceEstimate.serviceFeeMax !== null ? `–${formatPrice(servicePriceEstimate.serviceFeeMax)}` : ""}`,
      servicePriceEstimate.transactionAmount !== null
        ? `${servicePriceEstimate.transactionLabel}: ${formatPrice(servicePriceEstimate.transactionAmount)} (separate from the service fee)`
        : null,
      servicePriceEstimate.lowTotal !== null
        ? `Known amount${servicePriceEstimate.externalAmountToConfirm ? " (service fee only; ticket/cylinder amount is separate)" : ""}: ${formatPrice(servicePriceEstimate.lowTotal)}${servicePriceEstimate.highTotal !== servicePriceEstimate.lowTotal ? `–${formatPrice(servicePriceEstimate.highTotal)}` : ""}`
        : "Final amount: Service fee and any recharge, bill, or ticket amount will be confirmed by the team",
      "Digital service delivery charge: None",
    ].filter(Boolean);
    const message = [
      `Namaste ManaRural! I would like to request ${scheduledService}.`,
      details,
      ...estimateLines,
      scheduleContact.trim() && `Customer contact: ${scheduleContact.trim()}`,
      scheduleDetails,
      "Please confirm availability, final amount and schedule before processing. The listed service fee is separate from any recharge, bill, or ticket cost. This is a request, not an automatic payment authorization. Do not send passwords or OTPs.",
    ].filter(Boolean).join("\n");
    window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    setNotice("Your request is ready in WhatsApp. Please send it to confirm.");
    window.setTimeout(() => setNotice(""), 4000);
  }

  function selectTab(tab) {
    setActiveTab(tab);
    setSearch("");
    setActiveCategory("all");
    document.getElementById("offerings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="announcement">
        <span>Local care, right around the corner</span>
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
          <Icon name="whatsapp" size={15} /> WhatsApp us
        </a>
      </div>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="ManaRural home">
          <img src={`${import.meta.env.BASE_URL}images/manarural-logo.png`} alt="ManaRural — Everything you need, one place" />
          <span className="brand-name">Mana<span>Rural</span></span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#offerings">Our offerings</a>
          <a href="#about">About us</a>
          <a href={`${import.meta.env.BASE_URL}policies`}>Policies</a>
        </nav>
        <div className="header-actions">
          {/* <a className="header-contact" href={`tel:+${whatsappNumber}`}>+91 89343 57875</a> */}
          <nav className="header-account-links" aria-label="Account navigation">
            {demoSession ? (
              <>
                {demoSession.role === "admin" && <a href={`${import.meta.env.BASE_URL}admin`}>Admin panel</a>}
                <button onClick={() => { endDemoSession(); window.location.assign(import.meta.env.BASE_URL); }}>Sign out</button>
              </>
            ) : (
              <>
                <a href={`${import.meta.env.BASE_URL}signin`}>Sign in</a>
                <a className="header-signup" href={`${import.meta.env.BASE_URL}signup`}>Create account</a>
              </>
            )}
          </nav>
          <button className="icon-button cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Open basket, ${cartCount} items`}>
            <Icon name="bag" />
            <span>Basket</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="live-dot" /> YOUR VILLAGE. YOUR EVERYDAY.</div>
            <h1>Good things,<br />closer to <em>home.</em></h1>
            <p className="telugu-line">మన ఊరు • మన అవసరాలు • మీకు కావాల్సినవి… ఒకే చోట</p>
            <p className="hero-description">Your daily groceries and the digital services you need, from people who know your neighbourhood.</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => selectTab("groceries")}>Explore groceries <Icon name="arrow" size={17} /></button>
              <button className="button button-quiet" onClick={() => selectTab("digital")}>Browse digital services</button>
            </div>
            <div className="hero-promise"><span>✳</span> A little shop with a lot of heart <i /> Made for our community</div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo" role="img" aria-label="Shelves stocked with everyday groceries in a local store" />
            <div className="hero-sticker"><span>మీ ఊరు</span><strong>Our village,<br />our basket.</strong><i>✳</i></div>
            <div className="hero-caption"><span className="caption-mark">M</span><span><b>ManaRural</b><small>Everything you need, one place.</small></span><span className="caption-leaf">✳</span></div>
          </div>
          <div className="hero-sprig sprig-one">✳</div>
          <div className="hero-sprig sprig-two">✳</div>
        </section>

        <section className="trust-strip" aria-label="Our promises">
          <div><span>✳</span><b>Local & friendly</b><small>Here when you need us</small></div>
          <i />
          <div><span>♡</span><b>Thoughtfully picked</b><small>Everyday things made easy</small></div>
          <i />
          <div><span>⌁</span><b>One easy place</b><small>Products & helpful services</small></div>
        </section>
        <aside className="cash-delivery-notice" aria-label="Grocery payment and delivery information">
          <span aria-hidden="true">🚚</span>
          <p><strong>Grocery orders: cash on delivery only.</strong> Our team will call you to confirm, then bring your order to your door. Please do not pay through this app or send advance payment.</p>
        </aside>

        <section className="offerings section-wrap" id="offerings">
          <div className="section-heading">
            <div><p className="eyebrow">A LITTLE BIT OF EVERYTHING</p><h2>What can we help you find?</h2></div>
            <p>From pantry top-ups to paperwork, we’re right here.</p>
          </div>
          <div className="offer-tabs" role="tablist" aria-label="Choose an offering">
            <button role="tab" aria-selected={activeTab === "groceries"} className={activeTab === "groceries" ? "selected" : ""} onClick={() => selectTab("groceries")}><span>🧺</span><b>Groceries</b><small>Everyday essentials</small></button>
            <button role="tab" aria-selected={activeTab === "digital"} className={activeTab === "digital" ? "selected" : ""} onClick={() => selectTab("digital")}><span>✳</span><b>Digital services</b><small>Useful things, made simple</small></button>
          </div>

          {activeTab === "groceries" ? (
            <div className="catalog-panel" role="tabpanel">
              <div className="catalog-intro">
                <div><p className="eyebrow">THE LOCAL FAVOURITES</p><h3>Your basket starts here.</h3><p>Everyday kirana picks from ₹10, plus larger packs for the family. Ask us for today’s availability and prices.</p></div>
                <label className="search-box"><Icon name="search" size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find rice, shampoo, spices…" aria-label="Search groceries" />{search && <button onClick={() => setSearch("")} aria-label="Clear search"><Icon name="close" size={16} /></button>}</label>
              </div>
              <div className="category-scroller" aria-label="Filter grocery categories">
                <button className={activeCategory === "all" ? "category-chip active" : "category-chip"} onClick={() => setActiveCategory("all")}>Everything</button>
                {categories.map((category) => <button key={category.id} className={activeCategory === category.id ? "category-chip active" : "category-chip"} onClick={() => setActiveCategory(category.id)}><span>{category.icon}</span>{category.name}</button>)}
              </div>
              {search ? (
                matchingItems.length ? <div className="item-results" aria-live="polite">{matchingItems.map((item) => <button className="inventory-item" key={item.id} onClick={() => addToCart(item)}><span className="inventory-item-copy"><span>{getProductDisplayName(item)}</span><small className="inventory-category">{item.detail}</small></span><span className="inventory-price">{Number.isFinite(item.price) ? formatPrice(item.price) : "Price not set"}{item.label && <small> / {item.label}</small>}</span><span className="inventory-add"><Icon name="plus" size={15} /> Add</span></button>)}</div>
                  : <div className="empty-search"><span>🔎</span><h3>No exact match just yet</h3><p>Try another search or ask us on WhatsApp—we may still have it in store.</p><button className="text-link" onClick={() => window.open(whatsappLink(`Namaste ManaRural! Do you have ${search}?`), "_blank", "noopener,noreferrer")}>Ask us about “{search}” <Icon name="arrow" size={16} /></button></div>
              ) : (
                <div className="product-grid">
                {filteredProducts.map((product, index) => (
                  (() => {
                    const selectedVariant = product.variants.find((variant) => variant.id === selectedVariants[product.id]) || product.variants[0];
                    const productBrands = getProductBrands(product);
                    const selectedBrandId = selectedBrands[product.id] || "";
                    const cartKey = `${product.id}::${selectedBrandId || "any"}::${selectedVariant.id}`;
                    const quantity = cart[cartKey] || 0;
                    return (
                      <article className={`product-card ${product.color}`} key={product.id}>
                        <div className="product-image-wrap"><img src={getProductImageSrc(product.image, 720)} alt={getProductDisplayName(product)} loading={index > 3 ? "lazy" : "eager"} /><span className="local-pick">LOCAL PICK</span></div>
                        <div className="product-info">
                          <p>{product.detail}</p>
                          <h4>{getProductDisplayName(product)}</h4>
                          <div className="product-rating" aria-label={`${product.rating} out of 5, ${product.ratingCount} sample customer ratings`}><span aria-hidden="true">★★★★★</span><b>{product.rating}</b><small>{product.ratingCount} ratings</small></div>
                          <label className="variant-picker"><span>Brand</span><select value={selectedBrandId} onChange={(event) => setSelectedBrands((current) => ({ ...current, [product.id]: event.target.value }))} aria-label={`Choose brand for ${product.name}`}><option value="">Any available brand</option>{productBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
                          <label className="variant-picker"><span>Pack</span><select value={selectedVariant.id} onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: event.target.value }))} aria-label={`Choose pack size for ${product.name}`}>{product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.label}</option>)}</select></label>
                          <div className="product-purchase"><strong>{formatPrice(selectedVariant.price)}</strong><div className="product-quantity" aria-label={`${product.name} quantity`}>
                            <button onClick={() => changeQuantity(cartKey, -1)} aria-label={`Remove one ${product.name}, ${selectedVariant.label}`} disabled={!quantity}><Icon name="minus" size={14} /></button>
                            <span aria-live="polite">{quantity}</span>
                            <button onClick={() => addToCart(product, selectedVariant, selectedBrandId)} aria-label={`Add one ${product.name}${selectedBrandId ? `, ${productBrands.find((brand) => brand.id === selectedBrandId)?.name}` : ""}, ${selectedVariant.label}`}><Icon name="plus" size={14} /></button>
                          </div></div>
                        </div>
                      </article>
                    );
                  })()
                ))}
                </div>
              )}
              {!search && <p className="sample-disclaimer">Shelf prices, pack sizes and customer ratings are sample estimates. Confirm current prices and stock with our local team.</p>}
              <div className="catalog-cart-summary" aria-live="polite">
                <div><span className="eyebrow">YOUR BASKET</span><strong>{cartCount} {cartCount === 1 ? "item" : "items"}</strong><small>Estimated total: {formatPrice(orderTotal)}{hasUnpricedItems ? " + items to confirm" : ""}</small></div>
                <button className="button button-primary" onClick={() => setCartOpen(true)}>View basket <Icon name="bag" size={17} /></button>
              </div>
              {!search && <div className="aisle-list"><div className="aisle-heading"><div><p className="eyebrow">MORE FROM OUR SHELVES</p><h3>Find your everyday essentials.</h3></div><span>Ask us for today’s availability</span></div>{visibleCategories.map((category) => {
                const categoryBrands = brands.filter((brand) => brand.category === category.id && brand.status?.toLowerCase() !== "inactive");
                return <section className="aisle" key={category.id}><div className="aisle-title"><span>{category.icon}</span><div><h4>{category.name}</h4><small>{category.description}</small></div><b>{category.items.length} items</b></div><div className="aisle-brands"><b>Brands</b>{categoryBrands.length ? categoryBrands.map((brand) => <span className="aisle-brand" key={brand.id}>{brand.name}</span>) : <small>Ask us for available brands</small>}<small className="aisle-brand-note">Check local availability.</small></div><div className="inventory-grid">{inventoryItems.filter((item) => item.category === category.id).map((item) => <button className="inventory-item" key={item.id} onClick={() => addToCart(item)}><span>{getProductDisplayName(item)}</span><span className="inventory-price">{Number.isFinite(item.price) ? formatPrice(item.price) : "Price not set"}{item.label && <small> / {item.label}</small>}</span><span className="inventory-add"><Icon name="plus" size={14} /> Add</span></button>)}</div></section>;
              })}</div>}
              <div className="category-note"><span>✳</span><p><b>Looking for something else?</b> We have staples, spices, snacks, drinks, dairy, personal care and home essentials in store.</p><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">Ask our team <Icon name="arrow" size={15} /></a></div>
            </div>
          ) : (
            <div className="services-panel" role="tabpanel">
              <div className="services-intro"><div><p className="eyebrow">A HELPING HAND, CLOSE BY</p><h3>Your everyday digital desk.</h3><p>Tell us what you need. We’ll help you figure out the next step.</p></div><div className="service-art" aria-hidden="true"><span className="service-art-spark">✳</span><span className="service-art-phone">▯</span><span className="service-art-print">Aa</span><span className="service-art-label">SERVICES, MADE SIMPLE</span></div></div>
              {printServiceOpen ? (
                <section className="print-order">
                  <button className="print-back" onClick={() => setPrintServiceOpen(false)}>← All digital services</button>
                  <div className="print-order-heading"><p className="eyebrow">XEROX & PRINTING</p><h3>Upload your files and request printing on WhatsApp.</h3><p>Share your documents with your print settings. We’ll confirm pricing and availability before processing.</p></div>
                  <div className="print-quantity"><span>Copies</span><div className="print-quantity-control"><button onClick={() => setPrintQuantity((count) => Math.max(1, count - 1))} aria-label="Reduce number of copies" disabled={printQuantity <= 1}>−</button><strong aria-live="polite">{printQuantity}</strong><button onClick={() => setPrintQuantity((count) => count + 1)} aria-label="Increase number of copies">+</button></div></div>
                  <fieldset className="print-options">
                    <legend>Print options</legend>
                    <label><span>Service</span><select value={printServiceType} onChange={(event) => {
                      const serviceType = event.target.value;
                      setPrintServiceType(serviceType);
                      if (serviceType === "color-print-a4" || serviceType === "lamination-a4") {
                        setPrintOptions((current) => ({ ...current, paperSize: "A4" }));
                      }
                    }}>{printServiceOptions.map((service) => <option key={service.id} value={service.id}>{service.label} — {formatPrice(service.rate)} / {service.unit}</option>)}</select></label>
                    <label><span>Paper size</span><select value={printOptions.paperSize} disabled={printServiceType === "color-print-a4" || printServiceType === "lamination-a4"} onChange={(event) => setPrintOptions((current) => ({ ...current, paperSize: event.target.value }))}><option>A4</option><option>A3</option><option>Letter</option></select></label>
                    <label><span>Page range <small>(optional)</small></span><input value={printOptions.pageRange} onChange={(event) => setPrintOptions((current) => ({ ...current, pageRange: event.target.value }))} placeholder="e.g. 1-3, 5" pattern="[0-9,\\-\\s]*" title="Enter page numbers and ranges, such as 1-3, 5" /></label>
                  </fieldset>
                  <label className="print-page-count"><span>{printServiceOptions.find((service) => service.id === printServiceType)?.unit === "card" ? "Cards per copy" : "Pages per copy"}</span><input type="number" min="1" step="1" value={printPages} onChange={(event) => setPrintPages(Math.max(1, Number(event.target.value) || 1))} /></label>
                  <p className="print-options-note">Enter the total pages or cards for one copy. Leave page range blank to print all pages.</p>
                  {(() => {
                    const selectedService = printServiceOptions.find((service) => service.id === printServiceType);
                    const serviceSubtotal = selectedService.rate * printPages * printQuantity;
                    const deliveryFee = serviceSubtotal <= 300 ? 30 : 0;
                    return <section className="service-checkout-summary" aria-label="Xerox and printing price estimate">
                      <h4>Request estimate / అభ్యర్థన అంచనా</h4>
                      <div><span>{selectedService.label} · {printPages * printQuantity} {selectedService.unit}{printPages * printQuantity === 1 ? "" : "s"} × {formatPrice(selectedService.rate)}</span><strong>{formatPrice(serviceSubtotal)}</strong></div>
                      <div><span>Print delivery charge / డెలివరీ ఛార్జీ</span><strong>{deliveryFee ? formatPrice(deliveryFee) : "Free"}</strong></div>
                      <div className="service-checkout-total"><span>Estimated total / అంచనా మొత్తం</span><strong>{formatPrice(serviceSubtotal + deliveryFee)}</strong></div>
                      <small>Delivery charge: ₹30 when printing subtotal is ₹300 or less; free above ₹300. Final page count and amount will be confirmed by our team.</small>
                    </section>;
                  })()}
                  <aside className="print-customer-note" role="note">
                    <b>Customer note / వినియోగదారులకు గమనిక</b>
                    <span>Your files are selected only in this browser; they are not uploaded or sent yet. After choosing “Request printing on WhatsApp”, select WhatsApp in the share sheet if available. Otherwise, attach the files manually in the WhatsApp chat.</span>
                    <span lang="te">మీ ఫైళ్లు ఈ బ్రౌజర్‌లో మాత్రమే ఎంపిక చేయబడతాయి; ఇంకా అప్‌లోడ్ లేదా పంపబడలేదు. “వాట్సాప్‌లో ప్రింటింగ్ అభ్యర్థించండి” నొక్కిన తర్వాత షేర్ మెనూలో వాట్సాప్‌ను ఎంచుకోండి. ఆ ఎంపిక లేకపోతే, వాట్సాప్ చాట్‌లో ఫైళ్లను మీరే జత చేయండి.</span>
                  </aside>
                  <label className="print-upload" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addPrintFiles(event.dataTransfer.files); }}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple onChange={(event) => { addPrintFiles(event.target.files); event.target.value = ""; }} />
                    <span>Drag &amp; drop your files or <b>Browse files</b></span>
                    <small>PDF, JPG, PNG, DOC or DOCX</small>
                  </label>
                  {printFiles.length > 0 && <ul className="print-file-list">{printFiles.map((file, index) => <li key={`${file.name}-${file.size}-${index}`}><span>{file.name}</span><button onClick={() => removePrintFile(index)} aria-label={`Remove ${file.name}`}>×</button></li>)}</ul>}
                  <p className="print-upload-status" role="status" aria-live="polite">{printStatus}</p>
                  <div className="print-order-actions"><button className="print-add-button" onClick={addPrintJobToCart}>Add to basket</button><button className="print-whatsapp-button" onClick={buyPrintJobNow}><Icon name="whatsapp" size={18} /> Request printing on WhatsApp</button></div>
                  <section className="print-how"><h4>HOW IT WORKS</h4><div className="print-steps">
                    <article><span>⇧</span><h5>Upload &amp; Place Your Order</h5><p>Upload your favorite pictures or documents and place your order.</p></article>
                    <article><span>🛒</span><h5>Fast Production &amp; Dispatch</h5><p>We carefully prepare your prints and confirm timing with you.</p></article>
                    <article><span>●</span><h5>Track Your Order</h5><p>Receive updates until your order reaches your doorstep.</p></article>
                  </div></section>
                  <a className="print-help-button" href={whatsappLink("Namaste ManaRural! I need help with a Xerox or printing order.")} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> NEED HELP? ORDER ON WHATSAPP</a>
                </section>
              ) : scheduledService ? (
                <section className="scheduled-service-form">
                  <button className="print-back" onClick={() => setScheduledService("")}>← All digital services</button>
                  <div className="print-order-heading"><p className="eyebrow">SERVICE REQUEST</p><h3>{scheduledService}</h3><p>Enter your account details and preferred schedule. Our team will confirm the request with you on WhatsApp.</p></div>
                  <form onSubmit={sendScheduledServiceRequest}>
                    <div className="scheduled-fields">
                      {scheduledServiceFields[scheduledService].map(({ name, label, options, ...inputProps }) => {
                        if (name === "travelClass" && scheduledDetails.travelMode !== "Train") return null;
                        return <label className="scheduled-field" key={name}><span>{label}</span>{inputProps.type === "select" ? <select {...inputProps} value={scheduledDetails[name] || ""} onChange={(event) => setScheduledDetails((current) => ({ ...current, [name]: event.target.value }))}><option value="">Select an option</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input {...inputProps} value={scheduledDetails[name] || ""} onChange={(event) => setScheduledDetails((current) => ({ ...current, [name]: event.target.value }))} />}</label>;
                      })}
                      <label className="scheduled-field"><span>Your contact number (optional)</span><input type="tel" autoComplete="tel" value={scheduleContact} onChange={(event) => setScheduleContact(event.target.value)} placeholder="Number we can reach you on" /></label>
                    </div>
                    <fieldset className="schedule-options"><legend>{recurringServiceTitles.has(scheduledService) ? "When should we arrange this?" : "When do you need this?"}</legend>
                      {getServiceScheduleOptions(scheduledService).map(([value, label]) => <label key={value}><input type="radio" name="service-schedule" checked={serviceSchedule === value} onChange={() => setServiceSchedule(value)} /> {label}</label>)}
                    </fieldset>
                    {serviceSchedule !== "once" && <label className="scheduled-field scheduled-date-field"><span>{serviceSchedule === "date" ? "Requested date" : "Start date"}</span><input type="date" value={scheduledDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setScheduledDate(event.target.value)} required /></label>}
                    <section className="service-checkout-summary" aria-label="Digital service price estimate">
                      <h4>Request estimate / అభ్యర్థన అంచనా</h4>
                      <div><span>ManaRural service fee / సేవా రుసుము</span><strong>{servicePriceEstimate.serviceFee === null ? "To be confirmed" : `${formatPrice(servicePriceEstimate.serviceFee)}${servicePriceEstimate.serviceFeeMax !== null ? `–${formatPrice(servicePriceEstimate.serviceFeeMax)}` : ""}`}</strong></div>
                      {servicePriceEstimate.transactionAmount !== null && <div><span>{servicePriceEstimate.transactionLabel} / అసలు చెల్లింపు మొత్తం</span><strong>{formatPrice(servicePriceEstimate.transactionAmount)}</strong></div>}
                      {servicePriceEstimate.lowTotal !== null && <div className="service-checkout-total"><span>{servicePriceEstimate.externalAmountToConfirm ? "Service fee only / సేవా రుసుము మాత్రమే" : "Estimated amount / అంచనా మొత్తం"}</span><strong>{formatPrice(servicePriceEstimate.lowTotal)}{servicePriceEstimate.highTotal !== servicePriceEstimate.lowTotal ? `–${formatPrice(servicePriceEstimate.highTotal)}` : ""}</strong></div>}
                      <div><span>Digital service delivery charge / డెలివరీ ఛార్జీ</span><strong>None</strong></div>
                      <small>The listed fee is ManaRural’s service fee. Recharge and bill amounts, ticket fares, and the gas cylinder amount are separate. Our team will confirm the final amount before processing. / చూపినది సేవా రుసుము మాత్రమే; రీఛార్జ్, బిల్లు, టికెట్ లేదా గ్యాస్ సిలిండర్ మొత్తం వేరు.</small>
                    </section>
                    <p className="schedule-disclaimer">{recurringServiceTitles.has(scheduledService) ? "Scheduling is a request only. No recharge or bill payment will happen automatically; the team must confirm every request." : "This is a request only. Our team will confirm availability and next steps on WhatsApp. Never share account passwords or one-time passcodes."}</p>
                    <button className="scheduled-submit" type="submit"><Icon name="whatsapp" size={18} /> Send details on WhatsApp</button>
                  </form>
                </section>
              ) : (
                <>
                  <div className="service-grid">{digitalServices.map((service) => <article className="service-card" key={service.title}><span className="service-icon">{service.icon}</span><div><h4>{service.title}</h4><p>{service.detail}</p></div><button onClick={() => service.title === "Xerox & printing" ? setPrintServiceOpen(true) : requestService(service)} aria-label={service.title === "Xerox & printing" ? "Open Xerox and printing order" : `Enquire about ${service.title}`}><Icon name="arrow" size={17} /></button></article>)}</div>
                  <section className="service-price-list" aria-labelledby="service-price-list-title">
                    <div className="service-price-heading">
                      <div><p className="eyebrow">CLEAR, UPFRONT PRICING</p><h3 id="service-price-list-title">Service price list <span>సేవల ధరల వివరాలు</span></h3></div>
                      <b>All prices in ₹ / అన్ని ధరలు రూపాయల్లో</b>
                    </div>
                    <div className="service-price-table-wrap">
                      <table className="service-price-table">
                        <thead><tr><th scope="col">Service / సేవ</th><th scope="col">Unit / వివరాలు</th><th scope="col">Price / ధర</th></tr></thead>
                        <tbody>{digitalServicePrices.map((item) => <tr key={item.service}>
                          <td><span>{item.service}</span><small lang="te">{item.telugu}</small></td>
                          <td>{item.detail}</td>
                          <td>{item.price}</td>
                        </tr>)}</tbody>
                      </table>
                    </div>
                    <p className="service-price-note">Mobile &amp; DTH recharge charges for ₹199–₹200 are not specified in the supplied price list; please confirm with our team. / ₹199–₹200 రీఛార్జ్ ఛార్జీలు ధరల పట్టికలో ఇవ్వలేదు; మా బృందంతో నిర్ధారించండి.</p>
                  </section>
                  <div className="service-help"><span>Not sure what to ask for?</span><a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Namaste ManaRural! I need help with a digital service.")}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> Chat with our team</a></div>
                </>
              )}
            </div>
          )}
        </section>

        <section className="community" id="about">
          <div className="community-image" role="img" aria-label="Everyday grocery shelves in a local store" />
          <div className="community-copy"><p className="eyebrow">SMALL SHOP. BIG SUPPORT.</p><h2>Close to home<br />is a lovely place to be.</h2><p>ManaRural brings daily essentials and helpful digital services a little closer to the people and places we call home.</p><a className="button button-light" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> Say hello on WhatsApp</a><span className="community-telugu">మన ఊరు • మన అవసరాలు • మీకు కావాల్సినవి… ఒకే చోట</span></div>
          <span className="community-flower">✳</span>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main"><div className="footer-brand"><span className="brand-name">Mana<span>Rural</span></span><p>Everything you need, one place.<br />Your local basket of products.</p></div><div className="footer-contact"><span className="eyebrow">HERE FOR OUR COMMUNITY</span><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> +91 89343 57875</a><a href="mailto:manaruralservices@gmail.com">✉ &nbsp;manaruralservices@gmail.com</a></div><div className="footer-account-links"><a href={`${import.meta.env.BASE_URL}policies`}>Policies</a></div><a className="back-top" href="#home">Back to top ↑</a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} ManaRural · RuralReachServices</span><span>మన ఊరు • మన అవసరాలు • ఒకే చోట</span></div>
      </footer>

      {notice && <div className="toast" role="status">{notice}</div>}
      {cartOpen && (
        <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setCartOpen(false); setCheckoutOpen(false); } }}>
          <aside className={`cart-drawer ${checkoutOpen ? "checkout-drawer" : ""}`} aria-label={checkoutOpen ? "Checkout" : "Your basket"}>
            {checkoutOpen ? (
              <>
                <div className="drawer-header">
                  <div><button className="print-back" onClick={() => setCheckoutOpen(false)}>← Back to basket</button><span className="eyebrow">LOCAL DELIVERY CHECKOUT</span><h2>Delivery details</h2></div>
                  <button className="icon-button" onClick={() => { setCartOpen(false); setCheckoutOpen(false); }} aria-label="Close checkout"><Icon name="close" /></button>
                </div>
                <div className="checkout-content">
                  <form id="checkout-customer-form" className="checkout-customer-fields" onSubmit={sendWhatsAppOrder}>
                    <label>Full name<input required autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
                    <label>Mobile number<input required type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" autoComplete="tel" placeholder="10-digit mobile number" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></label>
                    <label>Delivery address<textarea required rows="3" autoComplete="street-address" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} /></label>
                    <label>PIN code<input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={deliveryPincode} onChange={(event) => setDeliveryPincode(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
                  </form>
                  <section className="checkout-order-summary" aria-label="Order summary">
                    <h3>Order summary</h3>
                    <ul>{checkoutOrderLines.map((line, index) => <li key={`${basketItems[index].cartKey}-summary`}>{line}</li>)}</ul>
                    {cartItems.length > 0 && <div className="checkout-total"><span>Grocery subtotal</span><strong>{formatPrice(cartTotal)}</strong></div>}
                    {printCart.length > 0 && <div className="checkout-total"><span>Xerox &amp; printing subtotal</span><strong>{formatPrice(printSubtotal)}</strong></div>}
                    {groceryDeliveryCharge > 0 && <div className="checkout-total"><span>Grocery delivery charge</span><strong>{formatPrice(groceryDeliveryCharge)}</strong></div>}
                    {printDeliveryCharge > 0 && <div className="checkout-total"><span>Xerox &amp; printing delivery charge</span><strong>{formatPrice(printDeliveryCharge)}</strong></div>}
                    {deliveryCharge === 0 && <div className="checkout-total"><span>Delivery charges</span><strong>Free</strong></div>}
                    <div className="checkout-total checkout-grand-total"><span>Order total</span><strong>{formatPrice(orderTotal)}</strong></div>
                    <p>Grocery delivery: ₹30 for grocery subtotals of ₹300 or less; free above ₹300. Xerox/printing delivery: ₹30 for print-service subtotals of ₹300 or less; free above ₹300. Other digital services have no delivery charge.</p>
                  </section>
                  <section className="checkout-payment-notice">
                    <h3>Send your order on WhatsApp</h3>
                    <p>We’ll send your delivery details, selected items, and price breakdown to our team. They’ll confirm your order with you.</p>
                    <div className="checkout-whatsapp-preview">
                      <b>WhatsApp order preview</b>
                      <span>{customerName.trim() || "Customer"} · +91 {customerPhone || "mobile"} · PIN {deliveryPincode || "—"}</span>
                      {deliveryAddress.trim() && <span>Deliver to: {deliveryAddress.trim()}</span>}
                      {checkoutOrderLines.map((line, index) => <span key={`whatsapp-${basketItems[index].cartKey}`}>{line}</span>)}
                      {cartItems.length > 0 && <span>Grocery subtotal: {formatPrice(cartTotal)}</span>}
                      {printCart.length > 0 && <span>Xerox &amp; printing subtotal: {formatPrice(printSubtotal)}</span>}
                      <span>Grocery delivery charge: {groceryDeliveryCharge ? formatPrice(groceryDeliveryCharge) : "None"}</span>
                      <span>Xerox &amp; printing delivery charge: {printDeliveryCharge ? formatPrice(printDeliveryCharge) : "None"}</span>
                      <strong>Order total: {formatPrice(orderTotal)}</strong>
                    </div>
                    <button className="button button-primary checkout-whatsapp-button" type="submit" form="checkout-customer-form">
                      <Icon name="whatsapp" size={18} /> Send order on WhatsApp
                    </button>
                    {cartItems.length > 0 && <small>Our team will call to confirm grocery orders and deliver to your door. Pay cash on delivery only—do not pay through this app.</small>}
                    {printCart.length > 0 && <small>Print delivery is charged only for Xerox/printing as shown above. Our team will confirm the final print amount and delivery details.</small>}
                  </section>
                </div>
              </>
            ) : (
              <>
                <div className="drawer-header">
                  <div><span className="eyebrow">YOUR LOCAL LIST</span><h2>Your basket <span>({cartCount})</span></h2></div>
                  <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close basket"><Icon name="close" /></button>
                </div>
                {basketItems.length ? (
                  <>
                    <div className="cart-items">
                      {basketItems.map((item) => (
                        <div className="cart-item" key={item.cartKey}>
                          {item.image ? <img src={getProductImageSrc(item.image, 160, 160)} alt="" /> : <span className="cart-service-icon">🖨️</span>}
                          <div className="cart-item-copy">
                            <b>{getProductDisplayName(item)}</b>
                            <small>{item.printOptions ? `${item.serviceName} · ${item.unitLabel} per copy · ${formatPrintOptions(item.printOptions)} · ${item.files.join(", ")}` : item.variant ? `${item.brand ? `${item.brand.name} · ` : ""}${item.variant.label} · ${formatPrice(item.variant.price)} each` : Number.isFinite(item.unitPrice) ? `${item.unitLabel} · ${formatPrice(item.unitPrice)} each` : item.files?.length ? `Files: ${item.files.join(", ")}` : "Price not set"}</small>
                            <div className="quantity-control"><button onClick={() => changeQuantity(item.cartKey, -1)} aria-label={`Remove one ${item.name}`}><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.cartKey, 1)} aria-label={`Add one ${item.name}`}><Icon name="plus" size={14} /></button></div>
                          </div>
                          <strong className="cart-line-total">{item.variant ? formatPrice(item.variant.price * item.quantity) : Number.isFinite(item.unitPrice) ? formatPrice(item.unitPrice * item.quantity) : "On request"}</strong>
                          <button className="remove-item" onClick={() => changeQuantity(item.cartKey, -item.quantity)} aria-label={`Remove ${item.name}`}><Icon name="trash" size={17} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="drawer-footer">
                      {cartItems.length > 0 && <div className="cart-estimate"><span>Grocery subtotal</span><strong>{formatPrice(cartTotal)}</strong></div>}
                      {printCart.length > 0 && <div className="cart-estimate"><span>Xerox &amp; printing subtotal</span><strong>{formatPrice(printSubtotal)}</strong></div>}
                      <div className="cart-estimate"><span>Delivery charges</span><strong>{deliveryCharge ? formatPrice(deliveryCharge) : "None"}</strong></div>
                      <div className="cart-estimate"><span>Estimated total</span><strong>{formatPrice(orderTotal)}</strong></div>
                      <p>Local delivery is available only for PIN code 531036. Grocery and Xerox/printing delivery fees are calculated separately; other digital-service requests have no delivery fee.</p>
                      <label className="delivery-pincode-field">Delivery PIN code
                        <input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" placeholder="Enter 531036" value={deliveryPincode} onChange={(event) => setDeliveryPincode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
                      </label>
                      {!hasUnpricedItems && deliveryPincode.length === 6 && !isLocalDelivery && <p className="checkout-eligibility-message">Sorry, delivery is currently limited to PIN code 531036.</p>}
                      {hasUnpricedItems && <p className="checkout-eligibility-message">Some items need a confirmed price before checkout can continue.</p>}
                      <button className="button button-primary whatsapp-order" onClick={() => setCheckoutOpen(true)} disabled={!canProceedToCheckout}>Proceed to checkout</button>
                      <p className="checkout-payment-disclaimer">Send your order details directly to our team on WhatsApp.</p>
                    </div>
                  </>
                ) : (
                  <div className="empty-cart"><span>🧺</span><h3>Your basket is ready.</h3><p>Add a few local favourites and send us your list. We’ll help with prices and availability.</p><button className="button button-primary" onClick={() => { setCartOpen(false); selectTab("groceries"); }}>Explore groceries <Icon name="arrow" size={16} /></button></div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

export default App;
