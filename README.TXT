MINECRAFT BOT TỰ ĐỘNG ĐIỀU HƯỚNG MENU
=========================================

Đây là một bot Minecraft được xây dựng bằng Node.js và thư viện Mineflayer.
Bot có khả năng tự động đăng nhập và thực hiện một chuỗi hành động điều hướng qua menu của server dựa trên một file kịch bản.

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

-   `host`: Địa chỉ IP của server Minecraft. (Mặc định: "localhost")
-   `port`: Cổng của server Minecraft. (Mặc định: 25565)
-   `username`: Tên nhân vật của bot. (Mặc định: "MyBot")
-   `auth`: Phương thức xác thực. Đặt là "offline" cho các server không yêu cầu bản quyền (cracked), hoặc "microsoft" cho các server yêu cầu tài khoản Microsoft chính thức. (Mặc định: "offline")
-   `enableLoginMenu`: Bật/tắt chức năng điều hướng menu tự động.
    -   `true`: Khi bot vào server, nó sẽ đọc và thực hiện các lệnh trong file `login_manual.txt`.
    -   `false`: Bot sẽ bỏ qua file kịch bản và đi thẳng vào logic chính sau khi vào server.

## KỊCH BẢN ĐIỀU HƯỚNG
File `login_manual.txt` chứa chuỗi lệnh mà bot sẽ thực hiện tuần tự. Các lệnh được phân tách bởi khoảng trắng.

Các lệnh hợp lệ:
-   `w[số]`: Chờ `[số]` giây. (Ví dụ: `w5` là chờ 5 giây)
-   `r`: Click chuột phải.
-   `l`: Click chuột trái (vung tay).
-   `c[số]`: Click vào ô thứ `[số]` trong giao diện (GUI) đang mở. (Ví dụ: `c10` là click vào ô số 10)
-   `0`: Kết thúc kịch bản. Bất kỳ lệnh nào sau lệnh này sẽ bị bỏ qua.
-   Bất kỳ chuỗi nào khác sẽ được bot chat ra server. (Ví dụ: `/login matkhau123`)

**Ví dụ kịch bản trong `login_manual.txt`:**
`w2 r w1 c23 w1 /home w1 0`
-   Chờ 2 giây.
-   Click chuột phải.
-   Chờ 1 giây.
-   Click vào ô số 23.
-   Chờ 1 giây.
-   Chat lệnh "/home".
-   Chờ 1 giây.
-   Kết thúc kịch bản.

## CHẠY BOT
Để khởi động bot, mở terminal trong thư mục gốc của dự án và chạy lệnh:
```
node index.js
```
Bot sẽ bắt đầu kết nối tới server và thực hiện các hành động đã được cấu hình. Các thông báo và lỗi sẽ được hiển thị trên console.
