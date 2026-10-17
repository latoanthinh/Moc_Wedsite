(function () {
  "use strict";

  const STORAGE_KEY = "nang-gallery-custom-media";
  const DATABASE_NAME = "nang-gallery-media";
  const OBJECT_STORE = "uploads";
  const MAX_FILE_SIZE = 150 * 1024 * 1024;
  const MAX_THUMBNAIL_SIZE = 20 * 1024 * 1024;
  const form = document.getElementById("media-form-fields");
  const kind = document.getElementById("media-kind");
  const source = document.getElementById("media-source");
  const mediaUrlLabel = document.getElementById("media-url-label");
  const mediaUrl = document.getElementById("media-url");
  const mediaUrlHelp = document.getElementById("media-url-help");
  const mediaFileLabel = document.getElementById("media-file-label");
  const mediaFile = document.getElementById("media-file");
  const thumbnailFile = document.getElementById("thumbnail-file");
  const mediaFileHelp = document.getElementById("media-file-help");
  const coverUrlLabel = document.getElementById("cover-url-label");
  const coverUrl = document.getElementById("cover-url");
  const status = document.getElementById("admin-status");
  const list = document.getElementById("admin-media-list");
  const count = document.getElementById("admin-media-count");
  const empty = document.getElementById("admin-media-empty");
  const previewUrls = new Map();

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function getUrlItems() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const items = JSON.parse(saved);
    if (!Array.isArray(items)) throw new TypeError("Dữ liệu gallery đã lưu không hợp lệ.");
    return items;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(OBJECT_STORE)) {
          request.result.createObjectStore(OBJECT_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Không thể mở bộ nhớ tệp của trình duyệt."));
      request.onblocked = () => reject(new Error("Đang chờ đóng tab khác để mở bộ nhớ tệp."));
    });
  }

  async function getUploadedItems() {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, "readonly");
      const request = transaction.objectStore(OBJECT_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Không thể đọc tệp đã tải lên."));
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Không thể đọc tệp đã tải lên."));
      };
    });
  }

  async function saveUploadedItem(item) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, "readwrite");
      transaction.objectStore(OBJECT_STORE).put(item);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Không đủ dung lượng để lưu tệp trên thiết bị."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Trình duyệt đã hủy thao tác lưu tệp."));
      };
    });
  }

  async function deleteUploadedItem(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, "readwrite");
      transaction.objectStore(OBJECT_STORE).delete(id);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Không thể xóa tệp khỏi thiết bị."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Trình duyệt đã hủy thao tác xóa tệp."));
      };
    });
  }

  async function deleteThumbnailItem(id) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, "readwrite");
      transaction.objectStore(OBJECT_STORE).delete(`thumbnail:${id}`);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Không thể xóa thumbnail khỏi thiết bị."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Trình duyệt đã hủy thao tác xóa thumbnail."));
      };
    });
  }

  async function saveThumbnailItem(id, file) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, "readwrite");
      transaction.objectStore(OBJECT_STORE).put({ id: `thumbnail:${id}`, thumbnailFile: file });
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Không thể lưu thumbnail trên thiết bị."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Trình duyệt đã hủy thao tác lưu thumbnail."));
      };
    });
  }

  async function updateUploadedThumbnail(id, file) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, "readwrite");
      const store = transaction.objectStore(OBJECT_STORE);
      const request = store.get(id);
      request.onsuccess = () => {
        if (!request.result || !(request.result.file instanceof Blob)) {
          transaction.abort();
          return;
        }
        store.put({ ...request.result, thumbnailFile: file });
      };
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error || new Error("Không thể cập nhật thumbnail trên thiết bị."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error || new Error("Không tìm thấy nội dung hoặc trình duyệt đã hủy thao tác."));
      };
    });
  }

  function notifyGallery() {
    localStorage.setItem(`${STORAGE_KEY}-updated`, String(Date.now()));
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("nang-gallery-media-updates");
      channel.postMessage({ updated: true });
      channel.close();
    }
  }

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function getPreviewUrl(id, file) {
    let url = previewUrls.get(id);
    if (!url) {
      url = URL.createObjectURL(file);
      previewUrls.set(id, url);
    }
    return url;
  }

  function updateKindFields() {
    const isVideo = kind.value === "video";
    const isDevice = source.value === "device";
    mediaUrlLabel.firstChild.textContent = isVideo ? "URL video " : "URL ảnh ";
    mediaUrlHelp.textContent = isVideo
      ? "Dán URL trực tiếp tới video công khai, ví dụ tệp MP4."
      : "Dán URL trực tiếp tới tệp ảnh công khai.";
    mediaUrl.placeholder = isVideo ? "https://.../video.mp4" : "https://...";
    mediaUrlLabel.hidden = isDevice;
    mediaUrl.required = !isDevice;
    mediaUrl.disabled = isDevice;
    mediaFileLabel.hidden = !isDevice;
    mediaFile.required = isDevice;
    mediaFile.disabled = !isDevice;
    mediaFile.accept = isVideo ? "video/*" : "image/*";
    mediaFileLabel.firstChild.textContent = isVideo ? "Tệp video " : "Tệp ảnh ";
    mediaFileHelp.textContent = isVideo
      ? "Chọn video trên thiết bị, tối đa 150 MB (MP4 được khuyến nghị)."
      : "Chọn ảnh trên thiết bị, tối đa 150 MB.";
    coverUrlLabel.hidden = !isVideo || isDevice;
    coverUrl.required = false;
    coverUrl.disabled = !isVideo || isDevice;
  }

  async function renderList() {
    let items;
    try {
      const [urlItems, uploadedItems] = await Promise.all([Promise.resolve(getUrlItems()), getUploadedItems()]);
      const urlThumbnails = new Map(uploadedItems
        .filter((item) => item.id.startsWith("thumbnail:") && item.thumbnailFile instanceof Blob)
        .map((item) => [item.id.slice("thumbnail:".length), item.thumbnailFile]));
      items = [
        ...uploadedItems.filter((item) => item.file instanceof Blob)
          .map((item) => ({ ...item, sourceType: "device" })),
        ...urlItems.map((item) => ({
          ...item,
          thumbnailFile: urlThumbnails.get(item.id),
          sourceType: "url"
        }))
      ];
    } catch (error) {
      console.error("Không thể đọc nội dung gallery trong trang quản trị.", error);
      showStatus("Không thể đọc dữ liệu đã lưu. Hãy kiểm tra bộ nhớ trình duyệt rồi tải lại trang.", true);
      return;
    }

    const activeIds = new Set(items
      .filter((item) => item.sourceType === "device")
      .map((item) => item.id));
    items.forEach((item) => {
      if (item.thumbnailFile instanceof Blob) activeIds.add(`thumbnail:${item.id}`);
    });
    previewUrls.forEach((url, id) => {
      if (!activeIds.has(id)) {
        URL.revokeObjectURL(url);
        previewUrls.delete(id);
      }
    });
    count.textContent = items.length;
    empty.hidden = items.length > 0;
    list.innerHTML = items.map((item) => {
      let thumbnail;
      if (item.sourceType === "device") {
        thumbnail = item.thumbnailFile ? getPreviewUrl(`thumbnail:${item.id}`, item.thumbnailFile) : item.coverUrl;
        if (!thumbnail) {
          thumbnail = getPreviewUrl(item.id, item.file);
        }
      } else {
        thumbnail = item.thumbnailFile
          ? getPreviewUrl(`thumbnail:${item.id}`, item.thumbnailFile)
          : (item.kind === "photo" ? item.mediaUrl : (item.coverUrl
            || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=180&q=70"));
      }
      const typeLabel = item.kind === "video" ? "Video" : "Ảnh";
      const categoryLabel = { portrait: "Chân dung", fashion: "Thời trang", everyday: "Đời thường" }[item.category];
      return `<article class="gallery-admin-item">
        <img src="${escapeHtml(thumbnail)}" alt="" loading="lazy">
        <div class="gallery-admin-item-copy">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${typeLabel} · ${escapeHtml(categoryLabel || "Khác")} · ${item.sourceType === "device" ? "Từ thiết bị" : "URL"}</span>
        </div>
        <div class="gallery-admin-item-actions">
          <button class="gallery-admin-thumbnail" type="button" data-change-thumbnail
            aria-label="Đổi thumbnail: ${escapeHtml(item.title)}">Đổi thumbnail</button>
          <input type="file" accept="image/*" data-thumbnail-id="${escapeHtml(item.id)}"
            data-source="${item.sourceType}" aria-label="Chọn thumbnail cho ${escapeHtml(item.title)}" hidden>
          <button class="gallery-admin-delete" type="button" data-delete-id="${escapeHtml(item.id)}"
            data-source="${item.sourceType}" aria-label="Xóa ${typeLabel.toLocaleLowerCase("vi")}: ${escapeHtml(item.title)}">Xóa</button>
        </div>
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
  source.addEventListener("change", updateKindFields);
  mediaFile.addEventListener("change", () => {
    const file = mediaFile.files[0];
    if (file) showStatus(`${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const selectedKind = String(data.get("kind"));
    const selectedSource = String(data.get("source"));
    const title = String(data.get("title")).trim();
    const category = String(data.get("category"));
    const coverUrlValue = String(data.get("coverUrl") || "").trim();
    const thumbnail = thumbnailFile.files[0] || null;
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
      if (thumbnail && !thumbnail.type.startsWith("image/")) {
        throw new Error("Thumbnail phải là một tệp ảnh hợp lệ.");
      }
      if (thumbnail && thumbnail.size > MAX_THUMBNAIL_SIZE) {
        throw new Error("Thumbnail vượt quá giới hạn 20 MB.");
      }
      if (selectedSource === "device") {
        const file = mediaFile.files[0];
        if (!file) throw new Error("Hãy chọn tệp trên thiết bị.");
        if (file.size > MAX_FILE_SIZE) throw new Error("Tệp vượt quá giới hạn 150 MB.");
        if (!file.type.startsWith(selectedKind === "video" ? "video/" : "image/")) {
          throw new Error(selectedKind === "video" ? "Hãy chọn một tệp video hợp lệ." : "Hãy chọn một tệp ảnh hợp lệ.");
        }
        const item = {
          id: crypto.randomUUID(),
          title,
          kind: selectedKind,
          category,
          file,
          coverUrl: coverUrlValue,
          thumbnailFile: thumbnail
        };
        await saveUploadedItem(item);
      } else {
        const mediaUrlValue = String(data.get("mediaUrl")).trim();
        if (!validPublicUrl(mediaUrlValue)) throw new Error("URL nội dung phải bắt đầu bằng http:// hoặc https://.");
        if (coverUrlValue && !validPublicUrl(coverUrlValue)) {
          throw new Error("URL ảnh bìa phải bắt đầu bằng http:// hoặc https://.");
        }
        const items = getUrlItems();
        const id = crypto.randomUUID();
        if (thumbnail) await saveThumbnailItem(id, thumbnail);
        items.unshift({
          id,
          title,
          kind: selectedKind,
          category,
          mediaUrl: mediaUrlValue,
          coverUrl: coverUrlValue
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }

      notifyGallery();
      form.reset();
      updateKindFields();
      showStatus("Đã thêm nội dung vào gallery.");
      await renderList();
    } catch (error) {
      console.error("Không thể thêm nội dung gallery.", error);
      showStatus(error instanceof Error
        ? error.message
        : "Không thể lưu nội dung. Kiểm tra dung lượng còn trống trên thiết bị.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;
    button.disabled = true;
    try {
      if (button.dataset.source === "device") {
        await deleteUploadedItem(button.dataset.deleteId);
      } else {
        const items = getUrlItems();
        const updatedItems = items.filter((item) => item.id !== button.dataset.deleteId);
        if (updatedItems.length === items.length) {
          showStatus("Không tìm thấy nội dung cần xóa. Hãy tải lại trang.", true);
          return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
        await deleteThumbnailItem(button.dataset.deleteId);
      }
      notifyGallery();
      showStatus("Đã xóa nội dung khỏi gallery.");
      await renderList();
    } catch (error) {
      console.error("Không thể xóa nội dung gallery.", error);
      showStatus("Không thể xóa nội dung do lỗi bộ nhớ trình duyệt.", true);
      button.disabled = false;
    }
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-change-thumbnail]");
    if (!button) return;
    button.closest(".gallery-admin-item").querySelector("[data-thumbnail-id]").click();
  });

  list.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-thumbnail-id]");
    const file = input && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showStatus("Thumbnail phải là một tệp ảnh hợp lệ.", true);
      input.value = "";
      return;
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      showStatus("Thumbnail vượt quá giới hạn 20 MB.", true);
      input.value = "";
      return;
    }

    input.disabled = true;
    try {
      if (input.dataset.source === "device") {
        await updateUploadedThumbnail(input.dataset.thumbnailId, file);
      } else {
        await saveThumbnailItem(input.dataset.thumbnailId, file);
      }
      const previewUrl = previewUrls.get(`thumbnail:${input.dataset.thumbnailId}`);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrls.delete(`thumbnail:${input.dataset.thumbnailId}`);
      notifyGallery();
      showStatus("Đã lưu thumbnail trong cơ sở dữ liệu trên thiết bị.");
      await renderList();
    } catch (error) {
      console.error("Không thể cập nhật thumbnail.", error);
      showStatus(error instanceof Error ? error.message : "Không thể lưu thumbnail trên thiết bị.", true);
    } finally {
      input.disabled = false;
      input.value = "";
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === `${STORAGE_KEY}-updated`) renderList();
  });

  updateKindFields();
  renderList();
})();
