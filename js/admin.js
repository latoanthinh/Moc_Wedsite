(function () {
  "use strict";
  const auth = window.StoreAuth;
  if (!auth.requireAdmin()) return;
  document.getElementById("admin-main").hidden = false;

  const ui = window.StoreUI;
  const data = window.StoreData;
  const productHost = document.getElementById("admin-products");
  const orderHost = document.getElementById("admin-orders");
  const productDialog = document.getElementById("product-dialog");
  const productForm = document.getElementById("product-form");
  const orderStatuses = ["Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"];
  const paymentStatuses = ["Chưa thanh toán", "Đã thanh toán", "Thanh toán khi nhận hàng", "Mô phỏng — chưa thanh toán"];

  function activeProducts() {
    return data.products.filter((product) => product.active !== false);
  }

  function allOrders() {
    return ui.getAllOrders().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  function updateStats() {
    const orders = allOrders();
    document.getElementById("stat-products").textContent = activeProducts().length;
    document.getElementById("stat-open-orders").textContent = orders.filter((order) => !["Đã giao", "Đã hủy"].includes(order.status)).length;
    document.getElementById("stat-pending-orders").textContent = orders.filter((order) => order.status === "Chờ xác nhận").length;
    document.getElementById("stat-revenue").textContent = ui.formatCurrency(orders.filter((order) => order.status === "Đã giao").reduce((sum, order) => sum + Number(order.total || 0), 0));
  }

  function renderProducts() {
    const query = document.getElementById("admin-product-search").value.trim().toLocaleLowerCase("vi");
    const products = data.products.filter((product) => `${product.name} ${product.category}`.toLocaleLowerCase("vi").includes(query));
    document.getElementById("products-empty").hidden = products.length > 0;
    productHost.innerHTML = products.map((product) => `<tr>
      <td><div class="admin-product-cell"><img src="${ui.escapeHtml(product.image)}" alt=""><span><strong>${ui.escapeHtml(product.name)}</strong><small>#${product.id}</small></span></div></td>
      <td>${ui.escapeHtml(product.category)}</td><td>${ui.formatCurrency(product.price)}</td>
      <td><span class="stock-pill${product.stock <= 5 ? " low-stock" : ""}">${product.stock}</span></td>
      <td><span class="visibility-pill${product.active === false ? " is-hidden" : ""}">${product.active === false ? "Đang ẩn" : "Đang bán"}</span></td>
      <td><div class="admin-row-actions"><button class="table-action" type="button" data-edit-product="${product.id}"><i data-lucide="pencil"></i> Sửa</button><button class="table-action danger-action" type="button" data-delete-product="${product.id}"><i data-lucide="trash-2"></i> Xóa</button></div></td>
    </tr>`).join("");
    ui.iconRefresh();
    updateStats();
  }

  function renderOrders() {
    const statusFilter = document.getElementById("order-status-filter").value;
    const orders = allOrders().filter((order) => statusFilter === "Tất cả" || order.status === statusFilter);
    document.getElementById("orders-empty").hidden = orders.length > 0;
    orderHost.innerHTML = orders.map((order) => {
      const items = (order.items || []).map((item) => `<li>${ui.escapeHtml(item.name)} × ${item.quantity}<strong>${ui.formatCurrency(item.price * item.quantity)}</strong></li>`).join("");
      const statusOptions = orderStatuses.map((status) => `<option value="${status}"${order.status === status ? " selected" : ""}>${status}</option>`).join("");
      const paymentOptions = paymentStatuses.map((status) => `<option value="${status}"${order.paymentStatus === status ? " selected" : ""}>${status}</option>`).join("");
      return `<article class="admin-order-card" data-order-card="${ui.escapeHtml(order.id)}">
        <div class="admin-order-top"><div><strong>${ui.escapeHtml(order.id)}</strong><span>${ui.escapeHtml(order.customer && order.customer.name || "Khách hàng")}</span></div><span>${new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</span></div>
        <div class="admin-order-detail"><div><p class="admin-detail-label">Liên hệ & giao hàng</p><p>${ui.escapeHtml(order.customer && order.customer.email || order.user || "")}</p><p>${ui.escapeHtml(order.customer && order.customer.phone || "Chưa có số điện thoại")}</p><p>${ui.escapeHtml(order.customer && order.customer.address || "Chưa có địa chỉ")}</p>${order.note ? `<p><strong>Ghi chú:</strong> ${ui.escapeHtml(order.note)}</p>` : ""}</div><div><p class="admin-detail-label">Sản phẩm</p><ul>${items}</ul><p class="admin-order-total">Tổng đơn <strong>${ui.formatCurrency(order.total)}</strong></p></div></div>
        <div class="admin-order-controls"><label>Trạng thái đơn<select data-order-status="${ui.escapeHtml(order.id)}">${statusOptions}</select></label><label>Thanh toán<select data-payment-status="${ui.escapeHtml(order.id)}">${paymentOptions}</select></label><label>Mã vận đơn<input data-tracking="${ui.escapeHtml(order.id)}" maxlength="50" value="${ui.escapeHtml(order.trackingNumber || "")}" placeholder="Chưa có"></label><button class="button button-dark save-order-button" type="button" data-save-order="${ui.escapeHtml(order.id)}"><i data-lucide="save"></i> Lưu cập nhật</button></div>
      </article>`;
    }).join("");
    ui.iconRefresh();
    updateStats();
  }

  function populateCategorySelect() {
    productForm.elements.category.innerHTML = data.categories.filter((category) => category !== "Tất cả")
      .map((category) => `<option value="${ui.escapeHtml(category)}">${ui.escapeHtml(category)}</option>`).join("");
  }

  function resetProductForm(product) {
    productForm.reset();
    productForm.elements.id.value = product ? product.id : "";
    productForm.elements.name.value = product ? product.name : "";
    productForm.elements.category.value = product ? product.category : data.categories[1];
    productForm.elements.price.value = product ? product.price : "";
    productForm.elements.oldPrice.value = product && product.oldPrice ? product.oldPrice : "";
    productForm.elements.stock.value = product ? product.stock : 20;
    productForm.elements.badge.value = product ? product.badge || "" : "";
    productForm.elements.rating.value = product ? product.rating || "5" : "5";
    productForm.elements.image.value = product ? product.image : "";
    productForm.elements.keywords.value = product ? product.keywords || "" : "";
    productForm.elements.active.checked = !product || product.active !== false;
    document.getElementById("product-dialog-title").textContent = product ? "Cập nhật sản phẩm" : "Thêm sản phẩm";
    productDialog.showModal();
  }

  function adjustOrderInventory(order, nextStatus) {
    if (nextStatus === "Đã hủy" && order.status !== "Đã hủy" && order.inventoryApplied && !order.inventoryRestoredAt) {
      ui.adjustInventory(order, 1);
      return new Date().toISOString();
    }
    if (order.status === "Đã hủy" && nextStatus !== "Đã hủy" && order.inventoryApplied && order.inventoryRestoredAt) {
      ui.adjustInventory(order, -1);
      return null;
    }
    return order.inventoryRestoredAt || null;
  }

  productHost.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-product]");
    const deleteButton = event.target.closest("[data-delete-product]");
    if (editButton) {
      const product = data.products.find((entry) => entry.id === Number(editButton.dataset.editProduct));
      if (product) resetProductForm(product);
    }
    if (deleteButton) {
      const id = Number(deleteButton.dataset.deleteProduct);
      const product = data.products.find((entry) => entry.id === id);
      if (!product || !window.confirm(`Xóa sản phẩm “${product.name}”? Thao tác này sẽ cập nhật cửa hàng trên trình duyệt này.`)) return;
      ui.saveProducts(data.products.filter((entry) => entry.id !== id));
      renderProducts();
      ui.showToast("Đã xóa sản phẩm.");
    }
  });

  productForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!productForm.reportValidity()) return;
    const fields = new FormData(productForm);
    const id = fields.get("id") ? Number(fields.get("id")) : Math.max(0, ...data.products.map((product) => product.id)) + 1;
    const name = String(fields.get("name")).trim();
    const image = String(fields.get("image")).trim();
    if (!/^https:\/\//i.test(image)) {
      productForm.elements.image.setCustomValidity("Vui lòng dùng đường dẫn ảnh HTTPS.");
      productForm.elements.image.reportValidity();
      return;
    }
    productForm.elements.image.setCustomValidity("");
    const price = Number(fields.get("price"));
    const oldPrice = fields.get("oldPrice") ? Number(fields.get("oldPrice")) : null;
    if (oldPrice !== null && oldPrice < price) {
      productForm.elements.oldPrice.setCustomValidity("Giá gốc cần bằng hoặc cao hơn giá bán.");
      productForm.elements.oldPrice.reportValidity();
      return;
    }
    productForm.elements.oldPrice.setCustomValidity("");
    const previous = data.products.find((product) => product.id === id);
    const product = {
      id,
      name,
      category: String(fields.get("category")),
      price,
      oldPrice,
      rating: Number(fields.get("rating")).toFixed(1),
      badge: String(fields.get("badge") || "").trim(),
      image,
      keywords: String(fields.get("keywords") || "").trim(),
      stock: Number(fields.get("stock")),
      active: productForm.elements.active.checked
    };
    try {
      const products = previous
        ? data.products.map((entry) => entry.id === id ? product : entry)
        : [...data.products, product];
      ui.saveProducts(products);
      productDialog.close();
      renderProducts();
      ui.showToast(previous ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm.");
    } catch (error) {
      ui.showToast(error.message || "Không thể lưu sản phẩm trên trình duyệt này.", "error");
    }
  });

  orderHost.addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-save-order]");
    if (!saveButton) return;
    const orderId = saveButton.dataset.saveOrder;
    const card = orderHost.querySelector(`[data-order-card="${CSS.escape(orderId)}"]`);
    const nextStatus = card.querySelector(`[data-order-status="${CSS.escape(orderId)}"]`).value;
    const paymentStatus = card.querySelector(`[data-payment-status="${CSS.escape(orderId)}"]`).value;
    const trackingNumber = card.querySelector(`[data-tracking="${CSS.escape(orderId)}"]`).value.trim();
    const order = allOrders().find((entry) => entry.id === orderId);
    if (!order) {
      ui.showToast("Không tìm thấy đơn hàng.", "error");
      return;
    }
    if (nextStatus === "Đã giao" && !["Đã thanh toán", "Thanh toán khi nhận hàng"].includes(paymentStatus)) {
      ui.showToast("Hãy xác nhận thanh toán trước khi đánh dấu đơn đã giao.", "error");
      return;
    }
    try {
      const inventoryRestoredAt = adjustOrderInventory(order, nextStatus);
      ui.updateOrder(orderId, { status: nextStatus, paymentStatus, trackingNumber, inventoryRestoredAt });
      renderOrders();
      ui.showToast("Đã cập nhật đơn hàng.");
    } catch (error) {
      ui.showToast(error.message || "Không thể cập nhật đơn hàng.", "error");
    }
  });

  document.getElementById("admin-product-search").addEventListener("input", renderProducts);
  document.getElementById("order-status-filter").addEventListener("change", renderOrders);
  document.getElementById("add-product").addEventListener("click", () => resetProductForm(null));
  document.getElementById("close-product-dialog").addEventListener("click", () => productDialog.close());
  document.getElementById("cancel-product-edit").addEventListener("click", () => productDialog.close());
  document.getElementById("products-tab").addEventListener("click", () => {
    document.getElementById("products-tab").classList.add("active");
    document.getElementById("products-tab").setAttribute("aria-selected", "true");
    document.getElementById("orders-tab").classList.remove("active");
    document.getElementById("orders-tab").setAttribute("aria-selected", "false");
    document.getElementById("products-panel").hidden = false;
    document.getElementById("orders-panel").hidden = true;
  });
  document.getElementById("orders-tab").addEventListener("click", () => {
    document.getElementById("orders-tab").classList.add("active");
    document.getElementById("orders-tab").setAttribute("aria-selected", "true");
    document.getElementById("products-tab").classList.remove("active");
    document.getElementById("products-tab").setAttribute("aria-selected", "false");
    document.getElementById("orders-panel").hidden = false;
    document.getElementById("products-panel").hidden = true;
    renderOrders();
  });

  document.getElementById("admin-name").textContent = auth.getCurrentAccount().name;
  populateCategorySelect();
  renderProducts();
  renderOrders();
  ui.iconRefresh();
})();
