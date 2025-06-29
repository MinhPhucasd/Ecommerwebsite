// Backend/hashPassword.js
const bcrypt = require('bcryptjs');

// -------------------------------------------------------------------------
// THAY ĐỔI MẬT KHẨU GỐC BẠN MUỐN DÙNG CHO ADMIN VÀO ĐÂY
// -------------------------------------------------------------------------
const plainPassword = '123456'; // Ví dụ: đặt mật khẩu là '123456'
// -------------------------------------------------------------------------

async function generateHash() {
    if (!plainPassword) {
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        console.error('!!! LỖI: Vui lòng đặt giá trị cho plainPassword !!!');
        console.error('!!! trong file Backend/hashPassword.js           !!!');
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        return;
    }

    try {
        const saltRounds = 10; // Số vòng salt, 10 là giá trị phổ biến và an toàn
        console.log(`\nĐang băm mật khẩu: "${plainPassword}" với ${saltRounds} vòng salt...`);

        const salt = await bcrypt.genSalt(saltRounds);
        console.log('Salt đã tạo:', salt);

        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        console.log('\n================ KẾT QUẢ BĂM MẬT KHẨU ================');
        console.log('Mật khẩu gốc (Plain Password):', plainPassword);
        console.log('Mật khẩu đã băm (Hashed Password):', hashedPassword);
        console.log('=========================================================');
        console.log('\n>>> HÃY SAO CHÉP GIÁ TRỊ "Hashed Password" Ở TRÊN <<<');
        console.log('>>> và cập nhật vào trường "password" của user admin trong MongoDB. <<<\n');

    } catch (error) {
        console.error('\nLỖI KHI BĂM MẬT KHẨU:', error);
    }
}

generateHash();