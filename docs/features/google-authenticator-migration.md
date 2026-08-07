# Tài Liệu Mô Tả Chi Tiết: Công Cụ Giải Mã Google Authenticator (Google Authenticator Migration Decoder Tool)

Tài liệu này mô tả chi tiết kiến trúc, thuật toán giải mã Protobuf, quy trình ghép nối tài khoản, cơ chế đảm bảo tính toàn vẹn dữ liệu và giao diện người dùng của **Công cụ Giải mã Google Authenticator** trong ứng dụng Gistwarden.

---

## 1. Tổng Quan (Overview)

Ứng dụng Google Authenticator cho phép người dùng xuất toàn bộ danh sách mã 2FA (TOTP) dưới dạng mã QR hoặc URI có dạng:
`otpauth-migration://offline?data=<base64_encoded_protobuf>`

Công cụ **Google Authenticator Migration Decoder** trong Gistwarden giải quyết vấn đề chuyển đổi dữ liệu TOTP hàng loạt bằng cách:
1. **Giải mã nhị phân Protobuf thuần TypeScript (Zero-dependency)** không cần thư viện ngoài.
2. **Hỗ trợ Quét ảnh QR & Nhập chuỗi URI** thời gian thực.
3. **Bộ khớp dữ liệu tự động thông minh (Batch Auto-Matcher)** tìm kiếm các tài khoản Két sắt chưa cài mã 2FA để đề xuất ghép nối.
4. **Cơ chế chống trùng lặp tài khoản (Unique Target Selection)** đảm bảo trong một đợt bóc tách, 2 mã TOTP khác nhau không bao giờ bị gán nhầm vào cùng 1 tài khoản Két sắt.
5. **Đồng bộ trạng thái tức thì (Instant Store Reconciliation)** cập nhật danh sách tài khoản ngay lên màn hình Két sắt ngay khi lưu mà không cần thực hiện Sync thủ công.
6. **Môi trường vận hành Firefox Popout Window**: Cho phép mở cửa sổ độc lập mượt mà khi chạy trên trình duyệt Firefox.

---

## 2. Kiến Trúc Phân Lớp (Layered Architecture)

Được xây dựng theo đúng mô hình **Decoupled Orchestrator Architecture**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │ Presentation Layer (SolidJS UI)                             │
 │ ├─ GoogleMigrationPage.tsx (Chế độ xem & Bóc tách batch)   │
 │ ├─ VaultOptions.tsx (Nơi chứa menu công cụ trong Settings)  │
 │ └─ google-migration.css & select.css (Nested CSS Styles)    │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (gọi Use-Case)
 ┌──────────────────────────────▼──────────────────────────────┐
 │ Orchestrator Layer                                          │
 │ └─ batchImportGoogleMigrationAccountsUseCase()              │
 └──────────────────────────────┬──────────────────────────────┘
                                │ (dữ liệu thuần Domain)
 ┌──────────────────────────────▼──────────────────────────────┐
 │ Domain Layer                                                │
 │ ├─ google-migration-parser.ts (Giải mã Protobuf & Base64)   │
 │ ├─ google-migration-matcher.ts (Thuật toán ghép nối)       │
 │ └─ safeDecodeQr() (Giải mã mã QR từ file hình ảnh)          │
 └─────────────────────────────────────────────────────────────┘
```

---

## 3. Thuật Toán & Quy Trình Xử Lý Chi Tiết

### 3.1. Giải Mã Nhị Phân Protobuf (`google-migration-parser.ts`)
Chuỗi dữ liệu `data` trong `otpauth-migration://` được mã hóa Base64 chứa các trường Protobuf sau:
- **Field 1 (`Payload.otp_parameters`)**: Mảng các tài khoản TOTP.
  - Subfield 1: Secret Key (Binary HMAC Key).
  - Subfield 2: Account Name / Email.
  - Subfield 3: Issuer (Tên dịch vụ, ví dụ: Google, Sophos, GitHub).
  - Subfield 4: Algorithm (SHA1, SHA256, SHA512).
  - Subfield 5: Digits (6 hoặc 8 chữ số).
  - Subfield 6: Type (TOTP = 2).

Hàm `parseGoogleMigrationUri` thực hiện bóc tách Varint & Length-delimited fields, chuyển đổi Secret nhị phân sang định dạng **Base32** chuẩn và dựng lại URL dạng `otpauth://totp/...`.

### 3.2. Thuật Toán Khớp Tự Động & Chống Trùng Lặp (`google-migration-matcher.ts`)
Khi bóc tách danh sách tài khoản từ Google Authenticator:
1. **Lọc tài khoản Két sắt khả dụng**: Chỉ xem xét các tài khoản `LoginVaultItem` **chưa được cài đặt mã TOTP** (`!item.login?.totp?.trim()`).
2. **Khớp theo Issuer & Name**:
   - Bước 1: So sánh `issuer` của Google OTP với `name` hoặc `username` của Vault Item.
   - Bước 2: So sánh `name` (Email) với `username` hoặc `name` của Vault Item.
3. **Đảm bảo tính duy nhất (Unique Target Item Filter)**:
   - Sử dụng tập hợp `usedTargetItemIds` theo dõi các item đã được ghép nối trong batch.
   - Đảm bảo trong 1 đợt bóc tách, 2 tài khoản Google OTP không bao giờ tự động ghép trùng vào 1 tài khoản Két sắt.

### 3.3. Quy Tắc Trạng Thái Mặc Định & Ràng Buộc Nút Lưu
- **Trạng thái mặc định**: Tất cả các tài khoản sau khi giải mã ra đều mang action **`skip` (Bỏ qua)** để đảm bảo an toàn, tránh người dùng bấm lưu nhầm.
- **Thứ tự tùy chọn Action (Radio Options)**:
  1. 🔘 **Bỏ qua (Skip)** *(Mặc định)*
  2. 🔘 **Tạo tài khoản mới (Create new item)**
  3. 🔘 **Ghép vào item (Link to existing item)**
- **Ràng buộc Nút Lưu**: Nút Lưu hàng loạt bị **vô hiệu hóa (disabled)** khi số lượng tài khoản cần xử lý bằng `0` (tất cả đều ở trạng thái *Bỏ qua*). Nút bấm chỉ sáng lên khi người dùng chọn ít nhất 1 tài khoản sang *Tạo mới* hoặc *Ghép vào item*.

### 3.4. Đồng Bộ Bộ Nhớ Tức Thì (`applyVaultPayloadToStore`)
Sau khi `batchImportGoogleMigrationAccountsUseCase` thực thi lưu và đồng bộ thành công xuống Gist:
- Gọi trực tiếp `applyVaultPayloadToStore(res.value)` để cập nhật dữ liệu mới vào SolidJS store (`accountStore`).
- Chuyển hướng người dùng về màn hình `View.Vault` với danh sách tài khoản được cập nhật tức thì 100% mà không cần người dùng bấm Sync thủ công.

---

## 4. Giao Diện Người Dùng & Trải Nghiệm (UI/UX Design)

### 4.1. Vị Trí Menu Trong `Vault Options`
Tính năng được đặt ở vị trí duy nhất chuẩn mực trong **`Settings ➔ Vault Options`** (nằm song song giữa mục `Import Accounts` và `Export Accounts`).

Màn hình `Vault Options` được chia thành **3 nhóm card riêng biệt** có tiêu đề nhóm (Section Header) viết bằng **100% Nested CSS**:
- **`ĐỒNG BỘ & NHẬP XUẤT DỮ LIỆU`**: Đồng bộ thủ công, Nhập dữ liệu, Công cụ Giải mã Google Authenticator, Xuất dữ liệu.
- **`QUẢN LÝ DỮ LIỆU`**: Quản lý thư mục, Thùng rác.
- **`THAO TÁC NGUY HIỂM`**: Xóa sạch Két sắt.

### 4.2. Hiển Thị Mã TOTP & Thời Gian Đếm Ngược
- Mỗi thẻ tài khoản bóc tách được hiển thị mã TOTP đếm ngược thời gian thực y hệt màn hình Detail Két sắt.
- Vòng tròn SVG Progress `.totp-timer` chứa thẻ `<span class="timer-text">{totpRemaining()}</span>` hiển thị chính xác số giây còn lại (30s ➔ 1s) ở tâm vòng tròn.
- Chuỗi Raw URI được hiển thị gọn gàng trên 1 dòng duy nhất với thuộc tính `text-overflow: ellipsis (...)` kèm nút sao chép nhanh.

### 4.3. Ô Chọn Tìm Kiếm Drodown (Searchable Select Overlay)
- Khung tìm kiếm ô Select (`.select-search-wrapper`) được thiết lập `position: sticky; top: -4px; margin: -4px -4px 4px -4px; z-index: 10;` che phủ kín 100% cạnh trên và 2 mép bên của menu dropdown.
- Loại bỏ hoàn toàn hiện tượng lọt chữ hay trồi nội dung phía dưới khi người dùng cuộn danh sách tùy chọn.

---

## 5. Danh Sách File & Trách Nhiệm (File Mapping)

| Đường Dẫn File | Vai Trò & Trách Nhiệm |
| :--- | :--- |
| `packages/domain/src/google-migration-parser.ts` | Bóc tách nhị phân Protobuf, giải mã Base64/Base32 và dựng URL `otpauth://`. |
| `packages/domain/src/google-migration-matcher.ts` | Tìm kiếm & ghép nối tự động tài khoản Vault chưa có TOTP (chống trùng lặp batch). |
| `packages/orchestrator/src/vault-mutation-usecases.ts` | Chứa `batchImportGoogleMigrationAccountsUseCase` thực thi lưu batch và đồng bộ Gist. |
| `packages/ui/src/features/sync/GoogleMigrationPage.tsx` | Component giao diện công cụ giải mã Google Authenticator. |
| `packages/ui/src/features/vault/VaultOptions.tsx` | Màn hình Tùy chọn Két sắt chứa 3 nhóm card có Section Headers. |
| `packages/ui/src/components/ui/Select.tsx` | Nâng cấp ô chọn Select hỗ trợ tiện ích tìm kiếm (`searchable={true}`). |
| `packages/ui/src/styles/components/google-migration.css` | Stylesheet 100% Nested CSS cho công cụ giải mã Google Authenticator. |
| `packages/ui/src/styles/components/select.css` | Stylesheet Nested CSS cho dropdown select và khung tìm kiếm sticky. |
| `packages/ui/src/styles/components/settings.css` | Stylesheet Nested CSS chứa `.setting-group-title` cho các nhóm card. |
| `tests/google_migration_test.ts` | Tập hợp bộ kiểm thử tự động (Unit Tests) cho bộ giải mã Protobuf & Matcher. |

---

## 6. Kiểm Thử & Xác Nhận (Testing & Verification)

### Automated Unit Tests
Chạy lệnh kiểm thử đơn vị cho thuật toán parser & matcher:
```bash
bun test tests/google_migration_test.ts
```
*Kết quả*: **100% Passed (16 assertions)**.

### Build Verification
Chạy lệnh kiểm tra typecheck và đóng gói ứng dụng:
```bash
bun run build
```
*Kết quả*: **TypeCheck & Tests passed, Bundling & ZIP packaging successful (0 errors)**.
