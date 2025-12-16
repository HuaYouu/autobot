/**
 * Module tiện ích: Tự động gửi lệnh đăng ký và đăng nhập.
 * Được gọi ngay sau khi bot kết nối, trước khi bot spawn.
 * @param {import('mineflayer').Bot} bot - Instance của bot.
 * @param {object} botConfig - Đối tượng cấu hình riêng của bot đó.
 */
function autoAuth(bot, botConfig) {
  // Kiểm tra xem bot có được cấu hình mật khẩu không
  if (!botConfig.password) {
    return;
  }

  const password = botConfig.password;

  // Sử dụng 'login' event vì nó được kích hoạt ngay khi kết nối thành công,
  // thường là thời điểm thích hợp nhất để gửi thông tin xác thực.
  bot.once('login', () => {
    // Đợi một chút để server có thời gian xử lý việc bot vào
    setTimeout(() => {
      console.log(`[${bot.username}] Gửi lệnh xác thực...`);
      bot.chat(`/register ${password} ${password}`);
      bot.chat(`/login ${password}`);
    }, 1500); // Đợi 1.5 giây
  });
}

module.exports = autoAuth;
