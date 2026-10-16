# TH79 iMove Admin Web

`AdminIMove` chỉ là ứng dụng React/Vite. Toàn bộ API quản trị và kết nối MongoDB
được chạy trong `BackendImove`.

## Kiến trúc

```text
Browser → AdminIMove (Vite/static files) → BackendImove /api/* → MongoDB
```

Không có Admin Gateway, port 5060 hay MongoDB URI trong dự án Admin Web.

## Chạy local

1. Khởi động `BackendImove` trên port 5050 và cấu hình MongoDB tại dự án đó.
2. Tạo `AdminIMove/.env` từ `.env.example` và đặt `VITE_CORE_BACKEND_URL`.
3. Chạy:

```bash
npm install
npm run dev
```

## Deploy

Chỉ build và publish thư mục `dist` của Admin Web:

```bash
npm install
npm run build
```

Trên Backend VPS, `CORS_ORIGINS` phải bao gồm domain Admin Web. Ví dụ:

```env
CORS_ORIGINS=https://admin.example.com
```

Không tạo biến `VITE_MONGODB_URI`, và không đưa bất kỳ MongoDB URI nào vào
`AdminIMove/.env`.
