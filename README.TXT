NỀN TẢNG QUẢN LÝ BOT MINECRAFT
===================================

Đây là một framework mạnh mẽ được xây dựng bằng Node.js và Mineflayer để quản lý và chạy nhiều bot Minecraft độc lập, với hệ thống chiến đấu (PvP) tự động và linh hoạt.

## KIẾN TRÚC
-   **BotManager**: Lớp trung tâm quản lý tất cả các bot đang hoạt động.
-   **BotInstance**: Lớp đại diện cho mỗi bot độc lập, chứa logic và hệ thống module riêng.
-   **CombatManager**: Module chức năng cốt lõi, quản lý toàn bộ hành vi PvP của bot.

## CÀI ĐẶT
1.  Mở terminal trong thư mục gốc của dự án.
2.  Chạy lệnh `npm install` để cài đặt các thư viện cần thiết.

## CẤU HÌNH (`settings.json`)
File `settings.json` cho phép bạn định nghĩa và cấu hình chi tiết cho từng bot.

### Cấu hình Chi tiết cho Mỗi Bot
-   `enabled_on_startup`: (`true`/`false`) - Tự động chạy bot khi khởi động.
-   `host`, `port`, `username`, `auth`, `version`: Thông tin kết nối server.
-   `password`: (Tùy chọn) Mật khẩu cho server yêu cầu `/login`.
-   `loginScript`: Tên file kịch bản điều hướng.
-   `movementOptions`: Cấu hình cho module di chuyển tiện ích.
-   `modules`: Quản lý các module chức năng. Hiện tại, module chính là `combatManager`.

### Cấu hình `combatManager`
Mục `options` trong `combatManager` chứa toàn bộ logic chiến đấu:
-   `mode`: Chế độ chiến đấu. Có 3 giá trị:
    -   `"guardian"`: Đi theo và bảo vệ một người chơi.
    -   `"aggressive"`: Tự động tìm và tiêu diệt mọi kẻ địch không thuộc whitelist.
    -   `"patrol"`: Tuần tra trong một khu vực được xác định.
-   `guardianTarget`: Tên người chơi cần bảo vệ (chỉ dùng ở mode `guardian`).
-   `retreatHealthLevel`: Ngưỡng máu để bot tự động rút lui (ví dụ: `10` tương đương 5 trái tim).
-   `patrolArea`: Một mảng gồm 4 tọa độ `{x, y, z}` xác định khu vực tuần tra hình chữ nhật (chỉ dùng ở mode `patrol`).
-   `blacklist`: Danh sách tên người chơi hoặc loại quái vật (ví dụ: "Zombie") mà bot sẽ luôn tấn công.
-   `whitelist`: Danh sách tên người chơi mà bot sẽ không bao giờ tấn công.
-   `submodules`: (`true`/`false`) - Bật/tắt các module PvP con (hiện tại chỉ là cấu trúc, chưa có logic riêng).

## CÁCH SỬ DỤNG

### 1. Chạy Nền tảng
Để khởi động BotManager, mở terminal và chạy lệnh:
```
node index.js
```
Chương trình sẽ khởi động các bot được cấu hình và hiển thị dấu nhắc lệnh `> ` để bạn tương tác.

### 2. Sử dụng Giao diện Dòng lệnh (CLI)
Bạn có thể quản lý các bot và module của chúng trong thời gian thực:

-   **`list`**
    Liệt kê tất cả các bot đang chạy.

-   **`start <tên_bot>`**
    Khởi động một bot từ cấu hình.
    *Ví dụ:* `start bot2`

-   **`stop <tên_bot>`**
    Dừng một bot đang chạy.
    *Ví dụ:* `stop bot1`

-   **`module <tên_bot> <tên_module> <on|off>`**
    Bật hoặc tắt một module chức năng của một bot cụ thể. Thay đổi này sẽ được **lưu lại** vào `settings.json`.
    *Ví dụ:* `module bot1 combatManager off` (để tắt chế độ chiến đấu của bot1)

-   **`exit`**
    Dừng tất cả các bot và thoát khỏi chương trình.
