(function () {
  "use strict";
  const products = () => window.StoreData.products.filter((product) => product.active !== false);
  const categories = window.StoreData.categories;
  const host = document.getElementById("product-list");
  const searchInput = document.getElementById("product-search");
  const categoryHost = document.getElementById("category-filters");
  const noResults = document.getElementById("no-results");
  const countLabel = document.getElementById("results-count");
  const searchHint = document.getElementById("search-hint");
  let selectedCategory = "Tất cả";
  let query = "";

  function normalize(value) {
    return String(value).toLocaleLowerCase("vi").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim();
  }

  function editDistance(left, right) {
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const old = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
        previous = old;
      }
    }
    return row[right.length];
  }

  function scoreSearch(product, rawQuery) {
    const normalizedQuery = normalize(rawQuery);
    if (!normalizedQuery) return 1;
    const searchable = normalize(`${product.name} ${product.category} ${product.keywords}`);
    const compactQuery = normalizedQuery.replace(/\s/g, "");
    const compactSearchable = searchable.replace(/\s/g, "");
    if (searchable.includes(normalizedQuery)) return 100 + normalizedQuery.length;
    if (compactQuery.length >= 3 && compactSearchable.includes(compactQuery)) return 90 + compactQuery.length;

    const queryWords = normalizedQuery.split(" ");
    const searchWords = searchable.split(" ");
    let score = 0;
    for (const word of queryWords) {
      let best = 0;
      for (const candidate of searchWords) {
        if (candidate === word) best = Math.max(best, 8 + word.length);
        else if (candidate.startsWith(word) || word.startsWith(candidate)) best = Math.max(best, 6 + Math.min(word.length, candidate.length));
        else if (word.length >= 3) {
          const distance = editDistance(word, candidate);
          const allowedDistance = word.length >= 5 ? 2 : 1;
          if (distance <= allowedDistance) best = Math.max(best, 4 + word.length - distance);
        }
      }
      if (best === 0) return 0;
      score += best;
    }
    return score;
  }

  function setCategory(category) {
    selectedCategory = categories.includes(category) ? category : "Tất cả";
    categoryHost.querySelectorAll("button").forEach((button) => {
      const active = button.dataset.category === selectedCategory;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function render() {
    const minimum = Number(document.getElementById("min-price").value) || 0;
    const maximum = Number(document.getElementById("max-price").value) || Infinity;
    const sort = document.getElementById("product-sort").value;
    const catalog = products();
    let visible = catalog.map((product) => ({ product, score: scoreSearch(product, query) }))
      .filter(({ product, score }) => score > 0
        && (selectedCategory === "Tất cả" || product.category === selectedCategory)
        && product.price >= minimum && product.price <= maximum);
    if (query.trim()) visible.sort((a, b) => b.score - a.score);
    if (sort === "price-asc") visible.sort((a, b) => a.product.price - b.product.price);
    if (sort === "price-desc") visible.sort((a, b) => b.product.price - a.product.price);
    if (sort === "name") visible.sort((a, b) => a.product.name.localeCompare(b.product.name, "vi"));
    host.innerHTML = visible.map(({ product }, index) => window.StoreUI.renderProductCard(product, index)).join("");
    countLabel.textContent = `${visible.length} sản phẩm`;
    searchHint.textContent = query.trim() ? `Kết quả gần đúng cho “${query.trim()}”` : "";
    noResults.hidden = visible.length > 0;
    host.hidden = visible.length === 0;
    window.StoreUI.iconRefresh();
  }

  categoryHost.innerHTML = categories.map((category) => {
    const catalog = products();
    const count = category === "Tất cả" ? catalog.length : catalog.filter((product) => product.category === category).length;
    return `<button class="category-filter${category === "Tất cả" ? " active" : ""}" data-category="${window.StoreUI.escapeHtml(category)}" type="button" aria-pressed="${category === "Tất cả"}"><span>${window.StoreUI.escapeHtml(category)}</span><span>${count}</span></button>`;
  }).join("");
  categoryHost.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (button) setCategory(button.dataset.category);
  });
  window.StoreUI.bindProductActions(host);
  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    document.getElementById("clear-search").hidden = !query;
    render();
  });
  document.getElementById("clear-search").addEventListener("click", () => {
    searchInput.value = "";
    query = "";
    document.getElementById("clear-search").hidden = true;
    searchInput.focus();
    render();
  });
  ["product-sort", "min-price", "max-price"].forEach((id) => {
    document.getElementById(id).addEventListener(id === "product-sort" ? "change" : "input", render);
  });
  document.getElementById("reset-filters").addEventListener("click", () => {
    searchInput.value = "";
    document.getElementById("clear-search").hidden = true;
    document.getElementById("min-price").value = "";
    document.getElementById("max-price").value = "";
    document.getElementById("product-sort").value = "featured";
    query = "";
    setCategory("Tất cả");
  });
  document.getElementById("empty-reset").addEventListener("click", () => document.getElementById("reset-filters").click());

  const params = new URLSearchParams(location.search);
  query = params.get("q") || "";
  searchInput.value = query;
  if (query) document.getElementById("clear-search").hidden = false;
  const requestedCategory = params.get("category");
  if (requestedCategory) setCategory(requestedCategory);
  else render();

  window.StorePage = { render, normalize, scoreSearch, editDistance };
})();
