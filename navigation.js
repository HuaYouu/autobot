// Import các thư viện cần thiết
const fs = require('fs');
const path = require('path');

// Hàm tiện ích để tạo delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Phân tích một chuỗi kịch bản thành một mảng các lệnh.
 * Hỗ trợ các lệnh được đặt trong dấu ngoặc kép để chứa khoảng trắng.
 * @param {string} scriptContent - Nội dung của file kịch bản.
 * @returns {string[]} Một mảng các lệnh.
 * @throws {Error} Nếu có lỗi cú pháp (ví dụ: dấu ngoặc kép không được đóng).
 */
function parseScript(scriptContent) {
  // Regex để tìm các chuỗi trong ngoặc kép hoặc các từ không có khoảng trắng
  const regex = /"([^"]*)"|\S+/g;
  const commands = [];
  let match;

  while ((match = regex.exec(scriptContent)) !== null) {
    // Nếu match[1] tồn tại, đó là nội dung bên trong dấu ngoặc kép.
    // Nếu không, đó là một từ bình thường (match[0]).
    commands.push(match[1] ? match[1] : match[0]);
  }

  // Kiểm tra xem có dấu ngoặc kép nào chưa được đóng không
  if ((scriptContent.match(/"/g) || []).length % 2 !== 0) {
    throw new Error('Lỗi cú pháp: Dấu ngoặc kép không được đóng lại.');
  }

  return commands;
}

/**
 * Đọc và thực thi kịch bản điều hướng từ một file được chỉ định.
 * @param {import('mineflayer').Bot} bot - Instance của bot.
 * @param {string} scriptPath - Đường dẫn đến file kịch bản.
 * @param {() => void} onFinish - Callback sẽ được gọi khi kịch bản hoàn tất hoặc không tồn tại.
 */
async function showLoginMenu(bot, scriptPath, onFinish) {
  try {
    const scriptContent = await fs.promises.readFile(scriptPath, 'utf8');
    const commands = parseScript(scriptContent);

    console.log('Bắt đầu thực thi kịch bản điều hướng...');

    for (const command of commands) {
      try {
        if (command.startsWith('w')) {
          const waitTime = parseInt(command.substring(1), 10);
          if (isNaN(waitTime)) {
            console.error(`Lỗi cú pháp lệnh chờ: "${command}". Thời gian không hợp lệ.`);
            break;
          }
          console.log(`- Đang chờ ${waitTime} giây...`);
          await delay(waitTime * 1000);
        } else if (command === 'r') {
          if (bot.entity) {
            console.log('- Thực hiện: Click chuột phải.');
            bot.activateItem();
          } else {
            console.warn('- Cảnh báo: Không thể click chuột phải vì bot.entity không tồn tại.');
          }
        } else if (command === 'l') {
            console.log('- Thực hiện: Click chuột trái (swing arm).');
            bot.swingArm('left');
        } else if (command.startsWith('c')) {
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
            break;
          }
        } else if (command === '0') {
          console.log('- Kịch bản con hoàn tất.');
          break;
        } else {
          console.log(`- Thực hiện: Chat "${command}"`);
          bot.chat(command);
        }
      } catch (err) {
          console.error(`Lỗi khi thực thi lệnh "${command}":`, err.message);
          console.log('Đã dừng kịch bản do có lỗi.');
          break;
      }
    }

    console.log('Hoàn tất quá trình điều hướng tự động.');
    onFinish();

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Không tìm thấy file kịch bản tại "${scriptPath}". Bỏ qua bước điều hướng.`);
      onFinish();
    } else {
      console.error('Đã xảy ra lỗi khi đọc hoặc phân tích kịch bản:', error.message);
      // Dừng bot ở đây thay vì tiếp tục, vì lỗi cú pháp có thể gây ra hành vi không mong muốn.
    }
  }
}

module.exports = {
  showLoginMenu
};
