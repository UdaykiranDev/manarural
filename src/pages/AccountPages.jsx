import React, { useState } from "react";
import { ADMIN_PHONE, SAMPLE_CUSTOMER_PHONE, isValidAdminDemoPin, startDemoSession } from "../shared/demoAuth.js";
import "../landing/styles.css";

const getBasePath = () => import.meta.env.BASE_URL.replace(/\/$/, "");
const getPath = (route) => `${getBasePath()}/${route}`.replace(/\/+/g, "/");

function PageLayout({ eyebrow, title, children }) {
  return (
    <main className="account-page">
      <a className="brand account-brand" href={getBasePath() || "/"}>Mana<span>Rural</span></a>
      <section className="account-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </section>
      <nav className="account-links" aria-label="Account and policy pages">
        <a href={getPath("signin")}>Sign in</a>
        <a href={getPath("signup")}>Sign up</a>
        <a href={getPath("policies")}>Policies</a>
        <a href={getBasePath() || "/"}>Storefront</a>
      </nav>
    </main>
  );
}

export function SignInPage() {
  const [phone, setPhone] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [error, setError] = useState("");
  const isAdminPhone = phone === ADMIN_PHONE;

  function signIn(event) {
    event.preventDefault();
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (normalizedPhone === ADMIN_PHONE && !isValidAdminDemoPin(adminPin)) {
      setError("Enter the valid 6-digit admin demo PIN.");
      return;
    }
    const session = startDemoSession("", normalizedPhone);
    window.location.assign(getPath(session.role === "admin" ? "admin" : ""));
  }

  return (
    <PageLayout eyebrow="WELCOME BACK" title="Sign in">
      <p className="account-intro">Enter your mobile number to continue to ManaRural. Admin demo sign-in also requires a PIN.</p>
      <div className="demo-auth-warning"><b>Demo only:</b> this form does not verify phone ownership. The PIN is included in frontend code and does not securely protect admin access. Use .NET API authentication before launch.</div>
      <form className="account-form" onSubmit={signIn}>
        <label>Mobile number
          <input type="tel" inputMode="numeric" autoComplete="tel" maxLength="10" placeholder="10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} required />
        </label>
        {isAdminPhone && <label>Admin demo PIN
          <input type="password" inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" placeholder="6-digit PIN" value={adminPin} onChange={(event) => setAdminPin(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
        </label>}
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit">{isAdminPhone ? "Continue to admin demo" : "Continue"}</button>
      </form>
      <p className="account-switch">New to ManaRural? <a href={getPath("signup")}>Create an account</a></p>
      <div className="demo-accounts">
        <b>Demo numbers</b>
        <span>Admin preview: +91 {ADMIN_PHONE}</span>
        <span>Customer preview: +91 {SAMPLE_CUSTOMER_PHONE}</span>
      </div>
    </PageLayout>
  );
}

export function SignUpPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function signUp(event) {
    event.preventDefault();
    const normalizedPhone = phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(normalizedPhone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (normalizedPhone === ADMIN_PHONE) {
      setError("This number is reserved for the admin demo. Sign in to preview the admin page.");
      return;
    }
    startDemoSession(name, normalizedPhone);
    window.location.assign(getBasePath() || "/");
  }

  return (
    <PageLayout eyebrow="JOIN OUR COMMUNITY" title="Create your account">
      <p className="account-intro">Add your name and mobile number to start browsing.</p>
      <div className="demo-auth-warning"><b>Demo only:</b> your details stay in this browser session. This form does not create a verified account or send an OTP.</div>
      <form className="account-form" onSubmit={signUp}>
        <label>Full name
          <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>Mobile number
          <input type="tel" inputMode="numeric" autoComplete="tel" maxLength="10" placeholder="10-digit mobile number" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} required />
        </label>
        {error && <p className="account-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit">Create account</button>
      </form>
      <p className="account-switch">Already have an account? <a href={getPath("signin")}>Sign in</a></p>
    </PageLayout>
  );
}

export function PoliciesPage() {
  return (
    <PageLayout eyebrow="MANA RURAL" title="Policies">
      <p className="account-intro">Please review these straightforward service policies. This is draft information for the current demo storefront.</p>
      <div className="policy-content">
        <section id="privacy">
          <h2>Privacy policy</h2>
          <p>When you submit an order request, the name, mobile number, delivery address, PIN code, and selected items you enter are included in a WhatsApp message addressed to ManaRural at +91 85002 74274. Review the message before choosing to send it.</p>
          <p>This demo does not have a server account system. Sign-in and sign-up details are not verified, and a demo session is held in this browser only. Do not enter sensitive information. When the .NET API is introduced, this policy should be updated to explain its data storage, access, retention, and deletion practices.</p>
        </section>
        <section id="terms">
          <h2>Terms of use</h2>
          <p>Product listings, pack sizes, availability, prices, and ratings may be examples and can change. An order message is a request, not a confirmed order. ManaRural will confirm availability, final price, and delivery details with you before fulfilment.</p>
          <p>Use the storefront lawfully and provide accurate contact and delivery information. Do not submit information that you are not authorized to share.</p>
        </section>
        <section id="delivery">
          <h2>Delivery and cancellation</h2>
          <p>Local delivery is currently limited to PIN code 531036. A ₹30 delivery charge applies when the grocery subtotal is ₹300 or less. Delivery is free when the grocery subtotal is above ₹300.</p>
          <p>For grocery orders, our team will call you to confirm the order and arrange delivery to your door. Payment is cash on delivery only. Do not pay through this app or send advance payment.</p>
          <p>Orders are not confirmed until the ManaRural team responds. To change or cancel a request, contact the team promptly on WhatsApp at +91 85002 74274. The team will confirm whether a change or cancellation is possible.</p>
        </section>
      </div>
      <p className="policy-draft-note">Draft policy text for the demo. Review and update it for your business and the .NET API before launch.</p>
    </PageLayout>
  );
}
