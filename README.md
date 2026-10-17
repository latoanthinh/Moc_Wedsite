# Nàng — Góc ảnh đẹp

Website gallery ảnh và video chân dung, cảm hứng thời trang, dùng HTML, CSS và JavaScript thuần.

- `index.html`: trang gallery, bộ lọc ảnh/video, tìm kiếm và trình xem ảnh/video.
- `admin.html`: thêm và xóa ảnh/video bằng URL công khai hoặc tải tệp từ thiết bị, chọn chủ đề và đổi thumbnail.
- `styles.css`: giao diện responsive cho máy tính và điện thoại.
- `js/gallery.js`: gallery, dữ liệu ảnh mặc định và nội dung người dùng đã lưu.
- `js/gallery-admin.js`: quản lý nội dung gallery và lưu tệp tải lên trong IndexedDB.

## Chạy trên Windows

Mở Terminal tại thư mục dự án rồi chạy:

```powershell
py -m http.server 8000
```

Truy cập `http://localhost:8000`. Có thể dùng tiện ích Live Server của VS Code thay thế.

## Lưu nội dung và thumbnail

Ảnh mặc định được tải từ Unsplash và video từ Pexels, vì vậy cần kết nối Internet. Trang quản trị nhận URL công khai hoặc tệp ảnh/video từ thiết bị (tối đa 150 MB mỗi tệp; MP4 được khuyến nghị). Thumbnail có thể tải lên khi thêm nội dung hoặc đổi cho từng mục (tối đa 20 MB).

Tệp media và thumbnail được lưu bằng IndexedDB; thông tin URL được lưu trong localStorage của trình duyệt hiện tại. Dữ liệu chỉ nằm trên thiết bị/trình duyệt này, không tải lên máy chủ hay đồng bộ giữa các thiết bị. Xóa dữ liệu trang web của trình duyệt có thể xóa nội dung đã lưu. Bộ sưu tập mặc định dùng nội dung minh họa.
