(function () {
  "use strict";
  if (!window.StoreAuth.requireLogin()) return;
  const data = window.StoreData;
  const ui = window.StoreUI;
  const host = document.getElementById("cart-lines");

  function totals(cart) {
    const subtotal = cart.reduce((sum, item) => sum + data.products.find((product) => product.id === item.id).price * item.quantity, 0);
    const shipping = subtotal === 0 || subtotal >= data.freeShippingThreshold ? 0 : data.shippingFee;
    return { subtotal, shipping, total: subtotal + shipping };
  }

  function render() {
    const cart = ui.getCart();
    const summary = totals(cart);
    if (!cart.length) {
      host.innerHTML = `<div class="cart-empty"><i data-lucide="shopping-bag"></i><h2>Giỏ hàng đang trống</h2><p>Khám phá bộ sưu tập và chọn món đồ bạn thích.</p><a class="button button-dark" href="products.html">Xem sản phẩm <i data-lucide="arrow-right"></i></a></div>`;
      document.getElementById("checkout-link").setAttribute("aria-disabled", "true");
    } else {
      host.innerHTML = cart.map((item) => {
        const product = data.products.find((entry) => entry.id === item.id);
        return `<article class="cart-line"><img src="${ui.escapeHtml(product.image)}" alt="${ui.escapeHtml(product.name)}"><div class="cart-line-info"><strong>${ui.escapeHtml(product.name)}</strong><span>${ui.formatCurrency(product.price)} / món</span><div class="quantity-control"><button type="button" data-quantity="${product.id}" data-delta="-1" aria-label="Giảm số lượng">−</button><span>${item.quantity}</span><button type="button" data-quantity="${product.id}" data-delta="1" aria-label="Tăng số lượng">+</button></div></div><button class="remove-item" type="button" data-remove="${product.id}" aria-label="Xóa ${ui.escapeHtml(product.name)}"><i data-lucide="trash-2"></i></button><strong class="cart-line-total">${ui.formatCurrency(product.price * item.quantity)}</strong></article>`;
      }).join("");
      document.getElementById("checkout-link").removeAttribute("aria-disabled");
    }
    document.getElementById("cart-subtotal").textContent = ui.formatCurrency(summary.subtotal);
    document.getElementById("cart-shipping").textContent = summary.shipping ? ui.formatCurrency(summary.shipping) : "Miễn phí";
    document.getElementById("cart-total").textContent = ui.formatCurrency(summary.total);
    document.getElementById("shipping-progress").textContent = !summary.subtotal
      ? `Miễn phí vận chuyển cho đơn từ ${ui.formatCurrency(data.freeShippingThreshold)}.`
      : summary.shipping ? `Mua thêm ${ui.formatCurrency(data.freeShippingThreshold - summary.subtotal)} để được miễn phí vận chuyển.`
        : "Đơn hàng đã được miễn phí vận chuyển!";
    ui.iconRefresh();
  }

  host.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity]");
    const removeButton = event.target.closest("[data-remove]");
    let cart = ui.getCart();
    if (quantityButton) {
      const item = cart.find((entry) => entry.id === Number(quantityButton.dataset.quantity));
      if (item) {
        const product = window.StoreData.products.find((entry) => entry.id === item.id);
        item.quantity = Math.min(item.quantity + Number(quantityButton.dataset.delta), product.stock);
        if (item.quantity === product.stock && Number(quantityButton.dataset.delta) > 0) ui.showToast("Số lượng tối đa hiện có đã được thêm vào giỏ.");
      }
      cart = cart.filter((entry) => entry.quantity > 0);
      ui.saveCart(cart);
      render();
    }
    if (removeButton) {
      ui.saveCart(cart.filter((entry) => entry.id !== Number(removeButton.dataset.remove)));
      render();
      ui.showToast("Đã xóa sản phẩm khỏi giỏ hàng.");
    }
  });
  document.getElementById("checkout-link").addEventListener("click", (event) => {
    if (!ui.getCart().length) {
      event.preventDefault();
      ui.showToast("Giỏ hàng đang trống.", "error");
    }
  });
  render();
})();
