(function () {
  "use strict";
  const ACCOUNTS_KEY = "moc-studio-demo-accounts";
  const SESSION_KEY = "moc-studio-demo-session";

  function readAccounts() {
    const saved = localStorage.getItem(ACCOUNTS_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function toHex(bytes) {
    return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle || !window.crypto.getRandomValues) {
      throw new Error("Để tạo tài khoản demo, hãy chạy website trên localhost hoặc HTTPS.");
    }
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const digest = await window.crypto.subtle.deriveBits({
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 120000,
      hash: "SHA-256"
    }, keyMaterial, 256);
    return toHex(digest);
  }

  function getCurrentAccount() {
    const email = normalizeEmail(localStorage.getItem(SESSION_KEY));
    if (!email) return null;
    const account = readAccounts()[email];
    if (!account) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { ...account, email };
  }

  function isAdmin() {
    const account = getCurrentAccount();
    return Boolean(account && window.StoreData.adminEmails.includes(account.email));
  }

  function requireLogin() {
    if (getCurrentAccount()) return true;
    const next = `${location.pathname.split("/").pop() || "index.html"}${location.search}`;
    location.href = `account.html?next=${encodeURIComponent(next)}`;
    return false;
  }

  function getSafeReturnPath() {
    const requested = new URLSearchParams(location.search).get("next") || "index.html";
    const allowed = new Set(["index.html", "products.html", "cart.html", "checkout.html", "orders.html", "about.html", "admin.html"]);
    const candidate = requested.split("?")[0].split("#")[0];
    return allowed.has(candidate) ? requested : "index.html";
  }

  async function register({ name, email, password }) {
    const cleanName = String(name || "").trim();
    const cleanEmail = normalizeEmail(email);
    if (cleanName.length < 2) throw new Error("Vui lòng nhập họ tên có ít nhất 2 ký tự.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Địa chỉ email chưa hợp lệ.");
    if (String(password).length < 8) throw new Error("Mật khẩu cần có ít nhất 8 ký tự.");
    const accounts = readAccounts();
    if (accounts[cleanEmail]) throw new Error("Email này đã có tài khoản. Hãy đăng nhập nhé.");
    const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
    const salt = toHex(saltBytes);
    accounts[cleanEmail] = {
      name: cleanName,
      salt,
      passwordHash: await hashPassword(password, salt),
      phone: "",
      address: "",
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.setItem(SESSION_KEY, cleanEmail);
    return { ...accounts[cleanEmail], email: cleanEmail };
  }

  async function login({ email, password }) {
    const cleanEmail = normalizeEmail(email);
    const account = readAccounts()[cleanEmail];
    if (!account) throw new Error("Email hoặc mật khẩu chưa chính xác.");
    const candidate = await hashPassword(password, account.salt);
    if (candidate !== account.passwordHash) throw new Error("Email hoặc mật khẩu chưa chính xác.");
    localStorage.setItem(SESSION_KEY, cleanEmail);
    return { ...account, email: cleanEmail };
  }

  function updateProfile(changes) {
    const current = getCurrentAccount();
    if (!current) throw new Error("Bạn cần đăng nhập để lưu thông tin.");
    const accounts = readAccounts();
    const { email, ...profile } = current;
    accounts[email] = { ...profile, ...changes };
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return { ...accounts[email], email };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function requireAdmin() {
    if (isAdmin()) return true;
    if (getCurrentAccount()) {
      location.href = "index.html";
      return false;
    }
    const next = `${location.pathname.split("/").pop() || "index.html"}${location.search}`;
    location.href = `account.html?next=${encodeURIComponent(next)}`;
    return false;
  }

  window.StoreAuth = { getCurrentAccount, isAdmin, requireLogin, requireAdmin, getSafeReturnPath, register, login, updateProfile, logout };
})();
