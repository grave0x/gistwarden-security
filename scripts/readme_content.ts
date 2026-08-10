export type SupportedLang = "en" | "vi";

export interface LangMeta {
  fileName: string;
  label: string;
  flag: string;
}

export const LANG_MATRIX: Record<SupportedLang, LangMeta> = {
  en: { fileName: "README.md", label: "English", flag: "🇬🇧" },
  vi: { fileName: "readme.vi.md", label: "Tiếng Việt", flag: "🇻🇳" },
};

export type I18nText = Record<SupportedLang, string>;

export interface BadgeInfo {
  label: string;
  badgeUrl: string;
  targetUrl: string;
}

export interface FeatureItem {
  icon: string;
  title: I18nText;
  descriptionBulletPoints: Array<I18nText>;
}

export interface SecuritySection {
  icon: string;
  title: I18nText;
  paragraphs: Array<I18nText>;
  bulletPoints?: Array<I18nText>;
}

export interface MethodItem {
  title: I18nText;
  steps: Array<I18nText>;
}

export interface InstallationBrowser {
  title: I18nText;
  steps?: Array<I18nText>;
  methods?: Array<MethodItem>;
}

export interface CommandItem {
  title: I18nText;
  description: I18nText;
  command: string;
}

export const readmeData = {
  title: {
    en: "Gistwarden - High-Security Personal Password Vault Extension 🔒🔑",
    vi: "Gistwarden - Tiện ích Két sắt Mật khẩu Cá nhân Bảo mật Cao 🔒🔑",
  } satisfies I18nText,
  badges: [
    {
      label: "SolidJS",
      badgeUrl: "https://img.shields.io/badge/SolidJS-1.9-2c4f7c?style=for-the-badge&logo=solid&logoColor=white",
      targetUrl: "https://solidjs.com",
    },
    {
      label: "TypeScript",
      badgeUrl: "https://img.shields.io/badge/TypeScript-7.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white",
      targetUrl: "https://www.typescriptlang.org",
    },
    {
      label: "Bun",
      badgeUrl: "https://img.shields.io/badge/Bun-1.x-black?style=for-the-badge&logo=bun&logoColor=white",
      targetUrl: "https://bun.sh",
    },
    {
      label: "Esbuild",
      badgeUrl: "https://img.shields.io/badge/Esbuild-0.28-ffcf00?style=for-the-badge&logo=esbuild&logoColor=black",
      targetUrl: "https://esbuild.github.io",
    },
    {
      label: "Manifest V3",
      badgeUrl: "https://img.shields.io/badge/Manifest-V3-4285f4?style=for-the-badge&logo=google-chrome&logoColor=white",
      targetUrl: "https://developer.chrome.com/docs/extensions/mv3/intro/",
    },
    {
      label: "License: ISC",
      badgeUrl: "https://img.shields.io/badge/License-ISC-blue?style=for-the-badge",
      targetUrl: "https://opensource.org/licenses/ISC",
    },
  ] as BadgeInfo[],
  intro: {
    p1: {
      en: "Gistwarden is an open-source password manager available as a **Browser Extension (Manifest V3)** and an independent **Zero-Knowledge Web Vault (SPA)** designed to manage passwords, one-time passwords (TOTP), secure notes, credit cards, identities, SSH keys, and passkeys (FIDO2/WebAuthn) securely, privately, and completely free of charge.",
      vi: "Gistwarden là ứng dụng quản lý mật khẩu mã nguồn mở hỗ trợ cả hai phiên bản **Browser Extension (Manifest V3)** và **Web Vault độc lập (SPA)**, được thiết kế để quản lý mật khẩu, mã OTP (TOTP), ghi chú bảo mật, thẻ ngân hàng, định danh, SSH key và mã khóa đăng nhập (Passkeys) hoàn toàn miễn phí, an toàn và riêng tư tuyệt đối.",
    } satisfies I18nText,
    p2: {
      en: "Instead of paying annual fees for third-party cloud servers, Gistwarden provides an **equivalent alternative** that runs independently, leveraging your personal **GitHub Gist** as the encrypted database storage. Most importantly, it is optimized for high security and is fully compatible with Bitwarden exports.",
      vi: "Thay vì phải trả phí duy trì hàng năm cho server đám mây của bên thứ ba, Gistwarden được phát triển nhằm mang lại một giải pháp **thay thế tương đương**, hoạt động độc lập, tận dụng kho lưu trữ cá nhân **GitHub Gist** làm cơ sở dữ liệu và đặc biệt là tối ưu hóa bảo mật ở mức cao nhất, có khả năng tương thích tuyệt đối với dữ liệu xuất ra từ Bitwarden.",
    } satisfies I18nText,
  },
  keyFeaturesTitle: {
    en: "⚡ Key Features",
    vi: "⚡ Các tính năng chính",
  } satisfies I18nText,
  features: [
    {
      icon: "🔒",
      title: {
        en: "Absolute Zero-Knowledge Architecture",
        vi: "Kiến trúc Bảo mật Zero-Knowledge tuyệt đối",
      },
      descriptionBulletPoints: [
        {
          en: "**Local Encryption:** All data is encrypted directly on your browser using Argon2id & AES-GCM 256 before being synced to your GitHub Gist.",
          vi: "**Mã hóa cục bộ:** Toàn bộ dữ liệu két sắt được mã hóa ngay tại trình duyệt bằng Argon2id & AES-GCM 256 trước khi đồng bộ lên GitHub Gist.",
        },
        {
          en: "**Privacy First:** No one — including GitHub or the extension developer — can read your data without your Master Password.",
          vi: "**Riêng tư tối đa:** Không một ai — kể cả GitHub hay nhà phát triển tiện ích — có thể đọc được dữ liệu của bạn nếu không có Mật khẩu Master.",
        },
      ],
    },
    {
      icon: "✨",
      title: {
        en: "Intelligent Autofill & Password Capture",
        vi: "Tự động điền & Gợi ý lưu mật khẩu thông minh",
      },
      descriptionBulletPoints: [
        {
          en: "**Contextual Autofill:** Detects login forms automatically and offers interactive overlay menus to fill username and password in one click.",
          vi: "**Tự động điền thông minh:** Nhận diện các ô nhập tài khoản/mật khẩu trên website và hiển thị menu điền nhanh 1-click.",
        },
        {
          en: "**Smart Save/Update Suggestions:** Detects new credential submissions and prompts to save or update existing accounts instantly.",
          vi: "**Gợi ý lưu/Cập nhật:** Tự động phát hiện khi bạn đăng nhập tài khoản mới và hiển thị thanh gợi ý lưu hoặc cập nhật mật khẩu.",
        },
      ],
    },
    {
      icon: "⚡",
      title: {
        en: "Passkeys Support (FIDO2/WebAuthn)",
        vi: "Hỗ trợ Passkeys (FIDO2/WebAuthn)",
      },
      descriptionBulletPoints: [
        {
          en: "**Passwordless Login:** Create, simulate, and store modern Passkeys right inside your extension.",
          vi: "**Đăng nhập không mật khẩu:** Khởi tạo, giả lập và lưu trữ các khóa đăng nhập Passkeys hiện đại trực tiếp ngay bên trong extension.",
        },
        {
          en: "**Cross-Origin Match Protection:** Features domain match validation to prevent cross-origin credentials leaking.",
          vi: "**Bảo vệ chống rò rỉ chéo tên miền:** Tích hợp kiểm tra tên miền khớp chéo để bảo vệ tài khoản không bị rò rỉ thông tin khóa.",
        },
      ],
    },
    {
      icon: "⏱️",
      title: {
        en: "Dynamic TOTP (2FA) Codes",
        vi: "Mã xác thực OTP động (TOTP/2FA)",
      },
      descriptionBulletPoints: [
        {
          en: "**QR Code Parser:** Scan QR codes directly on web pages or upload image files to retrieve secret keys.",
          vi: "**Quét mã QR tự động:** Hỗ trợ quét mã QR trực tiếp trên trang web hoặc nạp ảnh chụp mã QR để tự phân tích khóa bí mật.",
        },
        {
          en: "**Auto Generator:** Instantly calculates and generates 2-factor authentication codes refreshing automatically every 30 seconds.",
          vi: "**Tự động sinh mã:** Tính toán và hiển thị mã bảo mật 2 lớp cập nhật tự động sau mỗi 30 giây.",
        },
      ],
    },
    {
      icon: "🛡️",
      title: {
        en: "Vault Security Audit & Health Reports",
        vi: "Báo cáo Kiểm tra Bảo mật & Rò rỉ Dữ liệu (Vault Audit)",
      },
      descriptionBulletPoints: [
        {
          en: "**Data Breach Checker (HIBP):** Checks email & usernames against Have I Been Pwned data breach database using privacy-preserving k-Anonymity API model.",
          vi: "**Kiểm tra rò rỉ dữ liệu (HIBP):** Phân tích email & username với cơ sở dữ liệu rò rỉ Have I Been Pwned qua mô hình k-Anonymity bảo mật tuyệt đối.",
        },
        {
          en: "**Password Strength & Reused Audit:** Evaluates password complexity using `zxcvbn` scoring and flags credentials reused across multiple sites.",
          vi: "**Đánh giá độ mạnh & Trùng lặp:** Sử dụng thuật toán `zxcvbn` chấm điểm mật khẩu và cảnh báo các mật khẩu bị dùng trùng trên nhiều dịch vụ.",
        },
        {
          en: "**Security Vulnerability Warnings:** Identifies accounts missing 2FA/TOTP protection and sites using unencrypted HTTP protocols.",
          vi: "**Cảnh báo lỗ hổng:** Tự động phát hiện các tài khoản chưa bật 2FA/TOTP và các trang web chưa sử dụng kết nối mã hóa HTTPS.",
        },
      ],
    },
    {
      icon: "🔄",
      title: {
        en: "Universal Data Import/Export & Google Migration",
        vi: "Nhập xuất dữ liệu toàn diện & Chuyển đổi mã TOTP dễ dàng",
      },
      descriptionBulletPoints: [
        {
          en: "**Multi-Format Import/Export:** Seamlessly import and export JSON/CSV data from Bitwarden, Chrome, Firefox, Edge, and password managers.",
          vi: "**Nhập/Xuất đa định dạng:** Nhập xuất linh hoạt dữ liệu tệp JSON/CSV từ Bitwarden, Chrome, Firefox, Edge và các ứng dụng quản lý mật khẩu.",
        },
        {
          en: "**Google Authenticator Decoder (Migration Tool):** Extract Protobuf binaries directly from QR images or `otpauth-migration://` export strings, preview countdown TOTP codes, and auto-pair into vault accounts.",
          vi: "**Giải mã Google Authenticator (Migration Tool):** Bóc tách nhị phân Protobuf trực tiếp từ ảnh mã QR hoặc chuỗi `otpauth-migration://` xuất từ Google Authenticator, hỗ trợ xem mã TOTP đếm ngược và ghép nối tự động vào tài khoản Két sắt.",
        },
        {
          en: "**Offline Encrypted Backups:** Decrypt and download your local vault as a JSON backup file at any time.",
          vi: "**Sao lưu ngoại tuyến:** Giải mã và tải xuống cơ sở dữ liệu két sắt dưới dạng file JSON backup bất cứ lúc nào.",
        },
      ],
    },
    {
      icon: "🎲",
      title: {
        en: "Advanced Password & Diceware Passphrase Generator",
        vi: "Trình khởi tạo Mật khẩu & Cụm từ ghép Diceware",
      },
      descriptionBulletPoints: [
        {
          en: "**Customizable Rules:** Generate highly secure random passwords with configurable length, character sets, and exclusion of ambiguous characters.",
          vi: "**Cấu hình linh hoạt:** Tự động tạo mật khẩu ngẫu nhiên với độ dài tùy chỉnh, lựa chọn ký tự và loại bỏ ký tự dễ nhầm lẫn.",
        },
        {
          en: "**Bilingual Diceware Passphrases:** Create memorable multi-word passphrases using English and Vietnamese EFF wordlists.",
          vi: "**Cụm từ ghép song ngữ:** Sinh cụm từ ghép (Passphrase) ngẫu nhiên dễ nhớ dựa trên danh sách từ vựng EFF tiếng Anh và tiếng Việt.",
        },
        {
          en: "**Generation History:** Track recently generated passwords to recover generated keys easily.",
          vi: "**Lịch sử khởi tạo:** Lưu giữ lịch sử các mật khẩu vừa tạo giúp dễ dàng truy vết và khôi phục khi cần.",
        },
      ],
    },
    {
      icon: "🔑",
      title: {
        en: "Multi-Category Vault & Quick PIN Unlock",
        vi: "Két sắt Đa danh mục & Mở khóa nhanh bằng mã PIN",
      },
      descriptionBulletPoints: [
        {
          en: "**Rich Item Types:** Support Logins, Secure Notes, Credit Cards, Identities, SSH Keys with custom key-value fields.",
          vi: "**Đa dạng loại dữ liệu:** Lưu trữ Mật khẩu đăng nhập, Ghi chú bảo mật, Thẻ ngân hàng, Định danh cá nhân, SSH Keys kèm trường tùy biến.",
        },
        {
          en: "**PIN Quick Unlock:** Set a quick PIN code to unlock your local session while keeping Master Password encrypted.",
          vi: "**Mở khóa nhanh bằng PIN:** Cài đặt mã PIN mở khóa nhanh phiên làm việc mà vẫn đảm bảo két gốc được mã hóa an toàn.",
        },
      ],
    },
    {
      icon: "🌐",
      title: {
        en: "Multilingual Support",
        vi: "Hỗ trợ đa ngôn ngữ",
      },
      descriptionBulletPoints: [
        {
          en: "**Dual Languages:** Smoothly toggle between **English 🇬🇧** and **Tiếng Việt 🇻🇳** directly from the settings or welcome screen.",
          vi: "**Song ngữ:** Dễ dàng chuyển đổi linh hoạt giữa **Tiếng Anh 🇬🇧** và **Tiếng Việt 🇻🇳** trực tiếp từ giao diện cài đặt hoặc màn hình chào mừng.",
        },
      ],
    },
    {
      icon: "🎨",
      title: {
        en: "Premium Modern UI",
        vi: "Giao diện hiện đại & cao cấp",
      },
      descriptionBulletPoints: [
        {
          en: "**Sleek Aesthetic Design:** Beautiful modern interface with customized scrollbars, premium layouts, and seamless transitions.",
          vi: "**Thiết kế Tinh tế & Hiện đại:** Giao diện trực quan đẹp mắt, thanh cuộn tùy chỉnh mượt mà và các hiệu ứng chuyển cảnh tự nhiên.",
        },
        {
          en: "**Theme Selection:** Sleek Dark Mode and Light Mode configurations.",
          vi: "**Chế độ Sáng/Tối:** Hỗ trợ cấu hình chủ đề Dark Mode và Light Mode thời thượng.",
        },
      ],
    },
  ] as FeatureItem[],
  securityTitle: {
    en: "🔒 Security Architecture",
    vi: "🔒 Kiến trúc Bảo mật",
  } satisfies I18nText,
  securitySections: [
    {
      icon: "1.",
      title: {
        en: "Hardware-Resistant Key Derivation (KDF)",
        vi: "Cơ chế Sinh khóa Kháng Phần cứng (Key Derivation - KDF)",
      },
      paragraphs: [
        {
          en: "Gistwarden utilizes **Argon2id (WebAssembly)** — the current gold standard in key derivation and password hashing — to defend against offline brute-force attacks from hardware-accelerated systems (such as GPUs, FPGAs, and ASICs).",
          vi: "Gistwarden sử dụng **Argon2id (WebAssembly)** - thuật toán chiến thắng giải *Password Hashing Competition* và là tiêu chuẩn bảo mật tốt nhất hiện nay - giúp kháng lại mọi hình thức dò mật khẩu (brute-force) bằng thiết bị phần cứng chuyên dụng (như GPU, FPGA, ASIC).",
        },
      ],
      bulletPoints: [
        {
          en: "**Parameters:** Memory: **64 MB**, Iterations: **3 rounds**, Parallelism: **1 thread** (Optimized for extension environments).",
          vi: "**Thông số:** Bộ nhớ: **64 MB**, Vòng lặp: **3 vòng**, Luồng song song: **1 luồng** (Tối ưu cho môi trường Extension đơn luồng).",
        },
        {
          en: "**Defense Capability:** Requiring 64MB of RAM per attempt completely neutralizes GPU advantages, making brute-force attacks economically and computationally infeasible.",
          vi: "**Khả năng phòng thủ:** Yêu cầu 64MB RAM cho mỗi lần thử mật khẩu khiến các thiết bị đào coin/GPU bị nghẽn cổ chai RAM và tăng chi phí tấn công lên hàng triệu lần, bảo vệ mật khẩu Master trước mọi đòn tấn công ngoại tuyến.",
        },
      ],
    },
    {
      icon: "2.",
      title: {
        en: "Industry-Standard Encryption",
        vi: "Tiêu chuẩn Mã hóa Quân đội",
      },
      paragraphs: [
        {
          en: "Your vault data is protected by:",
          vi: "Dữ liệu của bạn được bảo vệ bởi các tiêu chuẩn:",
        },
      ],
      bulletPoints: [
        {
          en: "**AES-GCM 256-bit:** The industry standard for authenticated symmetric encryption (AEAD). Any tampering with the encrypted data on GitHub Gist will cause decryption to fail immediately.",
          vi: "**AES-GCM 256-bit:** Chuẩn mã hóa đối xứng xác thực (AEAD) tiên tiến nhất. Bất kỳ sự thay đổi trái phép nào đối với file mã hóa trên Gist sẽ làm quá trình giải mã thất bại ngay lập tức, chống tấn công chèn hay sửa đổi file dữ liệu.",
        },
        {
          en: "**12-byte Random Initialization Vector (IV):** Generated using `crypto.getRandomValues` for each save operation, ensuring ciphertext uniqueness.",
          vi: "**Vector khởi tạo (IV) ngẫu nhiên 12-byte:** Được sinh ra bởi API ngẫu nhiên bảo mật của trình duyệt (`crypto.getRandomValues`) cho mỗi lần lưu, đảm bảo ciphertext luôn độc nhất cho dù dữ liệu mật khẩu bên trong trùng khớp.",
        },
      ],
    },
    {
      icon: "3.",
      title: {
        en: "Secure WebAssembly Integration (Local WASM Package)",
        vi: "Tích hợp WebAssembly An toàn (Local WASM Package)",
      },
      paragraphs: [
        {
          en: "To comply with strict CSP guidelines of Chrome Extension **Manifest V3**:",
          vi: "Để tuân thủ tiêu chuẩn Content Security Policy (CSP) cực kỳ khắt khe của Chrome Extension **Manifest V3**:",
        },
      ],
      bulletPoints: [
        {
          en: "The WebAssembly binary of the `hash-wasm` library is **base64-encoded and inlined directly** inside the extension's JS bundle.",
          vi: "Nhân WebAssembly của thư viện mã hóa `hash-wasm` được **mã hóa base64 và nhúng trực tiếp** vào bên trong bundle JS của extension.",
        },
        {
          en: "The extension **never downloads any external scripts or binaries** over the network, eliminating Man-in-the-Middle (MITM) script injection risks.",
          vi: "Tiện ích cam kết **không tải bất kỳ tập lệnh (scripts) hoặc nhị phân (binaries) từ bên ngoài** qua internet trong quá trình hoạt động, loại bỏ hoàn toàn nguy cơ bị tấn công trung gian (MITM).",
        },
      ],
    },
  ] as SecuritySection[],
  installationTitle: {
    en: "🛠️ Installation Guide",
    vi: "🛠️ Hướng dẫn cài đặt",
  } satisfies I18nText,
  installationIntro: {
    en: "Once built, production files are compiled into the `/dist` directory. You can load this unpacked directory into your browser:",
    vi: "Sau khi biên dịch, các file sản phẩm sẽ được tạo trong thư mục `/dist`. Bạn có thể nạp thư mục đã giải nén này vào trình duyệt của mình:",
  } satisfies I18nText,
  installationBrowsers: [
    {
      title: {
        en: "1. Google Chrome & Chromium-based Browsers (Edge, Brave, Opera, Coccoc...)",
        vi: "1. Google Chrome & các trình duyệt nhân Chromium (Edge, Brave, Opera, Cốc Cốc...)",
      },
      steps: [
        {
          en: "Run the build script and ensure you have the `dist/chrome` folder (or extract `dist/chrome.zip`).",
          vi: "Chạy lệnh build tiện ích và đảm bảo bạn có thư mục `dist/chrome` (hoặc giải nén từ tệp `dist/chrome.zip`).",
        },
        {
          en: "Open Chrome and navigate to [chrome://extensions/](chrome://extensions/).",
          vi: "Mở Chrome và truy cập đường dẫn [chrome://extensions/](chrome://extensions/).",
        },
        {
          en: "Enable **Developer mode** using the toggle switch in the top-right corner.",
          vi: "Bật **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.",
        },
        {
          en: "Click the **Load unpacked** button in the top-left corner.",
          vi: "Bấm nút **Tải tiện ích đã giải nén (Load unpacked)** ở góc trên bên trái.",
        },
        {
          en: "Select the `dist/chrome` folder on your computer.",
          vi: "Chọn thư mục `dist/chrome` trên máy tính của bạn.",
        },
        {
          en: "Pin the extension icon to your toolbar.",
          vi: "Ghim biểu tượng extension lên thanh công cụ để sử dụng.",
        },
      ],
    },
    {
      title: {
        en: "2. Mozilla Firefox",
        vi: "2. Mozilla Firefox",
      },
      methods: [
        {
          title: {
            en: "Method 1: Temporary Installation (For Development - resets when browser closes)",
            vi: "Cách 1: Cài đặt tạm thời (Để phát triển - sẽ mất khi tắt trình duyệt)",
          },
          steps: [
            {
              en: "Open Firefox and navigate to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).",
              vi: "Mở Firefox và truy cập [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox).",
            },
            {
              en: "Click the **Load Temporary Add-on...** button.",
              vi: "Bấm nút **Load Temporary Add-on...** (Tải tiện ích tạm thời).",
            },
            {
              en: "Select the `manifest.json` file inside the `dist/firefox` folder.",
              vi: "Chọn file `manifest.json` nằm trong thư mục `dist/firefox`.",
            },
          ],
        },
        {
          title: {
            en: "Method 2: Permanent Installation (Requires Firefox Developer Edition or Nightly)",
            vi: "Cách 2: Cài đặt vĩnh viễn (Yêu cầu Firefox Developer Edition hoặc Firefox Nightly)",
          },
          steps: [
            {
              en: "Navigate to `about:config` in Firefox.",
              vi: "Truy cập `about:config` trên Firefox.",
            },
            {
              en: "Search for `xpinstall.signatures.required` and set it to `false`.",
              vi: "Tìm từ khóa `xpinstall.signatures.required` và nhấp đúp để đổi giá trị thành `false`.",
            },
            {
              en: "Go to [about:addons](about:addons), click the gear icon, and select **Install Add-on From File...**.",
              vi: "Truy cập [about:addons](about:addons), bấm vào biểu tượng bánh răng ở góc trên bên phải, chọn **Install Add-on From File...** (Cài đặt tiện ích từ file).",
            },
            {
              en: "Choose the `dist/firefox.zip` file to install it permanently.",
              vi: "Chọn tệp `dist/firefox.zip` để cài đặt vĩnh viễn.",
            },
          ],
        },
      ],
    },
  ] as InstallationBrowser[],
  tokenTitle: {
    en: "🔑 How to Generate a GitHub Token",
    vi: "🔑 Cách tạo GitHub Personal Access Token",
  } satisfies I18nText,
  tokenIntro: {
    en: "To securely connect your vault with the cloud, the extension utilizes your personal GitHub Gists. Follow these simple steps:",
    vi: "Để liên kết két sắt an toàn với đám mây, tiện ích sử dụng kho lưu trữ GitHub Gists cá nhân của bạn. Thực hiện theo các bước đơn giản sau:",
  } satisfies I18nText,
  tokenSteps: [
    {
      en: "**Sign In:** Log in to your [GitHub](https://github.com) account.",
      vi: "**Đăng nhập:** Đăng nhập vào tài khoản [GitHub](https://github.com) của bạn.",
    },
    {
      en: "**Quick Token Creation:** Click this link to open the pre-configured token generation page:\n   [Quick GitHub Token Generation (Gist)](https://github.com/settings/tokens/new?description=Gistwarden%20Sync&scopes=gist).",
      vi: "**Tạo nhanh mã Token:** Bấm vào liên kết được cấu hình sẵn quyền hạn này:\n   [Trang tạo nhanh GitHub Token (Gist)](https://github.com/settings/tokens/new?description=Gistwarden%20Sync&scopes=gist).",
    },
    {
      en: "**Configure:**\n   - **Note:** Enter a description (e.g., `Gistwarden Vault`).\n   - **Expiration:** Select **No expiration** to prevent future sync failures.\n   - **Scopes:** Ensure the **gist** scope checkbox is checked (this is the only permission required).",
      vi: "**Cấu hình thiết lập:**\n   - **Note:** Nhập mô tả (ví dụ: `Gistwarden Vault`).\n   - **Expiration:** Chọn **No expiration** (Không bao giờ hết hạn) để tránh lỗi đồng bộ trong tương lai.\n   - **Scopes:** Đảm bảo checkbox quyền **gist** đã được chọn (đây là quyền duy nhất tiện ích cần).",
    },
    {
      en: "**Generate:** Scroll to the bottom and click the green **Generate token** button.",
      vi: "**Tạo mã:** Cuộn xuống cuối trang và bấm nút xanh **Generate token** (Tạo token).",
    },
    {
      en: "**Save Settings:** Copy the generated token string (starts with `ghp_`). Open the extension, click **Settings**, paste it into the GitHub Token field, and click **Save**.",
      vi: "**Lưu cấu hình:** Sao chép chuỗi mã Token vừa được tạo (bắt đầu bằng `ghp_`). Mở tiện ích Gistwarden, vào phần **Cài đặt**, dán mã vào ô GitHub Token và bấm **Lưu**.",
    },
  ] as Array<I18nText>,
  tokenWarning: {
    title: {
      en: "IMPORTANT SECURITY NOTE",
      vi: "LƯU Ý BẢO MẬT QUAN TRỌNG",
    } satisfies I18nText,
    content: {
      en: "Never share your GitHub Token with anyone else. The extension only stores it locally in your browser's secure storage and communicates directly with GitHub Gist APIs. No middleman or third-party servers are used.",
      vi: "Tuyệt đối không chia sẻ mã GitHub Token của bạn cho bất kỳ ai. Tiện ích chỉ lưu mã này cục bộ trong bộ nhớ trình duyệt và giao tiếp trực tiếp với máy chủ GitHub API. Không có bất kỳ máy chủ trung gian nào của bên thứ ba được sử dụng.",
    } satisfies I18nText,
  },
  devCommandsTitle: {
    en: "🏗️ Development & Build Commands",
    vi: "🏗️ Các lệnh phát triển và đóng gói",
  } satisfies I18nText,
  devCommandsIntro: {
    en: "This project uses **Bun** natively to develop, test, typecheck, and bundle.",
    vi: "Dự án sử dụng **Bun** nguyên bản để phát triển, kiểm tra cú pháp và đóng gói.",
  } satisfies I18nText,
  commands: [
    {
      title: {
        en: "1. Build Extension Target",
        vi: "1. Đóng gói Extension Target",
      },
      description: {
        en: "Compile and bundle the Chrome/Firefox browser extension into `dist/chrome` and `dist/firefox`:",
        vi: "Biên dịch mã nguồn và đóng gói tiện ích mở rộng Chrome/Firefox vào `dist/chrome` và `dist/firefox`:",
      },
      command: "bun run build:extension",
    },
    {
      title: {
        en: "2. Build Web Vault Target",
        vi: "2. Đóng gói Web Vault Target",
      },
      description: {
        en: "Compile and bundle the standalone Web Vault Single Page App into `dist/web`:",
        vi: "Biên dịch ứng dụng Web Vault Single Page App độc lập vào `dist/web`:",
      },
      command: "bun run build:web",
    },
    {
      title: {
        en: "3. Build All Targets",
        vi: "3. Đóng gói Tất cả (Build All)",
      },
      description: {
        en: "Compile all extension and web production archives:",
        vi: "Biên dịch toàn bộ cả Extension và Web Vault:",
      },
      command: "bun run build:all",
    },
    {
      title: {
        en: "4. Serve Web Vault Locally",
        vi: "4. Chạy HTTP Server thử nghiệm Web Vault Cục bộ",
      },
      description: {
        en: "Launch local dev HTTP server serving `dist/web` at `http://localhost:3000`:",
        vi: "Khởi chạy HTTP server phục vụ `dist/web` tại `http://localhost:3000`:",
      },
      command: "bun run serve",
    },
    {
      title: {
        en: "5. Type Check",
        vi: "5. Kiểm tra kiểu (TypeCheck)",
      },
      description: {
        en: "Verify TypeScript type compliance:",
        vi: "Kiểm tra sự tuân thủ kiểu TypeScript:",
      },
      command: "bun run typecheck",
    },
    {
      title: {
        en: "6. Run Unit Tests",
        vi: "6. Chạy bộ kiểm thử (Unit Tests)",
      },
      description: {
        en: "Run standard cryptographic and utility test suites:",
        vi: "Khởi chạy các bộ unit test cho mã hóa và tiện ích:",
      },
      command: "bun run test",
    },
    {
      title: {
        en: "7. Run Custom Linter",
        vi: "7. Chạy bộ kiểm tra Lint (Custom Linter)",
      },
      description: {
        en: "Execute custom linting rules on codebase:",
        vi: "Chạy công cụ linter kiểm tra quy tắc mã nguồn:",
      },
      command: "bun run lint",
    },
  ] as CommandItem[],
};
