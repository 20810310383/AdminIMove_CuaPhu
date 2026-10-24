# TH79 iMove Admin – Quản lý điểm tài xế V2

## Vấn đề xác nhận từ ảnh của bạn
Menu vẫn hiển thị **Điểm & nạp quỹ**, nút **Tạo giao dịch điểm** vẫn ở khu vực QR. Điều này chứng tỏ source đang deploy CHƯA chứa thay đổi route/menu. Chỉ giải nén ZIP không cập nhật `App.jsx`.

## Cài đặt (bắt buộc làm một lần)
Giải nén *nội dung* ZIP ngay vào thư mục `AdminIMove_CuaPhu` – nơi chứa `package.json` – không tạo thêm thư mục lồng nhau.

**Cách đơn giản nhất:** chạy `CAI_DAT_QUAN_LY_DIEM_V2.cmd` (nhấp đúp trên Windows). Script sẽ kiểm tra, sao lưu rồi sửa `src/App.jsx`, `src/DriverPointTopupsPage.jsx`, `src/main.jsx` và nếu cần `src/DriverManagement.jsx`. Sau đó in kết quả kiểm thử và build.

**Hoặc PowerShell:**
```
cd "C:\Users\PC\Documents\PROJECT TH79\Project imove\SuperLayout\AdminIMove_CuaPhu"
node scripts/INSTALL_DRIVER_POINTS_CENTER_V2.cjs --check
node scripts/INSTALL_DRIVER_POINTS_CENTER_V2.cjs
node scripts/VERIFY_POINTS_CENTER_V2.cjs
npm run build
```

Trước khi deploy, chạy:
```
Select-String -Path .\src\App.jsx -Pattern 'driver-points-center','Nạp quỹ & biên lai'
```
Phải thấy cả menu và route của trang mới. Nếu lệnh không tìm thấy, mã source chưa được sửa, tuyệt đối chưa báo thành công.

## Cập nhật Vercel – bắt buộc
- Nếu Admin dùng GitHub → Vercel: commit/push **các file được script sửa** lên đúng branch Vercel đang deploy.
- Kiểm tra Vercel → Project → Settings → Build and Deployment → Root Directory trỏ đúng `AdminIMove_CuaPhu` (hoặc nơi chứa package.json).
- Redeploy **Production** và kiểm tra build log đúng commit.
- Mở trang Admin, Ctrl+Shift+R.

## Kết quả kỳ vọng
Trong nhóm **KINH DOANH**, hiển thị hai menu riêng:
- **Quản lý điểm tài xế** → bảng tài xế, số dư, Cộng/Trừ/Lịch sử, cửa sổ điều chỉnh điểm có xác nhận.
- **Nạp quỹ & biên lai** → cấu hình nhận tiền, QR, yêu cầu nạp và duyệt biên lai; không còn nút Tạo giao dịch điểm.

Trang mới hiển thị nhãn **DRIVER POINTS CENTER V2** để dễ xác định bạn đang chạy đúng phiên bản.

## Bảo mật
Thao tác điểm dùng Backend `/api/v72/admin/driver-experience/point-adjustments`, có idempotency key và audit log. Không ghi trực tiếp MongoDB từ Admin. Backend bắt buộc xác thực quyền phù hợp và kiểm soát số dư nguyên tử; không dựa duy nhất vào số dư dự kiến phía giao diện.

## Giới hạn
Patch được thử với source Admin đi kèm lịch sử dự án, không có quyền sửa trực tiếp source trên máy/Vercel của bạn. Nếu `--check` báo cấu trúc khác, hãy cung cấp `src/App.jsx`, `src/DriverPointTopupsPage.jsx`, `src/main.jsx` mới nhất để ghép chuẩn, không nên chép đè App.jsx từ bản cũ. Build thực tế phải chạy trên máy bạn.
