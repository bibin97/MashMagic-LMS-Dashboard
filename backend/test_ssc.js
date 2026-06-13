const jwt = require('jsonwebtoken');

async function test() {
    const token = jwt.sign({ id: 1, role: 'ssc' }, 'supersecretkey123', { expiresIn: '1h' });
    try {
        const res = await fetch('http://127.0.0.1:5000/api/ssc/faculties-all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Faculties:", data);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
