(function () {
  "use strict";

  const defaultPhotos = [
    {
      title: "Nắng qua ô cửa",
      category: "portrait",
      label: "Chân dung",
      image: "photo-1494790108377-be9c29b29330",
      position: "center 38%"
    },
    {
      title: "Một ngày dạo phố",
      category: "fashion",
      label: "Thời trang",
      image: "photo-1539109136881-3be0616acf4b",
      position: "center 35%"
    },
    {
      title: "Dịu dàng ngày nắng",
      category: "everyday",
      label: "Đời thường",
      image: "photo-1524250502761-1ac6f2e30d43",
      position: "center 35%"
    },
    {
      title: "Ánh mắt biết cười",
      category: "portrait",
      label: "Chân dung",
      image: "photo-1524504388940-b1c1722653e1",
      position: "center 38%"
    },
    {
      title: "Tự tin theo cách riêng",
      category: "fashion",
      label: "Thời trang",
      image: "photo-1531123897727-8f129e1688ce",
      position: "center 30%"
    },
    {
      title: "Khoảnh khắc bình yên",
      category: "everyday",
      label: "Đời thường",
      image: "photo-1508214751196-bcfd4ca60f91",
      position: "center 35%"
    },
    {
      title: "Nàng thơ mùa hạ",
      category: "portrait",
      label: "Chân dung",
      image: "photo-1488426862026-3ee34a7d66df",
      position: "center 36%"
    },
    {
      title: "Bước đi thật khẽ",
      category: "fashion",
      label: "Thời trang",
      image: "photo-1550614000-4895a10e1bfd",
      position: "center 30%"
    },
    {
      title: "Chạm vào nắng",
      category: "everyday",
      label: "Đời thường",
      image: "photo-1544005313-94ddf0286df2",
      position: "center 32%"
    },
    {
      title: "Màu sắc của nàng",
      category: "fashion",
      label: "Thời trang",
      image: "photo-1581044777550-4cfa60707c03",
      position: "center 32%"
    },
    {
      title: "Vẻ đẹp tự nhiên",
      category: "portrait",
      label: "Chân dung",
      image: "photo-1534528741775-53994a69daeb",
      position: "center 65%"
    },
    {
      title: "Một chiều thảnh thơi",
      category: "everyday",
      label: "Đời thường",
      image: "photo-1529626455594-4ff0802cfb7e",
      position: "center 35%"
    },
    {
      title: "Nàng trong chuyển động",
      category: "fashion",
      kind: "video",
      label: "Video",
      image: "photo-1531123897727-8f129e1688ce",
      video: "https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4",
      position: "center 30%"
    },
    {
      title: "Một khoảnh khắc dịu dàng",
      category: "portrait",
      kind: "video",
      label: "Video",
      image: "photo-1524504388940-b1c1722653e1",
      video: "https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4",
      position: "center 38%"
    }
  ];

  const grid = document.getElementById("photo-grid");
  const search = document.getElementById("gallery-search");
  const count = document.getElementById("gallery-count");
  const empty = document.getElementById("gallery-empty");
  const viewer = document.getElementById("photo-viewer");
  const viewerImage = document.getElementById("viewer-image");
  const viewerVideo = document.getElementById("viewer-video");
  const viewerCaption = document.getElementById("viewer-caption");
  const customMediaKey = "nang-gallery-custom-media";
  const fallbackCover = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=760&q=85";
  let selectedFilter = "all";
  let visiblePhotos = [];
  let activeIndex = 0;

  function getCustomMedia() {
    try {
      const saved = localStorage.getItem(customMediaKey);
      const items = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(items)) throw new TypeError("Dữ liệu gallery đã lưu không hợp lệ.");
      return items.filter((item) => item && typeof item.id === "string"
        && typeof item.title === "string" && typeof item.mediaUrl === "string"
        && (item.kind === "photo" || item.kind === "video")
        && ["portrait", "fashion", "everyday"].includes(item.category));
    } catch (error) {
      console.error("Không thể đọc nội dung gallery đã lưu.", error);
      return [];
    }
  }

  function getPhotos() {
    return [...defaultPhotos, ...getCustomMedia().map((item) => ({
      ...item,
      label: item.kind === "video" ? "Video" : "Ảnh",
      image: item.kind === "photo" ? item.mediaUrl : "",
      video: item.kind === "video" ? item.mediaUrl : "",
      cover: item.coverUrl
    }))];
  }

  function imageUrl(photo, width) {
    if (photo.cover) return photo.cover;
    if (/^https?:\/\//i.test(photo.image)) return photo.image;
    if (!photo.image) return fallbackCover;
    return `https://images.unsplash.com/${photo.image}?auto=format&fit=crop&w=${width}&q=85`;
  }

  function normalize(value) {
    return value.toLocaleLowerCase("vi").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function render() {
    const query = normalize(search.value.trim());
    visiblePhotos = getPhotos().filter((photo) => {
      const matchesFilter = selectedFilter === "all"
        || (selectedFilter === "photo" && photo.kind !== "video")
        || (selectedFilter === "video" && photo.kind === "video")
        || photo.category === selectedFilter;
      const matchesQuery = !query || normalize(`${photo.title} ${photo.label} ${photo.category}`).includes(query);
      return matchesFilter && matchesQuery;
    });

    grid.innerHTML = visiblePhotos.map((photo, index) => `
      <button class="photo-card" type="button" data-photo-index="${index}" aria-label="Xem ${photo.kind === "video" ? "video" : "ảnh"}: ${escapeHtml(photo.title)}">
        <img src="${escapeHtml(imageUrl(photo, 760))}" alt="${escapeHtml(photo.title)}" loading="lazy" decoding="async"
          style="object-position:${escapeHtml(photo.position || "center")}">
        <span class="photo-card-overlay">
          <span class="photo-card-copy"><span>${escapeHtml(photo.label)}</span><strong>${escapeHtml(photo.title)}</strong></span>
          <span class="photo-card-open${photo.kind === "video" ? " is-video" : ""}" aria-hidden="true">${photo.kind === "video" ? "▶" : "↗"}</span>
        </span>
      </button>`).join("");
    count.textContent = `${visiblePhotos.length} ${selectedFilter === "video" ? "video" : selectedFilter === "photo" ? "bức ảnh" : "nội dung"}`;
    empty.hidden = visiblePhotos.length > 0;
    grid.hidden = visiblePhotos.length === 0;
  }

  function showPhoto(index) {
    if (!visiblePhotos.length) return;
    activeIndex = (index + visiblePhotos.length) % visiblePhotos.length;
    const photo = visiblePhotos[activeIndex];
    if (photo.kind === "video") {
      viewerImage.hidden = true;
      viewerVideo.hidden = false;
      viewerVideo.poster = imageUrl(photo, 1200);
      viewerVideo.src = photo.video;
      viewerVideo.load();
    } else {
      viewerVideo.pause();
      viewerVideo.removeAttribute("src");
      viewerVideo.load();
      viewerVideo.hidden = true;
      viewerImage.hidden = false;
      viewerImage.src = imageUrl(photo, 1600);
      viewerImage.alt = photo.title;
      viewerImage.style.objectPosition = photo.position;
    }
    viewerCaption.textContent = `${photo.title} · ${photo.label}`;
    if (!viewer.open) viewer.showModal();
  }

  document.querySelectorAll(".gallery-filter").forEach((button) => {
    button.addEventListener("click", () => {
      selectedFilter = button.dataset.filter;
      document.querySelectorAll(".gallery-filter").forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  document.querySelectorAll("[data-filter-link]").forEach((link) => {
    link.addEventListener("click", () => {
      const button = document.querySelector(`.gallery-filter[data-filter="${link.dataset.filterLink}"]`);
      if (button) button.click();
    });
  });

  search.addEventListener("input", render);
  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-photo-index]");
    if (card) showPhoto(Number(card.dataset.photoIndex));
  });

  document.querySelector(".viewer-close").addEventListener("click", () => viewer.close());
  document.querySelector(".viewer-previous").addEventListener("click", () => showPhoto(activeIndex - 1));
  document.querySelector(".viewer-next").addEventListener("click", () => showPhoto(activeIndex + 1));
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => {
    viewerVideo.pause();
    viewerVideo.removeAttribute("src");
    viewerVideo.load();
  });
  viewer.addEventListener("keydown", (event) => {
    if (event.target === viewerVideo) return;
    if (event.key === "ArrowLeft") showPhoto(activeIndex - 1);
    if (event.key === "ArrowRight") showPhoto(activeIndex + 1);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === customMediaKey) render();
  });

  render();
})();
