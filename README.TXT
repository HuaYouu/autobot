NỀN TẢNG QUẢN LÝ BOT MINECRAFT
===================================

Đây là một framework mạnh mẽ được xây dựng bằng Node.js và Mineflayer để quản lý và chạy nhiều bot Minecraft độc lập cùng một lúc. Nền tảng này cho phép khởi động, dừng và quản lý các bot trong thời gian thực thông qua một giao diện dòng lệnh (CLI).

## KIẾN TRÚC
-   **BotManager**: Lớp trung tâm quản lý tất cả các bot đang hoạt động.
-   **BotInstance**: Một lớp đại diện cho mỗi bot độc lập, chứa logic và hệ thống module riêng của nó.
-   **Hệ thống Module**: Mỗi bot có một hệ thống module riêng, cho phép bật/tắt các chức năng (`features`) một cách linh hoạt.

## YÊU CẦU
- Node.js (khuyên dùng phiên bản LTS mới nhất)
- npm (thường đi kèm với Node.js)

## CÀI ĐẶT
1.  Mở terminal trong thư mục gốc của dự án.
2.  Chạy lệnh `npm install` để cài đặt các thư viện cần thiết.

## CẤU HÌNH (`settings.json`)
File `settings.json` cho phép bạn định nghĩa và cấu hình tất cả các bot mà bạn muốn quản lý.

### Cấu trúc Tổng thể
File chứa một object chính là `"bots"`. Mỗi key bên trong object này là **tên định danh duy nhất** cho một bot.

```json
{
  "bots": {
    "bot_ten_1": { ... cấu hình cho bot 1 ... },
    "bot_ten_2": { ... cấu hình cho bot 2 ... }
  }
}
```

### Cấu hình Chi tiết cho Mỗi Bot
Mỗi object cấu hình bot chứa các thông tin sau:
-   `enabled_on_startup`: (`true`/`false`) - Nếu là `true`, bot sẽ tự động khởi chạy khi bạn bắt đầu chương trình.
-   `host`, `port`, `username`, `auth`, `version`: Thông tin kết nối server.
-   `password`: (Tùy chọn) Mật khẩu cho các server yêu cầu `/login`. Bot sẽ tự động gửi lệnh `/register` và `/login`.
-   `enableLoginMenu`: (`true`/`false`) - Bật/tắt việc thực thi kịch bản điều hướng.
-   `loginScript`: Tên file kịch bản điều hướng (ví dụ: `"login_manual.txt"`).
-   `movementOptions`: Cấu hình cho module di chuyển.
-   `modules`: Cấu hình trạng thái và tùy chọn cho các module chức năng của bot đó.

## CÁCH SỬ DỤNG

### 1. Chạy Nền tảng
Để khởi động BotManager và các bot được cấu hình, mở terminal và chạy lệnh:
```
node index.js
```
Chương trình sẽ khởi động các bot có `enabled_on_startup: true` và sau đó hiển thị một dấu nhắc lệnh `> ` để bạn tương tác.

### 2. Sử dụng Giao diện Dòng lệnh (CLI)
Bạn có thể quản lý các bot trong thời gian thực bằng các lệnh sau:

-   **`list`**
    Liệt kê tất cả các bot đang chạy.

-   **`start <tên_bot>`**
    Khởi động một bot mới từ cấu hình trong `settings.json`.
    *Ví dụ:* `start bot_miner_1`

-   **`stop <tên_bot>`**
    Dừng một bot đang chạy. Bot sẽ ngắt kết nối an toàn khỏi server.
    *Ví dụ:* `stop bot_guard_1`

-   **`exit`**
    Dừng tất cả các bot đang chạy và thoát khỏi chương trình.

### 3. Tương tác với Bot trong Game
Mỗi bot vẫn có hệ thống module riêng và có thể được điều khiển qua chat trong game như trước, miễn là các module tương ứng (`commandManager`, `movementController`) được bật trong cấu hình của bot đó.
