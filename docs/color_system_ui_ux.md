# Tài Liệu Hướng Dẫn & Kiến Trúc Hệ Thống Màu Sắc UI/UX (UI/UX Color System Guide)

Tài liệu này tổng hợp các nguyên lý thiết kế màu sắc UI/UX tiêu chuẩn quốc tế (theo Material Design 3, Apple HIG, WCAG 2.1) và quy định cách áp dụng nhất quán vào codebase cho cả **Dark Theme** và **Light Theme**.

---

## 1. Triết Lý Thiết Kế Hệ Thống Màu Sắc (Core Principles)

### 1.1. Nguyên tắc Off-Black & Off-White (Tránh Chói Mắt & Mỏi Mắt)
* **Không dùng Đen thuần (`#000000`) & Trắng thuần (`#ffffff`)**:
  - Đen thuần trên màn hình OLED/LCD tạo độ tương phản gắt với chữ trắng, gây ra hiện tượng **Visual Vibration** (Rung thị giác/Nhòe viền chữ) và làm mất hiệu ứng bóng đổ (shadow).
  - Trắng thuần gắt gây chói mắt (blooming/glare) khi sử dụng lâu trong môi trường tối hoặc đọc trên nền sáng.
* **Quy chuẩn áp dụng**:
  - **Dark Theme**: Nền chính dùng **Charcoal Off-Black (`#0b101f` / `#0f172b`)**, Chữ/Viền dùng **Slate Off-White (`#f1f5f9`)**.
  - **Light Theme**: Nền thẻ/panel dùng **Paper Soft White (`#f8fafc`)**, Chữ chính dùng **Deep Slate (`#0f172b`)**.

### 1.2. Phân Tầng Nổi & Độ Sâu (Elevation & Surface Lightness)
* Trên Dark Theme, bóng đổ mờ (shadow) ít hiệu quả. Thay vào đó, phân tầng giao diện bằng cách **tăng dần độ sáng của các lớp Surface khi chúng nổi lên cao hơn**:
  - **Level 0 (Base Background - `--bg`)**: `#0f172b` (Tối nhất)
  - **Level 1 (Card / Panel - `--surface`)**: `#1d293d` (Sáng hơn 1 bước)
  - **Level 2 (Popovers / Dropdowns - `--surface-card`)**: `#232f45` (Sáng hơn 2 bước)
  - **Level 3 (Modals / Dialogs - `--overlay-bg`)**: Lớp phủ mờ trong suốt `rgba(0, 0, 0, 0.55)`

### 1.3. Quy Tắc Phối Màu 60 - 30 - 10
* **60% (Base Neutrals)**: Nền ứng dụng & nền các phân vùng lớn.
* **30% (Secondary Neutrals)**: Nền thẻ, ô nhập liệu (`--bg-input`), đường viền (`--border`), nhãn phụ.
* **10% (Functional & Accent Colors)**: Màu thương hiệu (`--primary`), trạng thái thành công (`--success`), cảnh báo (`--warning`), nguy hiểm (`--error`).

### 1.4. Lớp Phủ Màu Trong Suốt (Translucent Alpha Tints)
* Không dùng các khối màu đặc rực rỡ (Solid colors) cho các thẻ cảnh báo/badge.
* Sử dụng **Lớp phủ trong suốt Alpha (8% - 15% opacity)** kết hợp viền mờ 25%-35%:
  - **Error Tint**: `rgba(255, 78, 99, 0.15)` nền + `rgba(255, 78, 99, 0.3)` viền.
  - **Warning Tint**: `rgba(255, 171, 0, 0.08)` nền + `rgba(255, 171, 0, 0.3)` viền.
  - **Success Tint**: `rgba(24, 220, 122, 0.15)` nền + `rgba(24, 220, 122, 0.3)` viền.

---

## 2. Bảng Ma Trận Design Tokens (Color Tokens Matrix)

| Token Name | Dark Theme Value | Light Theme Value | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| `--white` | `#f1f5f9` (Soft Off-White) | `#f8fafc` (Paper Soft White) | Nền thẻ nổi, biểu tượng, text nổi bật |
| `--black` | `#0b101f` (Rich Charcoal) | `#0f172b` (Deep Slate) | Nền tối sâu, text/icon đậm trong light mode |
| `--bg` | `#0f172b` | `#f1f5f9` | Nền chính toàn ứng dụng |
| `--surface` | `#1d293d` | `#f8fafc` | Nền các thẻ Card, Panel, Header |
| `--text` | `#f7f9fa` | `#0f172b` | Văn bản chính (Primary Body Text) |
| `--text-muted` | `#8496b0` | `#45556c` | Văn bản phụ, nhãn thông tin phụ |
| `--border` | `#314158` | `#d5dde8` | Đường viền các thẻ, phân cách |
| `--primary` | `#175ddc` | `#175ddc` | Nút bấm chính, hành động chủ đạo |
| `--primary-accent` | `#65abff` | `#175ddc` | Điểm nhấn chữ, icon active |
| `--error` | `#ff4e63` | `#c10007` / `#dc2626` | Trạng thái lỗi, nút xóa, hành động nguy hiểm |
| `--success` | `#18dc7a` | `#008236` / `#059669` | Trạng thái thành công, khớp dữ liệu |
| `--warning` | `#f59e0b` | `#d97706` | Cảnh báo chú ý, mật khẩu trung bình |
| `--warning-amber` | `#ffab00` | `#d97706` | Banner cảnh báo quan trọng (Amber) |
| `--strength-very-weak`| `#ef4444` | `#dc2626` | Độ mạnh mật khẩu: Rất yếu |
| `--strength-weak` | `#f97316` | `#ea580c` | Độ mạnh mật khẩu: Yếu |
| `--strength-medium` | `#f59e0b` | `#d97706` | Độ mạnh mật khẩu: Trung bình |
| `--strength-strong` | `#3b82f6` | `#2563eb` | Độ mạnh mật khẩu: Mạnh |
| `--strength-very-strong`| `#10b981` | `#059669` | Độ mạnh mật khẩu: Rất mạnh |

---

## 3. Quy Định Đóng Băng & Kiểm Soát Mã Nguồn (Linter Rules)

1. **Rule `css-no-local-color-var`**: Cấm định nghĩa biến màu sắc địa phương bên ngoài `variables.css`.
2. **Rule `css-no-hardcoded-color`**: Cấm viết trực tiếp mã màu Hex (`#...`) hoặc `rgba(...)`/`rgb(...)` trong bất kỳ thuộc tính CSS nào (`color`, `background`, `border`, `fill`, `stroke`, `box-shadow`...) bên ngoài `variables.css`.
3. **Mọi thay đổi màu sắc**: Bắt buộc thêm/sửa tại [`variables.css`](file:///c:/Users/kien.hm/Desktop/totp%20generate/packages/ui/src/styles/tokens/variables.css) cho cả khối `:root` (Dark Theme) và khối `body.light-theme` (Light Theme).

---

## 4. Kế Hoạch Áp Dụng Triệt Để Vấn Đề UI/UX Màu Sắc

- [x] Tạo tài liệu kiến trúc UI/UX Màu sắc (`docs/color_system_ui_ux.md`).
- [x] Áp dụng dải màu Off-White (`#f1f5f9` / `#f8fafc`) và Off-Black (`#0b101f` / `#0f172b`) vào `variables.css`.
- [x] Đã quét & chuẩn hóa 100% tất cả 23 file CSS component thông qua custom linter `css-no-hardcoded-color`.
- [x] Kiểm tra lại 100% với `bun run lint` và `bun run build`.

---

> *Tài liệu này là chuẩn mực bắt buộc cho việc xây dựng và phát triển giao diện người dùng của dự án.*
