# Nàng — Góc ảnh đẹp

Website gallery ảnh và video chân dung, cảm hứng thời trang, dùng HTML, CSS và JavaScript thuần.

- `index.html`: trang gallery, bộ lọc ảnh/video, tìm kiếm và trình xem ảnh/video.
- `admin.html`: thêm và xóa ảnh/video bằng URL công khai, chọn chủ đề.
- `styles.css`: giao diện responsive cho máy tính và điện thoại.
- `js/gallery.js`: gallery, dữ liệu ảnh mặc định và nội dung người dùng đã lưu.
- `js/gallery-admin.js`: quản lý nội dung gallery.

## Chạy trên Windows

Mở Terminal tại thư mục dự án rồi chạy:

```powershell
py -m http.server 8000
```

Truy cập `http://localhost:8000`. Có thể dùng tiện ích Live Server của VS Code thay thế.

## Ảnh

Ảnh được tải từ Unsplash và video từ Pexels, vì vậy cần kết nối Internet. Trang quản trị tại `admin.html` nhận URL công khai trực tiếp tới ảnh/video (MP4 được khuyến nghị), không tải tệp lên máy chủ. Nội dung thêm/xóa được lưu trong `localStorage` của trình duyệt hiện tại nên không tự đồng bộ giữa thiết bị. Bộ sưu tập mặc định dùng nội dung minh họa.
