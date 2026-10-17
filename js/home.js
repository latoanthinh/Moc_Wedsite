(function () {
  "use strict";
  const host = document.getElementById("featured-products");
  if (!host) return;
  host.innerHTML = window.StoreData.products.filter((product) => product.active !== false).slice(0, 4).map(window.StoreUI.renderProductCard).join("");
  window.StoreUI.bindProductActions(host);
  window.StoreUI.iconRefresh();
})();
