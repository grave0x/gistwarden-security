# 🚀 Self-Hosted Provider Test API (GistWarden - Native Bun.serve)

Backend API tham khảo hoàn chỉnh dành cho tính năng **Self-Hosted Server Provider** của GistWarden, được xây dựng dựa trên API Native high-performance của **Bun** (`Bun.serve()`, `Bun.file()`, `Bun.write()`).

## 🛠️ Hướng Dẫn Chạy

```bash
# Chạy ở chế độ Dev (Auto Reload)
bun dev

# Hoặc chạy trực tiếp
bun run server.ts
```

Server sẽ tự động lắng nghe tại: `http://localhost:3000`

---

## 📁 Cấu Trúc Lưu Trữ Dữ Liệu (`.json`)

Khi server chạy, các thư mục và file `.json` sẽ tự động được khởi tạo tại `web_test_selfhost/data/`:

* `data/users.json`: Lưu thông tin tài khoản người dùng và danh sách Access Tokens đang hoạt động.
* `data/vaults/{username}.json`: Lưu dữ liệu két mã hóa (`salt`, `iv`, `ciphertext`) riêng biệt của từng `username`.

---

## 📡 Các Endpoints Đã Hỗ Trợ

| Method | Endpoint | Yêu cầu Authentication | Mục đích |
| :---: | :--- | :---: | :--- |
| `POST` | `/auth/register` | ❌ Không | Đăng ký tài khoản server mới |
| `POST` | `/auth/login` | ❌ Không | Đăng nhập lấy Bearer Access Token |
| `GET` | `/user` | 🔑 Bearer Token | Kiểm tra Token & Lấy thông tin user |
| `GET` | `/vault` | 🔑 Bearer Token | Đọc Vault (Trả về `404` nếu là tài khoản chưa có két) |
| `POST` | `/vault` | 🔑 Bearer Token | Lưu / Cập nhật dữ liệu mã hóa Két sắt |
| `DELETE` | `/vault` | 🔑 Bearer Token | Xóa Két sắt của người dùng |

---

## 🧪 Kiểm Tra Nhanh Bằng cURL

```bash
# 1. Đăng ký tài khoản mới
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "password123"}'

# 2. Đăng nhập
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "password123"}'

# 3. Lấy Vault (lần đầu sẽ trả về 404 Not Found)
curl -X GET http://localhost:3000/vault \
  -H "Authorization: Bearer <TOKEN_TRẢ_VỀ_TỪ_LOGIN>"
```
