# Kiến trúc Phân tách Màn hình Lock và Login / Setup trong Gistwarden

Tài liệu này mô tả chi tiết kiến trúc, mô hình trạng thái và phân định trách nhiệm giữa hai màn hình quan trọng trong hệ thống: **Màn hình Khóa / Mở khóa (`LockScreen`)** và **Màn hình Đăng nhập / Thiết lập (`Login`)**.

---

## 1. Tổng quan & Lý do phân tách (Rationale)

Trong các ứng dụng quản lý mật khẩu an toàn chuẩn ngành (như *Bitwarden*, *1Password*, *KeePass*), có hai khái niệm hoàn toàn tách biệt:
1. **Trạng thái Xác thực Tài khoản (Account/Provider Authentication)**: Người dùng có phiên đăng nhập hợp lệ với nhà cung cấp lưu trữ hay chưa (GitHub Token, Self-Hosted Session, hoặc Local Storage).
2. **Trạng thái Mã hóa của Kho (Vault Encryption & Session State)**: Dữ liệu kho đã được giải mã vào bộ nhớ đệm (In-Memory Key) để sử dụng hay đang bị khóa an toàn (Encrypted/Locked).

### Vấn đề khi gộp chung một màn hình:
* **Trải nghiệm người dùng (UX) bị phân tán:** 99% thời gian sử dụng hằng ngày của người dùng là mở khóa vault (Unlock). Nếu gộp chung, màn hình mở khóa phải chứa cả dropdown chọn nhà cung cấp, form nhập Server URL, OAuth callback, và các hướng dẫn cài đặt ban đầu.
* **Xung đột trách nhiệm (Violation of Single Responsibility Principle):** Một component duy nhất phải quản lý hơn 10 loại signal khác nhau từ cả tầng network/provider lẫn tầng crypto key derivation.
* **Nguy cơ lỗi bảo mật & hồi quy (Regression Risks):** Mọi chỉnh sửa cho luồng Provider (OAuth, Self-hosted) dễ làm ảnh hưởng đến cơ chế tự động khóa (Auto-lock), kiểm tra số lần nhập sai PIN, hoặc sinh trắc học.

---

## 2. Bảng so sánh Trách nhiệm (Comparison Matrix)

| Tiêu chí | Màn hình Lock (`LockScreen.tsx`) | Màn hình Login / Setup (`Login.tsx`) |
| :--- | :--- | :--- |
| **Trạng thái kích hoạt** | `accountStore.isLocked === true` VÀ `accountStore.vaultConfigured === true` | `accountStore.isLocked === true` VÀ `accountStore.vaultConfigured === false` |
| **Mục tiêu của người dùng** | Mở khóa nhanh kho dữ liệu để sao chép OTP/Mật khẩu | Kết nối thiết bị với kho dữ liệu (hoặc tạo kho mới) |
| **Dữ liệu đầu vào** | Master Password, Mã PIN nhanh, hoặc Sinh trắc học | GitHub Token/OAuth, Tài khoản Server Self-hosted, hoặc Chế độ Local |
| **Tần suất hiển thị** | **Rất cao (Hàng ngày)** mỗi khi mở extension hoặc sau thời gian khóa tự động | **Rất thấp (Lần đầu / Sau khi Đăng xuất)** |
| **Hành động chuyển đổi** | Bấm *"Đăng xuất / Chuyển tài khoản"* -> Đưa về `Login` | Xác thực & tải dữ liệu thành công -> Mở khóa hoặc vào `LockScreen` |

---

## 3. Sơ đồ Luồng Trạng thái (State Flow Diagram)

```mermaid
stateDiagram-v2
    [*] --> AppInitialization: Khởi động Ứng dụng

    AppInitialization --> Unconfigured: Chưa có token / Chưa cấu hình Vault
    AppInitialization --> Locked: Đã có cấu hình Vault & Đang bị khóa
    AppInitialization --> Unlocked: Phiên còn hiệu lực (In-Memory Key sẵn sàng)

    state "Màn hình Login / Setup (Login.tsx)" as Unconfigured {
        SelectProvider: Chọn Provider (Gist / Local / Self-Hosted)
        Authenticate: Nhập Token / OAuth / Server Login
        CreateMasterPassword: Tạo Master Password (nếu Vault mới)
        
        SelectProvider --> Authenticate
        Authenticate --> CreateMasterPassword: Vault mới
        Authenticate --> Unlocked: Vault đã tồn tại
        CreateMasterPassword --> Unlocked
    }

    state "Màn hình Lock (LockScreen.tsx)" as Locked {
        InputPin: Nhập mã PIN Unlock
        InputMP: Nhập Master Password
        ForgotPass: Quên mật khẩu / Reset Local
        LogoutAction: Đăng xuất / Đổi tài khoản
        
        InputPin --> Unlocked: Mở khóa thành công
        InputMP --> Unlocked: Mở khóa thành công
        LogoutAction --> Unconfigured: Xóa Session Token & Chuyển sang Setup
    }

    state "Kho dữ liệu chính (Main Vault Shell)" as Unlocked {
        VaultView: Xem / Thêm / Sửa / Xóa Items
        AutoLock: Hết thời gian chờ / Bấm Khóa
        AutoLock --> Locked
    }
```

---

## 4. Chi tiết Kiến trúc & Thành phần Mã nguồn

### 4.1. `LockScreen.tsx` (`packages/ui/src/features/auth/LockScreen.tsx`)
Chuyên trách hiển thị giao diện mở khóa kho dữ liệu:
* **Header tinh gọn:** Hiển thị Logo thương hiệu, tên ứng dụng và Subtitle trạng thái khóa.
* **Badge Provider nhỏ gọn:** Cho người dùng biết họ đang mở khóa kho nào (`GitHub Gist`, `Local Vault`, hoặc `Self-Hosted Server`).
* **Hỗ trợ đa phương thức mở khóa:**
  * `PinUnlockForm`: Khi người dùng đã kích hoạt tính năng Mở khóa bằng PIN.
  * `MasterPasswordForm`: Mở khóa bằng Master Password truyền thống kèm công tắc chuyển qua lại.
* **Xử lý số lần thử sai:** Đếm số lần nhập sai và đưa ra gợi ý/cảnh báo an toàn.
* **Hành động Đăng xuất (`onLogout`):** Khi người dùng muốn đổi tài khoản hoặc kết nối kho khác, họ có thể bấm *"Đăng xuất"*, ứng dụng sẽ gọi `logout()` để giải phóng token và tự động chuyển về màn hình `Login`.
* **Hành động Quên mật khẩu (`onForgotPassword`):** Hỗ trợ khôi phục hoặc Reset Local Vault qua `TypedConfirmModal`.

### 4.2. `Login.tsx` (`packages/ui/src/features/auth/Login.tsx`)
Chuyên trách thiết lập ban đầu và xác thực Provider:
* **Lựa chọn Provider (`Select`):** Cho phép chuyển đổi giữa `github_gist`, `local_storage`, và `self_hosted_server`.
* **Biểu mẫu xác thực tương ứng:**
  * `GithubSetupForm`: Đăng nhập nhanh bằng GitHub OAuth hoặc nhập Personal Access Token (PAT).
  * `SelfHostedSetupForm`: Đăng nhập/Đăng ký tài khoản trên máy chủ tự host.
  * `MasterPasswordCreate`: Tạo Master Password khởi tạo kho dữ liệu mới.
* **Banner hướng dẫn:** Cung cấp thông tin cảnh báo bảo mật khi sử dụng chế độ Local Vault.

### 4.3. Định tuyến tại Entry Point (`popup-entry.tsx` & `web-entry.tsx`)
Luồng điều hướng tại các tệp khởi chạy ứng dụng:

```tsx
{/* Trạng thái Vault đang khóa */}
<Match when={accountStore.isLocked && uiStore.view !== View.Guide}>
  <Switch>
    {/* Màn hình Chào mừng (lần đầu cài đặt) */}
    <Match when={uiStore.view === View.Welcome}>
      <Welcome />
    </Match>

    {/* Đã cấu hình kho -> Hiển thị LockScreen */}
    <Match when={accountStore.vaultConfigured || settingsStore.vaultMode === "local_storage"}>
      <LockScreen />
    </Match>

    {/* Chưa cấu hình / Đã đăng xuất -> Hiển thị Login / Setup */}
    <Match when={true}>
      <Login />
    </Match>
  </Switch>
</Match>
```

---

## 5. Mô hình Bảo mật (Security Model)

1. **Không lưu trữ Master Password:** Master Password và In-memory Crypto Key không bao giờ được lưu vào `localStorage` hay `chrome.storage.local`.
2. **Khóa bộ nhớ (Memory Clearance):** Khi ứng dụng bị khóa hoặc đóng tab/popup, Crypto Key được giải phóng khỏi RAM (`clearDerivedKey()`).
3. **Phân tách ranh giới Token và Khóa:** 
   - `syncToken` (Truy cập Provider) được mã hóa riêng biệt và quản lý ở tầng repository.
   - `Master Key` (Giải mã Payload Vault) chỉ được sinh ra tạm thời từ PBKDF2/Argon2 khi người dùng nhập đúng Master Password/PIN tại `LockScreen`.

---

## 6. Hướng dẫn Mở rộng trong Tương lai (Future Extensions)

* **Tích hợp Biometrics (WebAuthn / Passkey / Windows Hello):** Chỉ cần tích hợp trực tiếp vào `LockScreen.tsx` bằng một nút bấm *"Mở khóa bằng Vân tay/Khuôn mặt"* mà không cần can thiệp vào tầng cấu hình Provider.
* **Bổ sung Provider mới (GitLab / Nextcloud / S3):** Chỉ cần bổ sung Form và Adapter tương ứng vào `Login.tsx`.
