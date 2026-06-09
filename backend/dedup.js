const mysql = require('mysql2/promise');

async function run() {
    try {
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '', // Try empty password first as xampp default
            database: 'mashmagic'
        });
        const [rows] = await conn.query('SELECT * FROM students');
        const groups = {};
        for(const r of rows) {
            const key = r.contact || r.email || r.registration_number || r.name;
            if(!key) continue;
            if(!groups[key]) groups[key] = [];
            groups[key].push(r);
        }
        const toDelete = [];
        for(const key in groups) {
            if(groups[key].length > 1) {
                const sorted = groups[key].sort((a,b) => {
                    const aCount = Object.values(a).filter(v => v !== null && v !== '').length;
                    const bCount = Object.values(b).filter(v => v !== null && v !== '').length;
                    return bCount - aCount;
                });
                for(let i = 1; i < sorted.length; i++) {
                    toDelete.push(sorted[i].id);
                }
            }
        }
        console.log('Duplicates to delete:', toDelete.length);
        if(toDelete.length > 0) {
            await conn.query('DELETE FROM students WHERE id IN (?)', [toDelete]);
            console.log('Deleted successfully.');
        }
        await conn.end();
        process.exit(0);
    } catch(e) {
        if(e.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log("Empty password failed, trying MashMagic2026!");
            try {
                const conn2 = await mysql.createConnection({
                    host: '127.0.0.1',
                    user: 'root',
                    password: 'MashMagic2026!',
                    database: 'mashmagic'
                });
                const [rows] = await conn2.query('SELECT * FROM students');
                const groups = {};
                for(const r of rows) {
                    const key = r.contact || r.email || r.registration_number || r.name;
                    if(!key) continue;
                    if(!groups[key]) groups[key] = [];
                    groups[key].push(r);
                }
                const toDelete = [];
                for(const key in groups) {
                    if(groups[key].length > 1) {
                        const sorted = groups[key].sort((a,b) => {
                            const aCount = Object.values(a).filter(v => v !== null && v !== '').length;
                            const bCount = Object.values(b).filter(v => v !== null && v !== '').length;
                            return bCount - aCount;
                        });
                        for(let i = 1; i < sorted.length; i++) {
                            toDelete.push(sorted[i].id);
                        }
                    }
                }
                console.log('Duplicates to delete (2nd try):', toDelete.length);
                if(toDelete.length > 0) {
                    await conn2.query('DELETE FROM students WHERE id IN (?)', [toDelete]);
                    console.log('Deleted successfully.');
                }
                await conn2.end();
                process.exit(0);
            } catch(err2) {
                console.error(err2);
                process.exit(1);
            }
        } else {
            console.error(e);
            process.exit(1);
        }
    }
}
run();
