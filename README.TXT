MINECRAFT BOT - KIẾN TRÚC MODULE
===================================

Đây là một bot Minecraft được xây dựng bằng Node.js và thư viện Mineflayer, với kiến trúc module linh hoạt cho phép bật/tắt các chức năng trong lúc bot đang chạy.

## KIẾN TRÚC MODULE
Dự án được tổ chức thành hai loại module chính:
-   **Modules Chức năng (`modules/features/`)**: Các module có thể bật/tắt, chứa logic cho một tính năng cụ thể (ví dụ: tự farm, tự đánh).
-   **Modules Tiện ích (`modules/utils/`)**: Các thư viện tái sử dụng, cung cấp các hàm tiện ích (ví dụ: module di chuyển) và luôn sẵn sàng để được gọi.

## YÊU CẦU
- Node.js (khuyên dùng phiên bản LTS mới nhất)
- npm (thường đi kèm với Node.js)

## CÀI ĐẶT
1.  Mở terminal trong thư mục gốc của dự án.
2.  Chạy lệnh `npm install` để cài đặt các thư viện cần thiết.

## CẤU HÌNH (`settings.json`)
File `settings.json` là trung tâm cấu hình của bot.

### Cấu hình Chung
-   `host`, `port`, `username`, `auth`, `version`: Thông tin kết nối server.
-   `enableLoginMenu`: Bật/tắt kịch bản điều hướng menu khi đăng nhập.

### Cấu hình Module Tiện ích
-   `movementOptions`: Chứa các tham số cho module di chuyển (tiện ích).
    -   `goalRadius`, `canBreakBlocks`, `canPlaceBlocks`, v.v.

### Cấu hình Modules Chức năng (`modules`)
Mục này quản lý trạng thái và cấu hình cho các module chức năng.
-   Mỗi key trong mục `modules` là tên của một module chức năng.
-   `enabled`: Trạng thái mặc định của module khi bot khởi động (`true` hoặc `false`).
-   `options`: Chứa các tham số riêng của module đó.

**Ví dụ cấu trúc `modules`:**
```json
"modules": {
  "commandManager": {
    "enabled": true,
    "options": {
      "commandPrefix": "!"
    }
  },
  "movementController": {
    "enabled": true,
    "options": {
      "commandPrefix": "!"
    }
  }
}
```

## CÁCH SỬ DỤNG

### 1. Kịch bản Điều hướng (Menu Navigation)
-   Nếu `enableLoginMenu` là `true`, bot sẽ thực thi các lệnh trong `login_manual.txt`.
-   **Cú pháp mới:** Để chat một lệnh chứa khoảng trắng, hãy đặt nó trong dấu ngoặc kép (ví dụ: `"/register pass123 pass123"`).

### 2. Tương tác qua Chat
Các lệnh chat được quản lý bởi các module chức năng.

#### a. Module `commandManager`
Module này cho phép bạn bật/tắt các module khác trong lúc bot đang chạy.
-   **Cú pháp:** `<tiền tố>module <tên_module> <on|off>`
-   **Ví dụ:** `!module movementController off` (sẽ tắt chức năng di chuyển bằng lệnh `!goto`)
-   **Lưu ý:** Thay đổi này sẽ được **lưu lại** vào file `settings.json`.

#### b. Module `movementController`
Module này cho phép bạn ra lệnh cho bot di chuyển đến một tọa độ.
-   **Cú pháp:** `<tiền tố>goto <x> <y> <z>`
-   **Ví dụ:** `!goto 100 64 -250`
-   Module này có thể được bật/tắt bằng `commandManager`.

## CHẠY BOT
Để khởi động bot, mở terminal và chạy lệnh:
```
node index.js
```
