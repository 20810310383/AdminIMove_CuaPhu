# TH79 iMove Admin — Sửa menu chưa cập nhật / Quản lý điểm tài xế

## Vì sao menu cũ vẫn hiện?

ZIP cũ có trang mới `DriverPointsManagementPage.jsx`, nhưng chỉ chép file vào `src/` **không tạo menu**. Muốn dùng trang mới phải ghép menu và route vào `src/App.jsx`. Nếu mã nguồn đã ghép nhưng trang Vercel vẫn cũ, cần build và redeploy phiên bản đó. Ảnh trình duyệt không thể xác nhận nguyên nhân nào; kiểm tra mã nguồn và thời điểm deploy sẽ phân biệt.

## Cài đặt an toàn bằng một lần chạy

1. Sao lưu project Admin. Giải nén toàn bộ nội dung ZIP này vào **thư mục gốc AdminIMove_CuaPhu**, cùng nơi có `package.json`, ghi đè 3 file giao diện mới và script cũ nếu có. **Không giải nén thêm một cấp thư mục**.
2. Nhấp đúp **`CAI_TRANG_QUAN_LY_DIEM.cmd`**, hoặc chạy trong PowerShell:

```powershell
cd "C:\Users\PC\Documents\PROJECT TH79\Project imove\SuperLayout\AdminIMove_CuaPhu"
node scripts/INSTALL_DRIVER_POINTS_CENTER.cjs --check
node scripts/INSTALL_DRIVER_POINTS_CENTER.cjs
node scripts/VERIFY_DRIVER_POINTS_CENTER.cjs
node scripts/DIAGNOSE_DRIVER_POINTS_CENTER.cjs
npm run build
```

3. Khi cả kiểm tra lẫn build thành công, cập nhật website Admin production bằng Git push / deploy dự án Vercel đã trỏ đúng **Root Directory**. Nếu Git không commit các thay đổi ở `src/App.jsx`, bản production vẫn giữ menu cũ.
4. Kiểm tra deployments trong Vercel, mở deployment **mới nhất** rồi nhấn `Ctrl+Shift+R`.

## Sau cập nhật

- Kinh doanh → **Quản lý điểm tài xế**: cộng/trừ, xem số dư, xem lịch sử theo tài xế.
- Kinh doanh → **Nạp quỹ & biên lai**: yêu cầu nạp tiền, biên lai và QR ngân hàng.

## Chẩn đoán nhanh

```powershell
Select-String -Path '.\src\App.jsx' -Pattern 'driver-points-center'
```

- **Không thấy**: script chưa chạy / chạy sai thư mục / dừng do cấu trúc khác.
- **Có nhưng website vẫn cũ**: xem `npm run build`, bản commit trên Vercel, Root Directory và cache trình duyệt.

Script tạo các bản sao lưu `*.bak-<thời gian>` cho file bị sửa, không tự sửa Backend, không cập nhật MongoDB.

**An toàn:** Trang mới dùng endpoint Backend hiện có. Quyền `drivers.view` đang điều khiển cả xem và chỉnh điểm trên giao diện; để bảo vệ tài chính cần kiểm tra quyền riêng cho chỉnh điểm ở Backend, trừ điểm nguyên tử và audit log. Không thử giao dịch trên tài khoản tài xế đang hoạt động trước khi đối chiếu API staging.
