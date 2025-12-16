MINECRAFT BOT TỰ ĐỘNG - NÂNG CAO
====================================

Đây là một bot Minecraft được xây dựng bằng Node.js và thư viện Mineflayer.
Bot có khả năng tự động đăng nhập, thực hiện chuỗi hành động điều hướng qua menu, và di chuyển đến các tọa độ được chỉ định thông qua lệnh chat.

## YÊU CẦU
- Node.js (khuyên dùng phiên bản LTS mới nhất)
- npm (thường đi kèm với Node.js)

## CÀI ĐẶT
1.  Tải toàn bộ mã nguồn về máy tính của bạn.
2.  Mở terminal hoặc command prompt trong thư mục gốc của dự án.
3.  Chạy lệnh sau để cài đặt các thư viện cần thiết:
    ```
    npm install
    ```

## CẤU HÌNH
Tất cả các cấu hình của bot đều nằm trong file `settings.json`.

### Cấu hình Cơ bản
-   `host`: Địa chỉ IP của server Minecraft.
-   `port`: Cổng của server Minecraft.
-   `username`: Tên nhân vật của bot.
-   `auth`: Phương thức xác thực ("offline" hoặc "microsoft").
-   `enableLoginMenu`: Bật/tắt kịch bản điều hướng menu khi đăng nhập (`true`/`false`).

### Cấu hình Di chuyển (`movement`)
Mục này chứa các tùy chọn cho module di chuyển và tìm đường đi.
-   `goalRadius`: Bot được coi là "đã đến nơi" khi cách mục tiêu trong bán kính này (tính bằng block).
-   `canBreakBlocks`: Cho phép bot phá các khối cản đường (`true`/`false`).
-   `canPlaceBlocks`: Cho phép bot đặt khối để bắc cầu hoặc vượt chướng ngại vật (`true`/`false`).
-   `allowSprinting`: Cho phép bot chạy nước rút khi di chuyển (`true`/`false`).
-   `allowParkour`: Cho phép bot thực hiện các cú nhảy parkour để vượt địa hình (`true`/`false`).

### Cấu hình Module Test (`testModule`)
-   `enable`: Bật hoặc tắt module test di chuyển bằng lệnh chat (`true`/`false`).
-   `commandPrefix`: Ký tự tiền tố cho các lệnh chat (ví dụ: "!", ".", "#").

## CÁCH SỬ DỤNG

### 1. Kịch bản Điều hướng (Menu Navigation)
Nếu `enableLoginMenu` là `true`, bot sẽ đọc và thực thi các lệnh trong file `login_manual.txt`.

Các lệnh hợp lệ:
-   `w[số]`: Chờ `[số]` giây. (Ví dụ: `w5`)
-   `r`: Click chuột phải.
-   `l`: Click chuột trái (vung tay).
-   `c[số]`: Click vào ô thứ `[số]` trong giao diện (GUI). (Ví dụ: `c10`)
-   `0`: Kết thúc kịch bản.
-   Bất kỳ chuỗi nào khác sẽ được bot chat ra server. (Ví dụ: `/login matkhau123`)

### 2. Điều khiển Di chuyển qua Chat
Nếu `testModule.enable` là `true`, bạn có thể ra lệnh cho bot di chuyển trong game bằng cách chat.

**Cú pháp:** `<tiền tố>goto <x> <y> <z>`

**Ví dụ:** Nếu `commandPrefix` là `"!"`, bạn có thể chat:
```
!goto 100 64 -250
```
Bot sẽ tự động tìm đường và di chuyển đến tọa độ (X=100, Y=64, Z=-250) và thông báo khi đến nơi hoặc khi không thể tìm thấy đường đi.

## CHẠY BOT
Để khởi động bot, mở terminal trong thư mục gốc của dự án và chạy lệnh:
```
node index.js
```
Bot sẽ bắt đầu kết nối tới server và thực hiện các hành động đã được cấu hình. Các thông báo và lỗi sẽ được hiển thị trên console.
