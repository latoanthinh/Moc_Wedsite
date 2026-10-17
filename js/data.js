(function () {
  "use strict";
  window.StoreData = {
    freeShippingThreshold: 500000,
    shippingFee: 30000,
    adminEmails: ["admin@mocstudio.vn"],
    categories: ["Tất cả", "Áo", "Quần", "Váy", "Phụ kiện"],
    products: [
      { id: 1, name: "Áo sơ mi linen An Nhiên", category: "Áo", price: 459000, oldPrice: 590000, rating: "4.9", badge: "BÁN CHẠY", image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=700&q=80", keywords: "sơ mi áo linen lanh nữ be trắng công sở" },
      { id: 2, name: "Quần ống rộng Mây Trắng", category: "Quần", price: 529000, oldPrice: null, rating: "4.8", badge: "MỚI", image: "https://images.unsplash.com/photo-1506629905607-d9b1e6e9a2a6?auto=format&fit=crop&w=700&q=80", keywords: "quần dài ống suông rộng nữ trắng kem" },
      { id: 3, name: "Váy midi hoa Nắng Mai", category: "Váy", price: 689000, oldPrice: 790000, rating: "5.0", badge: "YÊU THÍCH", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80", keywords: "đầm váy hoa midi dài nữ đi chơi" },
      { id: 4, name: "Túi tote vải Mộc Mạc", category: "Phụ kiện", price: 289000, oldPrice: null, rating: "4.9", badge: "BỀN VỮNG", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=80", keywords: "túi xách tote vải phụ kiện đi học" },
      { id: 5, name: "Áo thun cotton Dịu Dàng", category: "Áo", price: 329000, oldPrice: null, rating: "4.7", badge: "", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=700&q=80", keywords: "áo phông thun cotton trắng nữ" },
      { id: 6, name: "Quần linen Sớm Mai", category: "Quần", price: 499000, oldPrice: 580000, rating: "4.8", badge: "GIẢM 14%", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=80", keywords: "quần dài linen lanh nữ ống suông" },
      { id: 7, name: "Váy hai dây Thì Thầm", category: "Váy", price: 619000, oldPrice: null, rating: "4.9", badge: "MỚI", image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=700&q=80", keywords: "đầm váy hai dây nữ mùa hè" },
      { id: 8, name: "Khăn lụa Chạm Nắng", category: "Phụ kiện", price: 259000, oldPrice: null, rating: "4.8", badge: "", image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=700&q=80", keywords: "khăn lụa phụ kiện quàng cổ" }
    ]
  };

  const initialProducts = window.StoreData.products;
  const productsKey = "moc-studio-demo-products";
  Object.defineProperty(window.StoreData, "products", {
    enumerable: true,
    configurable: false,
    get() {
      try {
        const saved = localStorage.getItem(productsKey);
        if (!saved) return initialProducts.map((product) => ({ ...product, stock: 20 }));
        const products = JSON.parse(saved);
        const source = Array.isArray(products) ? products : initialProducts;
        return source.map((product) => ({ ...product, stock: Number.isInteger(product.stock) ? product.stock : 20 }));
      } catch (error) {
        console.error("Không thể đọc danh sách sản phẩm đã lưu.", error);
        return initialProducts;
      }
    },
    set(products) {
      if (!Array.isArray(products)) throw new TypeError("Danh sách sản phẩm phải là một mảng.");
      localStorage.setItem(productsKey, JSON.stringify(products));
    }
  });
})();
