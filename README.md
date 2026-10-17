# Mộc Studio — cửa hàng thời trang minh họa

Website tĩnh được tách thành các trang HTML riêng, dùng CSS và JavaScript thuần:

- `index.html`: trang chủ và sản phẩm nổi bật.
- `products.html`: danh sách sản phẩm, tìm kiếm gần đúng, lọc danh mục và khoảng giá.
- `account.html`: đăng ký, đăng nhập và đăng xuất.
- `cart.html`: giỏ hàng, số lượng, phí giao hàng và tổng tiền.
- `checkout.html`: thông tin giao nhận, COD hoặc chuyển khoản mô phỏng.
- `orders.html`: lịch sử đơn hàng và hủy đơn demo.
- `admin.html`: quản lý sản phẩm, kho hàng và trạng thái đơn demo.
- `about.html`: câu chuyện và chính sách minh họa.
- `js/`: dữ liệu sản phẩm, tài khoản, thành phần dùng chung và logic từng trang.

## Chạy trên Windows

Mở Terminal tại thư mục dự án rồi chạy:

```powershell
py -m http.server 8000
```

Truy cập `http://localhost:8000`. Có thể dùng tiện ích Live Server của VS Code thay thế.
Web Crypto cần `localhost` hoặc HTTPS để đăng ký và đăng nhập hoạt động; không mở trực tiếp bằng `file://`.

## Giới hạn bản demo

Đăng ký, giỏ hàng, thông tin giao hàng và đơn hàng chỉ lưu trong `localStorage` của trình duyệt. Mật khẩu được băm bằng PBKDF2 trước khi lưu, nhưng tài khoản phía trình duyệt **không phải cơ chế xác thực an toàn** và không được dùng cho cửa hàng thật. Cần máy chủ, cơ sở dữ liệu, xác thực phía máy chủ và HTTPS trước khi triển khai thật.

Trang quản trị demo chỉ cho phép email `admin@mocstudio.vn` (cấu hình trong `js/data.js`). Tạo tài khoản bằng email đó để mở trang quản trị. Đây **không phải** phân quyền an toàn: trình duyệt có thể sửa mã và localStorage, và không có dữ liệu đồng bộ giữa thiết bị. Hãy chuyển danh tính admin và mọi kiểm tra quyền lên máy chủ trước khi triển khai thật.

Thay đổi danh sách sản phẩm, tồn kho và đơn hàng chỉ được ghi vào trình duyệt hiện tại. Trang quản trị cho phép thêm/sửa/xóa/ẩn sản phẩm, theo dõi tồn kho và cập nhật tình trạng đơn, thanh toán, mã vận đơn. Thao tác đặt đơn trừ tồn kho; hủy đơn sẽ hoàn tồn kho một lần.

Thanh toán COD và chuyển khoản chỉ mô phỏng quy trình tạo đơn; QR minh họa không chứa thông tin nhận tiền, không kết nối ngân hàng, VNPay/MoMo và không thu tiền thật. Ảnh sản phẩm, font và biểu tượng được tải từ CDN nên cần Internet.
