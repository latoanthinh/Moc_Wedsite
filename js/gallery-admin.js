(function () {
  "use strict";

  const STORAGE_KEY = "nang-gallery-custom-media";
  const form = document.getElementById("media-form-fields");
  const kind = document.getElementById("media-kind");
  const mediaUrlLabel = document.getElementById("media-url-label");
  const mediaUrl = document.getElementById("media-url");
  const mediaUrlHelp = document.getElementById("media-url-help");
  const coverUrlLabel = document.getElementById("cover-url-label");
  const status = document.getElementById("admin-status");
  const list = document.getElementById("admin-media-list");
  const count = document.getElementById("admin-media-count");
  const empty = document.getElementById("admin-media-empty");

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function getItems() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const items = JSON.parse(saved);
    if (!Array.isArray(items)) throw new TypeError("Dữ liệu gallery đã lưu không hợp lệ.");
    return items;
  }

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function updateKindFields() {
    const isVideo = kind.value === "video";
    mediaUrlLabel.firstChild.textContent = isVideo ? "URL video " : "URL ảnh ";
    mediaUrlHelp.textContent = isVideo
      ? "Dán URL trực tiếp tới video công khai, ví dụ tệp MP4."
      : "Dán URL trực tiếp tới tệp ảnh công khai.";
    mediaUrl.placeholder = isVideo ? "https://.../video.mp4" : "https://...";
    coverUrlLabel.hidden = !isVideo;
    document.getElementById("cover-url").required = false;
  }

  function renderList() {
    let items;
    try {
      items = getItems();
    } catch (error) {
      console.error("Không thể đọc nội dung gallery trong trang quản trị.", error);
      showStatus("Không thể đọc dữ liệu đã lưu. Kiểm tra bộ nhớ trình duyệt rồi tải lại trang.", true);
      return;
    }

    count.textContent = items.length;
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((item) => {
      const thumbnail = item.kind === "photo" ? item.mediaUrl : (item.coverUrl
        || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=180&q=70");
      const typeLabel = item.kind === "video" ? "Video" : "Ảnh";
      const categoryLabel = { portrait: "Chân dung", fashion: "Thời trang", everyday: "Đời thường" }[item.category];
      return `<article class="gallery-admin-item">
        <img src="${escapeHtml(thumbnail)}" alt="" loading="lazy">
        <div class="gallery-admin-item-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${typeLabel} · ${escapeHtml(categoryLabel || "Khác")}</span>
        </div>
        <button class="gallery-admin-delete" type="button" data-delete-id="${escapeHtml(item.id)}"
          aria-label="Xóa ${typeLabel.toLocaleLowerCase("vi")}: ${escapeHtml(item.title)}">Xóa</button>
      </article>`;
    }).join("");
  }

  function validPublicUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  kind.addEventListener("change", updateKindFields);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const mediaUrlValue = String(data.get("mediaUrl")).trim();
    const coverUrlValue = String(data.get("coverUrl") || "").trim();
    if (!validPublicUrl(mediaUrlValue)) {
      showStatus("URL nội dung phải bắt đầu bằng http:// hoặc https://.", true);
      mediaUrl.focus();
      return;
    }
    if (coverUrlValue && !validPublicUrl(coverUrlValue)) {
      showStatus("URL ảnh bìa phải bắt đầu bằng http:// hoặc https://.", true);
      document.getElementById("cover-url").focus();
      return;
    }

    let items;
    try {
      items = getItems();
      items.unshift({
        id: crypto.randomUUID(),
        title: String(data.get("title")).trim(),
        kind: String(data.get("kind")),
        category: String(data.get("category")),
        mediaUrl: mediaUrlValue,
        coverUrl: coverUrlValue
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Không thể lưu nội dung gallery.", error);
      showStatus("Không thể lưu nội dung. Kiểm tra dung lượng và quyền lưu của trình duyệt.", true);
      return;
    }

    form.reset();
    updateKindFields();
    showStatus("Đã thêm nội dung vào gallery.");
    renderList();
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;
    try {
      const items = getItems();
      const updatedItems = items.filter((item) => item.id !== button.dataset.deleteId);
      if (updatedItems.length === items.length) {
        showStatus("Không tìm thấy nội dung cần xóa. Hãy tải lại trang.", true);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
      showStatus("Đã xóa nội dung khỏi gallery.");
      renderList();
    } catch (error) {
      console.error("Không thể xóa nội dung gallery.", error);
      showStatus("Không thể xóa nội dung do lỗi bộ nhớ trình duyệt.", true);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) renderList();
  });

  updateKindFields();
  renderList();
})();
