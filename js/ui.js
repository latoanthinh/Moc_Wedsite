(function () {
  "use strict";
  const DATA = window.StoreData;

  function iconRefresh() {
    if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("vi-VN").format(value) + "₫";
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function currentUserKey() {
    const account = window.StoreAuth.getCurrentAccount();
    return account ? encodeURIComponent(account.email) : "guest";
  }

  function readArray(key) {
    try {
      const saved = localStorage.getItem(key);
      const result = saved ? JSON.parse(saved) : [];
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`Không thể đọc dữ liệu cửa hàng (${key}).`, error);
      return [];
    }
  }

  function cartKey() { return `moc-studio-cart:${currentUserKey()}`; }
  function favoritesKey() { return `moc-studio-favorites:${currentUserKey()}`; }
  function ordersKey() { return `moc-studio-orders:${currentUserKey()}`; }
  function getCart() {
    return readArray(cartKey()).filter((item) => item && Number.isInteger(item.id) && DATA.products.some((product) => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0);
  }
  function saveCart(cart) { localStorage.setItem(cartKey(), JSON.stringify(cart)); refreshCartCount(); }
  function getFavorites() { return readArray(favoritesKey()).filter((id) => DATA.products.some((product) => product.id === id)); }
  function saveFavorites(ids) { localStorage.setItem(favoritesKey(), JSON.stringify(ids)); }
  function getOrders() { return readArray(ordersKey()); }
  function saveOrders(orders) { localStorage.setItem(ordersKey(), JSON.stringify(orders)); }
  function saveProducts(products) { DATA.products = products; }
  function adjustInventory(order, direction) {
    const products = [...DATA.products];
    for (const item of order.items || []) {
      const product = products.find((entry) => entry.id === item.id);
      if (!product) continue;
      const stock = Number.isInteger(product.stock) ? product.stock : 20;
      if (direction < 0 && stock < item.quantity) {
        throw new Error(`Không đủ tồn kho để mở lại đơn hàng (${product.name}).`);
      }
      product.stock = stock + direction * item.quantity;
    }
    saveProducts(products);
  }
  function getAllOrders() {
    const all = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("moc-studio-orders:")) continue;
      all.push(...readArray(key));
    }
    return all;
  }
  function updateOrder(orderId, changes) {
    const order = getAllOrders().find((entry) => entry.id === orderId);
    if (!order) throw new Error("Không tìm thấy đơn hàng cần cập nhật.");
    const key = `moc-studio-orders:${encodeURIComponent(order.user || "guest")}`;
    const customerOrders = readArray(key);
    const index = customerOrders.findIndex((entry) => entry.id === orderId);
    if (index < 0) throw new Error("Không thể cập nhật đơn hàng trong bộ nhớ trình duyệt.");
    customerOrders[index] = { ...customerOrders[index], ...changes, updatedAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(customerOrders));
    return customerOrders[index];
  }

  function refreshCartCount() {
    const count = getCart().reduce((total, item) => total + item.quantity, 0);
    const badge = document.getElementById("header-cart-count");
    if (badge) badge.textContent = count;
  }

  function showToast(message, type) {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("toast-error", type === "error");
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
  }

  function renderHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const account = window.StoreAuth.getCurrentAccount();
    const page = location.pathname.split("/").pop() || "index.html";
    const links = [
      ["index.html", "Trang chủ"],
      ["products.html", "Sản phẩm"],
      ["about.html", "Câu chuyện"],
      ["orders.html", "Đơn hàng"]
    ];
    if (window.StoreAuth.isAdmin()) links.push(["admin.html", "Quản trị"]);
    host.innerHTML = `<header class="site-header">
      <button class="mobile-menu-button" id="menu-toggle" type="button" aria-label="Mở danh mục"><i data-lucide="menu"></i></button>
      <a class="brand" href="index.html" aria-label="Mộc Studio trang chủ"><span class="brand-mark">m.</span><span class="brand-name">mộc<span>studio</span></span></a>
      <nav class="main-nav" id="main-nav" aria-label="Điều hướng chính">${links.map(([href, label]) => `<a class="nav-link${page === href ? " active" : ""}" href="${href}"${href === "orders.html" ? ' data-auth-required="true"' : ""}>${label}</a>`).join("")}</nav>
      <div class="header-actions">
        <a class="header-account" href="account.html" aria-label="${account ? "Tài khoản của tôi" : "Đăng nhập"}"><i data-lucide="${account ? "user-round-check" : "user-round"}"></i><span>${account ? escapeHtml(account.name.split(" ")[0]) : "Đăng nhập"}</span></a>
        <a class="header-cart" href="cart.html" data-auth-required="true" aria-label="Giỏ hàng"><i data-lucide="shopping-bag"></i><span class="header-cart-label">Giỏ hàng</span><span class="cart-count" id="header-cart-count">0</span></a>
      </div>
    </header>`;
    iconRefresh();
    refreshCartCount();
  }

  function renderFooter() {
    const host = document.getElementById("site-footer");
    if (!host) return;
    host.innerHTML = `<footer class="site-footer"><div class="page-wrap">
      <div class="footer-main">
        <div class="footer-brand"><a class="brand" href="index.html"><span class="brand-mark">m.</span><span class="brand-name">mộc<span>studio</span></span></a><p>Mặc điều bạn yêu. Sống theo cách của bạn.</p><div class="footer-socials"><a href="https://www.instagram.com/" aria-label="Instagram"><i data-lucide="instagram"></i></a><a href="https://www.facebook.com/" aria-label="Facebook"><i data-lucide="facebook"></i></a></div></div>
        <div class="footer-column"><strong>Khám phá</strong><a href="products.html">Sản phẩm</a><a href="about.html">Về Mộc Studio</a><a href="orders.html" data-auth-required="true">Đơn hàng</a></div>
        <div class="footer-column"><strong>Hỗ trợ</strong><a href="about.html">Chính sách đổi trả</a><a href="about.html">Hướng dẫn mua hàng</a><a href="mailto:xinchao@mocstudio.vn">Liên hệ Mộc</a></div>
        <div class="footer-column"><strong>Liên hệ</strong><a href="mailto:xinchao@mocstudio.vn">xinchao@mocstudio.vn</a><a href="tel:1900123456">1900 123 456</a><span>09:00 – 21:00 mỗi ngày</span></div>
      </div><div class="footer-bottom"><span>© 2026 Mộc Studio · Website minh họa</span><span>Thanh toán và tài khoản hiện chạy ở chế độ demo.</span></div>
    </div></footer>`;
    iconRefresh();
  }

  function renderLoader() {
    const loader = document.createElement("div");
    loader.id = "page-loader";
    loader.className = "page-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-label", "Đang tải cửa hàng");
    loader.innerHTML = `<span class="brand-mark">m.</span><span class="loader-track"><i></i></span><span>ĐANG CHUẨN BỊ MỘT CHÚT CẢM HỨNG...</span>`;
    document.body.append(loader);
    const hide = () => window.setTimeout(() => loader.classList.add("is-hidden"), 180);
    window.addEventListener("load", hide, { once: true });
    window.setTimeout(hide, 2500);
  }

  function renderProductCard(product, index) {
    const liked = getFavorites().includes(product.id);
    const outOfStock = product.stock <= 0;
    return `<article class="product-card" style="animation-delay:${index * 35}ms">
      <div class="product-image-wrap"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
        ${outOfStock ? '<span class="product-badge sold-out-badge">HẾT HÀNG</span>' : ""}
        <button class="wishlist-button${liked ? " is-liked" : ""}" data-favorite="${product.id}" type="button" aria-label="${liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}"><i data-lucide="heart"></i></button>
        <button class="quick-add" data-add="${product.id}" type="button"${outOfStock ? " disabled" : ""}><i data-lucide="${outOfStock ? "ban" : "plus"}"></i> ${outOfStock ? "Tạm hết hàng" : "Thêm vào giỏ"}</button>
      </div><div class="product-info"><p class="product-name">${escapeHtml(product.name)}</p><div class="product-meta"><span class="product-price">${formatCurrency(product.price)}${product.oldPrice ? `<span class="product-old-price">${formatCurrency(product.oldPrice)}</span>` : ""}</span><span class="product-rating"><i data-lucide="star"></i>${escapeHtml(product.rating)}</span></div></div>
    </article>`;
  }

  function bindProductActions(container) {
    container.addEventListener("click", (event) => {
      const add = event.target.closest("[data-add]");
      const favorite = event.target.closest("[data-favorite]");
      if (add) {
        if (!window.StoreAuth.requireLogin()) return;
        const id = Number(add.dataset.add);
        const product = DATA.products.find((entry) => entry.id === id);
        if (!product || product.stock <= 0) {
          showToast("Sản phẩm hiện đã hết hàng.", "error");
          return;
        }
        const cart = getCart();
        const item = cart.find((entry) => entry.id === id);
        if (item && item.quantity >= product.stock) {
          showToast("Số lượng trong giỏ đã đạt mức tồn kho.", "error");
          return;
        } else if (item) item.quantity += 1;
        else cart.push({ id, quantity: 1 });
        saveCart(cart);
        showToast("Đã thêm sản phẩm vào giỏ hàng.");
      }
      if (favorite) {
        if (!window.StoreAuth.requireLogin()) return;
        const id = Number(favorite.dataset.favorite);
        const favorites = getFavorites();
        const updated = favorites.includes(id) ? favorites.filter((entry) => entry !== id) : [...favorites, id];
        saveFavorites(updated);
        const pageRenderer = window.StorePage && window.StorePage.render;
        if (pageRenderer) pageRenderer();
        else favorite.classList.toggle("is-liked");
        showToast(updated.includes(id) ? "Đã lưu vào danh sách yêu thích." : "Đã bỏ khỏi danh sách yêu thích.");
      }
    });
  }

  document.addEventListener("click", (event) => {
    const protectedLink = event.target.closest("[data-auth-required]");
    if (protectedLink && !window.StoreAuth.requireLogin()) event.preventDefault();
    const menuButton = event.target.closest("#menu-toggle");
    if (menuButton) document.getElementById("main-nav").classList.toggle("is-open");
    const navLink = event.target.closest("#main-nav .nav-link");
    if (navLink) document.getElementById("main-nav").classList.remove("is-open");
  });

  renderHeader();
  renderFooter();
  renderLoader();
  window.StoreUI = {
    iconRefresh, formatCurrency, escapeHtml, getCart, saveCart, getFavorites, saveFavorites,
    getOrders, saveOrders, refreshCartCount, showToast, renderProductCard, bindProductActions,
    cartKey, ordersKey, getAllOrders, updateOrder, saveProducts, adjustInventory
  };
})();
