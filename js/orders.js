(function () {
  "use strict";
  if (!window.StoreAuth.requireLogin()) return;
  const ui = window.StoreUI;
  const host = document.getElementById("orders-list");
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" });

  function render() {
    const orders = ui.getOrders().sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    if (!orders.length) {
      host.innerHTML = `<div class="empty-state-card"><h2>Bạn chưa có đơn hàng nào</h2><p>Những món đồ bạn chọn sẽ xuất hiện tại đây.</p><a class="button button-dark" href="products.html">Khám phá sản phẩm <i data-lucide="arrow-right"></i></a></div>`;
      ui.iconRefresh();
      return;
    }
    host.innerHTML = orders.map((order) => {
      const products = order.items.map((item) => `<div class="order-product"><span>${ui.escapeHtml(item.name)} × ${item.quantity}</span><span>${ui.formatCurrency(item.price * item.quantity)}</span></div>`).join("");
      const method = order.paymentMethod === "bank" ? "Chuyển khoản (mô phỏng)" : "Thanh toán khi nhận hàng";
      const canCancel = order.status === "Chờ xác nhận";
      const mockQr = order.paymentMethod === "bank" && order.status !== "Đã hủy"
        ? `<div class="mock-payment"><div class="mock-qr" data-qr="${ui.escapeHtml(order.id)}"></div><div><strong>QR tham khảo · Không phải QR thanh toán</strong><p>Mã đơn ${ui.escapeHtml(order.id)} · ${ui.formatCurrency(order.total)}. Không có tài khoản nhận tiền và không thể dùng để chuyển khoản.</p><button class="copy-order-button" type="button" data-copy="${ui.escapeHtml(order.id)}">Sao chép mã đơn</button></div></div>`
        : "";
      return `<article class="order-card"><div class="order-card-head"><div><strong>Mã đơn ${ui.escapeHtml(order.id)}</strong><br><span>${dateFormatter.format(new Date(order.createdAt))}</span></div><span class="order-status">${ui.escapeHtml(order.status)}</span></div><div class="order-products">${products}</div><div class="order-meta">Thanh toán: ${method} · ${ui.escapeHtml(order.paymentStatus)}</div>${mockQr}<div class="order-bottom"><strong>Tổng cộng: ${ui.formatCurrency(order.total)}</strong>${canCancel ? `<button class="button button-outline" type="button" data-cancel="${ui.escapeHtml(order.id)}">Hủy đơn demo</button>` : ""}</div></article>`;
    }).join("");
    host.querySelectorAll("[data-qr]").forEach((container) => {
      const order = orders.find((entry) => entry.id === container.dataset.qr);
      if (window.QRCode && order) {
        new window.QRCode(container, {
          text: `MOC-STUDIO-DEMO|${order.id}|${order.total}`,
          width: 112,
          height: 112,
          colorDark: "#25312b",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M
        });
      } else {
        container.textContent = "QR demo chưa tải được.";
        container.setAttribute("role", "img");
        container.setAttribute("aria-label", "QR minh họa chưa tải được");
      }
    });
    ui.iconRefresh();
  }

  host.addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      if (!navigator.clipboard) {
        ui.showToast("Sao chép tự động không khả dụng; vui lòng ghi lại mã đơn.", "error");
        return;
      }
      navigator.clipboard.writeText(copyButton.dataset.copy)
        .then(() => ui.showToast("Đã sao chép mã đơn hàng."))
        .catch(() => ui.showToast("Không thể sao chép mã đơn trên trình duyệt này.", "error"));
      return;
    }
    const button = event.target.closest("[data-cancel]");
    if (!button) return;
    const orders = ui.getOrders();
    const order = orders.find((entry) => entry.id === button.dataset.cancel && entry.status === "Chờ xác nhận");
    if (!order) {
      ui.showToast("Đơn hàng này không thể hủy.", "error");
      return;
    }
    order.status = "Đã hủy";
    if (order.inventoryApplied && !order.inventoryRestoredAt) {
      ui.adjustInventory(order, 1);
      order.inventoryRestoredAt = new Date().toISOString();
    }
    ui.saveOrders(orders);
    render();
    ui.showToast("Đã hủy đơn hàng trong bản demo.");
  });
  const placedId = new URLSearchParams(location.search).get("placed");
  if (placedId && ui.getOrders().some((order) => order.id === placedId)) {
    ui.showToast(`Đặt hàng thành công! Mã đơn ${placedId}.`);
    history.replaceState(null, "", location.pathname);
  }
  render();
})();
