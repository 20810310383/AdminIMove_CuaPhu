# TH79 iMove Admin — Trang Quản lý điểm tài xế và sửa icon QR

## Bản vá chỉ gồm file thay đổi

- `src/DriverPointsManagementPage.jsx` — trang Quản lý điểm tài xế mới, dùng API v72 hiện có
- `src/driver-points-management.css` — layout/kiểu hiển thị trang mới
- `src/driver-points-qr-fix.css` — giới hạn kích thước PNG tiêu đề QR còn 24 px, giữ QR thật tối đa 240 px
- `scripts/INSTALL_DRIVER_POINTS_CENTER.cjs` — ghép menu/route, dọn giao dịch điểm khỏi trang Nạp quỹ và danh sách tài xế cũ
- `scripts/VERIFY_DRIVER_POINTS_CENTER.cjs` — kiểm tra cấu trúc sau cài

**Không bao gồm nguyên source. Không sửa Backend/MongoDB.**

## Cách cài trên Windows

1. Sao lưu mã nguồn Admin hiện tại.
2. Giải nén ZIP vào **thư mục gốc AdminIMove_CuaPhu** (nơi có `src`, `scripts`, `package.json`). Không chép cả thư mục `src` của bản cũ lên dự án.
3. Mở PowerShell tại `AdminIMove_CuaPhu`:

```powershell
node scripts/INSTALL_DRIVER_POINTS_CENTER.cjs --check
node scripts/INSTALL_DRIVER_POINTS_CENTER.cjs
node scripts/VERIFY_DRIVER_POINTS_CENTER.cjs
npm run build
```

Script tự sao lưu trước khi chỉnh mỗi file (`.bak-<timestamp>`), và an toàn nếu chạy nhiều lần. Nếu cấu trúc Admin khác với bản kiểm thử, nó **dừng trước khi ghi file**.

## Kết quả giao diện

- Menu Kinh doanh → **Quản lý điểm tài xế**: tra cứu tài xế đã duyệt, xem số dư, cộng điểm, trừ điểm, lịch sử điều chỉnh thủ công.
- Menu Kinh doanh → **Nạp quỹ & biên lai**: duyệt nạp điểm, đối chiếu chuyển khoản, cấu hình QR, các yêu cầu nạp quỹ Driver/Merchant.
- Các nút trừ/cộng và lịch sử cũ trong danh sách Tài xế/KYC được gỡ nếu đã cài bản vá trước, để tập trung tại trang mới.
- Icon PNG tiêu đề của phần QR nhận quỹ **24×24 px**; mã QR thật vẫn ở cỡ hiển thị quét được.

## Lưu ý nghiệp vụ và bảo mật

- API hiện có: GET `/api/v72/admin/driver-experience/point-accounts`, GET/POST `/api/v72/admin/driver-experience/point-adjustments`.
- Form chỉ gửi điểm nguyên 1..1.000.000, yêu cầu lý do ≥3 ký tự, xác nhận thao tác, kiểm tra lại số dư trước khi trừ và gửi `Idempotency-Key`.
- Frontend không tự thay đổi MongoDB; Backend là nguồn dữ liệu quyết định. Cần bảo đảm Backend được cập nhật đầy đủ và kiểm tra chống âm điểm nguyên tử nếu có nhiều Admin thao tác đồng thời.
- Trang vẫn sử dụng quyền `drivers.view` giống menu Điểm & nạp quỹ hiện tại; nếu muốn hạn chế riêng quyền chỉnh điểm, cần bổ sung RBAC **ở Backend**, không chỉ ẩn nút trên Admin.
- Lịch sử này chỉ liệt kê `ADMIN_ADJUSTMENT`, không bao gồm phí tự động, thưởng, nạp quỹ từ ngân hàng.
- Nếu đã cài bản vá `APPLY_DRIVER_POINT_ROW_ACTIONS.cjs` trước, **không chạy lại script cũ** sau khi cài bản mới.

## Kiểm thử sau cập nhật

1. Mở Admin → Quản lý điểm tài xế → tìm một tài xế.
2. Xem số dư, mở Lịch sử.
3. Thử cộng 1 điểm vào tài khoản thử nghiệm, tải lại và kiểm tra lịch sử.
4. Thử trừ 1 điểm, kiểm tra số dư, lý do và nhật ký audit.
5. Thử trừ hơn số dư; giao diện phải từ chối và Backend cũng phải từ chối.
6. Mở Nạp quỹ & biên lai: icon tiêu đề đúng 24 px; QR quét được; duyệt biên lai vẫn hoạt động.

Chưa nghiệm thu giao dịch thật trên VPS; build Vite phải được chạy tại máy bạn với dependencies đầy đủ.
