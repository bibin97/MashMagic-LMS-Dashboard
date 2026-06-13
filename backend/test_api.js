const axios = require('axios');
async function run() {
    try {
        const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
            email: 'ssc@mashmagic.com', // wait, I don't know the SSC email.
            password: 'password123' 
        });
        console.log(loginRes.data);
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
