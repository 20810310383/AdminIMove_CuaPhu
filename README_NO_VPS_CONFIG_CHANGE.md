# TH79 iMove Admin — Direct Backend / Không đổi cấu hình VPS

Bản này được viết trên nền Admin(3) + các chỉnh sửa UI hiện tại.

## Mục tiêu
- Không yêu cầu sửa Nginx.
- Không yêu cầu tạo proxy `/api` hoặc `/core-api` trên VPS.
- Không yêu cầu Admin Gateway port 5060 để đăng nhập và gọi API quản trị.
- Frontend gọi trực tiếp URL trong `VITE_CORE_BACKEND_URL`.
- Không có URL Core Backend fallback trong source; mỗi môi trường phải đặt key này trong `.env`.

## Các file thay đổi để bỏ phụ thuộc proxy VPS
- `src/apiRuntime.js`
- `src/coreApi.js`
- `src/adminApi.js`
- `src/App.jsx`
- `src/TrustSafetyPage.jsx`
- `src/SettingsPage.jsx`

## Backend yêu cầu
Backend phải có CORS cho domain Admin Web tương ứng và đã mount Admin Console routes `/api/admin-access/*`, `/api/bootstrap`, `/api/data/*`, `/api/admin-support/*`.

## Deploy
Giữ nguyên cấu hình VPS hiện tại. Chỉ build lại Admin:

```bash
npm install
npm run build
```

Sau đó thay `dist` cũ bằng `dist` mới theo đúng quy trình bạn đang dùng hiện tại.

## Kiểm tra trên Chrome DevTools
Sau deploy, request đăng nhập phải đi tới:

`${VITE_CORE_BACKEND_URL}/api/admin-auth/login`

Không còn request bắt buộc tới:

`/api/core-connection`

hoặc `/core-api/*`.
