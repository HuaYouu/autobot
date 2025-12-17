NỀN TẢNG QUẢN LÝ BOT MINECRAFT
===================================

Đây là một framework mạnh mẽ được xây dựng bằng Node.js và Mineflayer, nay được tích hợp trong một giao diện đồ họa (GUI) sử dụng Electron.js để quản lý và chạy nhiều bot Minecraft một cách trực quan.

## KIẾN TRÚC
-   **Electron Main Process**: Đóng vai trò backend, chạy `BotManager` để quản lý logic của tất cả các bot.
-   **Electron Renderer Process**: Giao diện người dùng (frontend) mà bạn tương tác, được xây dựng bằng HTML/CSS/JS.
-   **BotManager**: Lớp trung tâm quản lý tất cả các bot đang hoạt động.
-   **BotInstance**: Lớp đại diện cho mỗi bot độc lập, chứa logic và hệ thống module riêng.
-   **CombatManager**: Module chức năng cốt lõi, quản lý toàn bộ hành vi PvP của bot.

## CÀI ĐẶT
1.  Mở terminal trong thư mục gốc của dự án.
2.  Chạy lệnh `npm install` để cài đặt tất cả các thư viện cần thiết, bao gồm cả Electron.

## CẤU HÌNH (`settings.json`)
File `settings.json` cho phép bạn định nghĩa và cấu hình chi tiết cho từng bot. Giao diện sẽ tự động đọc file này để hiển thị danh sách bot.

### Cấu hình Chi tiết cho Mỗi Bot
-   `enabled_on_startup`: (Không còn sử dụng trong bản GUI)
-   `host`, `port`, `username`, `auth`, `version`: Thông tin kết nối server.
-   `password`: (Tùy chọn) Mật khẩu cho server yêu cầu `/login`.
-   `loginScript`: Tên file kịch bản điều hướng.
-   `movementOptions`: Cấu hình cho module di chuyển tiện ích.
-   `modules`: Quản lý các module chức năng. Hiện tại, module chính là `combatManager`.

### Cấu hình `combatManager`
Mục `options` trong `combatManager` chứa toàn bộ logic chiến đấu, có thể được quản lý qua giao diện.
-   `mode`: Chế độ chiến đấu (`"guardian"`, `"aggressive"`, `"patrol"`).
-   `guardianTarget`, `retreatHealthLevel`, `patrolArea`, `blacklist`, `whitelist`: Các tùy chọn chi tiết cho từng chế độ.

## CÁCH SỬ DỤNG

### 1. Khởi chạy Giao diện
Để khởi động ứng dụng, mở terminal trong thư mục gốc và chạy lệnh:
```
npm start
```
Một cửa sổ ứng dụng đồ họa sẽ hiện lên.

### 2. Tương tác với Giao diện
-   **Cột bên trái (Danh Sách Bot):**
    -   Hiển thị tất cả các bot đã được cấu hình trong `settings.json`.
    -   Mỗi bot có một biểu tượng trạng thái (Đang Chạy, Đã Tắt, Đang Kết Nối).
    -   Click vào một bot trong danh sách để chọn và quản lý bot đó.

-   **Cột bên phải (Điều Khiển & CLI):**
    -   **Phần Điều Khiển:**
        -   Hiển thị các module và chức năng có thể bật/tắt cho bot đã chọn.
        -   Sử dụng công tắc (toggle) để bật hoặc tắt bot hoặc các module của nó.
    -   **Phần Command Line Interface (CLI):**
        -   Hiển thị log thời gian thực từ tất cả các bot.
        -   Nhập lệnh vào ô input và nhấn "Gửi" để gửi lệnh chat trực tiếp từ bot đã chọn.
        -   **Lưu ý:** Phải chọn một bot trước khi có thể gửi lệnh.
