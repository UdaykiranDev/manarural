export const ADMIN_PHONE = "8500274274";
export const ADMIN_DEMO_PIN = "949290";
export const SAMPLE_CUSTOMER_PHONE = "9177367579";
const demoSessionKey = "manarural:demo-session";

export function isValidAdminDemoPin(pin) {
  return pin === ADMIN_DEMO_PIN;
}

export function getDemoSession() {
  const saved = window.sessionStorage.getItem(demoSessionKey);
  if (!saved) return null;
  const session = JSON.parse(saved);
  return session && (session.role === "admin" || session.role === "customer")
    ? session
    : null;
}

export function startDemoSession(name, phone) {
  const normalizedPhone = phone.replace(/\D/g, "");
  const role = normalizedPhone === ADMIN_PHONE ? "admin" : "customer";
  const session = { name: name.trim(), phone: normalizedPhone, role };
  window.sessionStorage.setItem(demoSessionKey, JSON.stringify(session));
  return session;
}

export function endDemoSession() {
  window.sessionStorage.removeItem(demoSessionKey);
}
