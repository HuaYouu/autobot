// Import các thư viện cần thiết
const fs = require('fs');
const path = require('path');

// Hàm tiện ích để tạo delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Đọc và thực thi kịch bản điều hướng từ file login_manual.txt.
 * @param {import('mineflayer').Bot} bot - Instance của bot.
 * @param {() => void} onManualLogin - Callback sẽ được gọi khi kịch bản hoàn tất hoặc không tồn tại.
 */
async function showLoginMenu(bot, onManualLogin) {
  const scriptPath = path.join(__dirname, 'login_manual.txt');

  try {
    // Đọc nội dung file kịch bản
    const scriptContent = await fs.promises.readFile(scriptPath, 'utf8');
    const commands = scriptContent.trim().split(/\s+/);

    console.log('Bắt đầu thực thi kịch bản điều hướng...');

    // Lặp qua từng lệnh trong kịch bản
    for (const command of commands) {
      try {
        if (command.startsWith('w')) {
          // Lệnh chờ (wait)
          const waitTime = parseInt(command.substring(1), 10);
          if (isNaN(waitTime)) {
            console.error(`Lỗi cú pháp lệnh chờ: "${command}". Thời gian không hợp lệ.`);
            break; // Dừng kịch bản nếu cú pháp sai
          }
          console.log(`- Đang chờ ${waitTime} giây...`);
          await delay(waitTime * 1000);
        } else if (command === 'r') {
          // Lệnh click chuột phải
          if (bot.entity) {
            console.log('- Thực hiện: Click chuột phải.');
            bot.activateItem();
          } else {
            console.warn('- Cảnh báo: Không thể click chuột phải vì bot.entity không tồn tại.');
          }
        } else if (command === 'l') {
            // Lệnh click chuột trái (gõ tay)
            console.log('- Thực hiện: Click chuột trái (swing arm).');
            bot.swingArm('left');
        } else if (command.startsWith('c')) {
          // Lệnh click vào slot trong GUI
          const slot = parseInt(command.substring(1), 10) - 1;
          if (isNaN(slot) || slot < 0) {
             console.error(`Lỗi cú pháp lệnh click: "${command}". Slot không hợp lệ.`);
             break;
          }
          if (bot.currentWindow) {
            console.log(`- Thực hiện: Click vào slot ${slot + 1}.`);
            await bot.clickWindow(slot, 0, 0);
          } else {
            console.error('- Lỗi: Không thể thực hiện lệnh click vì không có cửa sổ (GUI) nào đang mở.');
            break; // Dừng kịch bản nếu không có GUI
          }
        } else if (command === '0') {
          // Lệnh kết thúc kịch bản
          console.log('- Kịch bản con hoàn tất.');
          break; // Thoát khỏi vòng lặp
        } else {
          // Các lệnh khác được coi là lệnh chat
          console.log(`- Thực hiện: Chat "${command}"`);
          bot.chat(command);
        }
      } catch (err) {
          console.error(`Lỗi khi thực thi lệnh "${command}":`, err.message);
          console.log('Đã dừng kịch bản do có lỗi.');
          break; // Dừng kịch bản khi có lỗi
      }
    }

    // Sau khi vòng lặp kết thúc (do hoàn thành hoặc do break)
    console.log('Hoàn tất quá trình điều hướng tự động.');
    onManualLogin();

  } catch (error) {
    // Xử lý lỗi nếu không tìm thấy file kịch bản
    if (error.code === 'ENOENT') {
      console.log('Không tìm thấy file "login_manual.txt". Bỏ qua bước điều hướng.');
      onManualLogin(); // Gọi callback để chuyển sang logic chính
    } else {
      // Các lỗi đọc file khác
      console.error('Đã xảy ra lỗi khi đọc file kịch bản:', error);
      onManualLogin(); // Vẫn gọi callback để bot không bị kẹt
    }
  }
}

// Xuất hàm để có thể sử dụng ở file khác
module.exports = {
  showLoginMenu
};
