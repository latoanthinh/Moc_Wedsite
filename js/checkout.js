(function () {
  "use strict";
  if (!window.StoreAuth.requireLogin()) return;
  const auth = window.StoreAuth;
  const ui = window.StoreUI;
  const data = window.StoreData;
  let cart = ui.getCart();
  if (!cart.length) {
    location.replace("cart.html");
    return;
  }
  if (cart.some((item) => {
    const product = window.StoreData.products.find((entry) => entry.id === item.id);
    return !product || item.quantity > product.stock;
  })) {
    ui.showToast("Số lượng sản phẩm trong giỏ đã thay đổi. Vui lòng kiểm tra lại.", "error");
    location.replace("cart.html");
    return;
  }

  const account = auth.getCurrentAccount();
  const form = document.getElementById("checkout-form");
  form.elements.name.value = account.name || "";
  form.elements.email.value = account.email || "";
  form.elements.phone.value = account.phone || "";
  form.elements.address.value = account.address || "";
  const subtotal = cart.reduce((sum, item) => sum + data.products.find((product) => product.id === item.id).price * item.quantity, 0);
  const shipping = subtotal >= data.freeShippingThreshold ? 0 : data.shippingFee;
  const total = subtotal + shipping;

  document.getElementById("checkout-items").innerHTML = cart.map((item) => {
    const product = data.products.find((entry) => entry.id === item.id);
    return `<div class="checkout-item"><span>${ui.escapeHtml(product.name)} × ${item.quantity}</span><strong>${ui.formatCurrency(product.price * item.quantity)}</strong></div>`;
  }).join("");
  document.getElementById("checkout-subtotal").textContent = ui.formatCurrency(subtotal);
  document.getElementById("checkout-shipping").textContent = shipping ? ui.formatCurrency(shipping) : "Miễn phí";
  document.getElementById("checkout-total").textContent = ui.formatCurrency(total);

  form.querySelectorAll('input[name="payment"]').forEach((radio) => radio.addEventListener("change", () => {
    document.getElementById("payment-demo-note").hidden = form.elements.payment.value !== "bank";
  }));

  form.elements.phone.addEventListener("input", () => form.elements.phone.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const phoneDigits = form.elements.phone.value.replace(/\D/g, "").length;
    if (phoneDigits < 9 || phoneDigits > 15) {
      form.elements.phone.setCustomValidity("Số điện thoại cần có từ 9 đến 15 chữ số.");
      form.elements.phone.reportValidity();
      return;
    }
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const fields = new FormData(form);
      const method = fields.get("payment");
      const order = {
        id: `MC${Date.now().toString().slice(-8)}`,
        user: account.email,
        createdAt: new Date().toISOString(),
        customer: { name: String(fields.get("name")).trim(), email: String(fields.get("email")).trim(), phone: String(fields.get("phone")).trim(), address: String(fields.get("address")).trim() },
        note: String(fields.get("note") || "").trim(),
        items: cart.map((item) => {
          const product = data.products.find((entry) => entry.id === item.id);
          return { id: product.id, name: product.name, image: product.image, price: product.price, quantity: item.quantity };
        }),
        subtotal,
        shipping,
        total,
        paymentMethod: method,
        paymentStatus: method === "bank" ? "Mô phỏng — chưa thanh toán" : "Thanh toán khi nhận hàng",
        status: "Chờ xác nhận"
      };
      auth.updateProfile({ phone: order.customer.phone, address: order.customer.address });
      ui.adjustInventory(order, -1);
      order.inventoryApplied = true;
      ui.saveOrders([order, ...ui.getOrders()]);
      ui.saveCart([]);
      location.href = `orders.html?placed=${encodeURIComponent(order.id)}`;
    } catch (error) {
      button.disabled = false;
      ui.showToast(error.message || "Không thể lưu đơn hàng. Vui lòng thử lại.", "error");
    }
  });
  ui.iconRefresh();
})();
