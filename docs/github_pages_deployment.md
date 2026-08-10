# Hướng dẫn Triển khai Gistwarden Web Vault trên GitHub Pages

Tài liệu này hướng dẫn cách cấu hình, xây dựng và tự động phát hành phiên bản
**Gistwarden Web Vault** lên GitHub Pages.

---

## 1. Tổng quan Kiến trúc Web Vault

Gistwarden Web Vault chạy theo mô hình **Zero-Knowledge Single Page Application
(SPA)** trực tiếp trên trình duyệt web:

- **Client-Side WASM Engine:** Toàn bộ thuật toán mã hóa (AES-256-GCM, Argon2id,
  SHA-256/SHA-1) và công cụ hợp nhất dữ liệu Vault (Vault Merge Engine) sử dụng
  nhân WebAssembly bảo mật được mã hóa base64 và nhúng trực tiếp trong gói
  `hash-wasm`.
- **Lưu trữ Offline-First:** Dữ liệu Vault đã mã hóa được lưu trữ an toàn trong
  `localStorage` / `IndexedDB` của trình duyệt.
- **Đồng bộ mã hóa (Encrypted Sync):** Cho phép đồng bộ hai chiều với GitHub
  Gist cá nhân thông qua GitHub Personal Access Token (PAT).

---

## 2. Quy trình Tự động hóa CI/CD (GitHub Actions)

Repository đã được tích hợp sẵn GitHub Actions Workflow tại tệp
[`.github/workflows/deploy-web.yml`](../.github/workflows/deploy-web.yml).

### Các bước hoạt động của Pipeline:

1. **Trigger:** Tự động kích hoạt khi push lên nhánh `main` hoặc kích hoạt thủ
   công qua tab **Actions** -> chọn **Deploy Web Vault to GitHub Pages**.
2. **Environment Setup:** Cài đặt môi trường Bun runtime (`oven-sh/setup-bun`).
3. **Build Web App:** Chạy `bun run build:web` để đóng gói ứng dụng web, giao
   diện SolidJS UI (`@gistwarden/ui`) vào thư mục `dist/web/`.
4. **Publish Pages:** Tải phần dư `dist/web/` lên hạ tầng GitHub Pages.

---

## 3. Hướng dẫn Kích hoạt GitHub Pages trên Repository

Để xuất bản ứng dụng từ nhánh `gh-pages` (phiên bản 1-commit không lưu lịch sử),
hãy cấu hình trên GitHub:

1. Truy cập vào Repository của bạn trên GitHub.
2. Chuyển sang tab **Settings** -> mục **Pages** ở thanh bên trái.
3. Tại phần **Build and deployment**:
   - **Source:** Chọn **Deploy from a branch**.
   - **Branch:** Chọn nhánh **`gh-pages`** và thư mục **`/ (root)`**.
4. Nhấn **Save**.

Sau khi lưu cấu hình, mỗi khi bạn push code lên nhánh `main`, pipeline sẽ tự
động đóng gói ứng dụng, force-push sang nhánh `gh-pages` và cập nhật trang web
tại địa chỉ:

```text
https://<username>.github.io/<repository-name>/
```

---

## 4. Chạy và Kiểm thử Web Vault ở Môi trường Cục bộ (Local)

Bạn có thể chạy thử phiên bản Web Vault ngay trên máy local bằng các lệnh sau:

```bash
# 1. Đóng gói ứng dụng Web độc lập vào dist/web/
bun run build:web

# 2. Khởi chạy HTTP Server để trải nghiệm Web Vault
bun run serve
```

Ứng dụng Web sẽ sẵn sàng tại `http://localhost:3000`.

---

## 5. Cấu hình CORS & Gist Sync trên Web

Khi chạy ứng dụng trên GitHub Pages, tính năng Gist Sync thực hiện các yêu cầu
HTTP API trực tiếp tới `https://api.github.com/gists`:

- **Personal Access Token (PAT):** Người dùng chỉ cần nhập PAT có quyền `gist`
  trong phần Cài đặt ứng dụng.
- **An toàn bảo mật:** PAT và khóa Master Password chỉ được lưu trữ mã hóa trong
  bộ nhớ trình duyệt local của người dùng, không bao giờ được gửi tới bất kỳ máy
  chủ trung gian nào.
