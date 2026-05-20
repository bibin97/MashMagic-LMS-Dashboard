const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    const pwd = process.env.DB_PASSWORD;
    console.log('DB_PASSWORD length:', pwd ? pwd.length : 'undefined');
    if (pwd) {
        console.log('DB_PASSWORD char codes:', Array.from(pwd).map(c => `${c} (${c.charCodeAt(0)})`));
    }
}
