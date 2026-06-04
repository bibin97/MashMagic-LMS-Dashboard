require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const updateFacultyIds = async () => {
    let connection;
    try {
        console.log("Connecting to database...");
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'mashmagic'
        });

        console.log("Connected. Fetching existing faculties...");
        const [faculties] = await connection.query('SELECT id, name FROM users WHERE role = "faculty" ORDER BY id ASC');
        
        console.log(`Found ${faculties.length} faculties to update.`);

        let counter = 1;
        for (const faculty of faculties) {
            const facId = `FAC-${String(counter).padStart(2, '0')}`;
            await connection.query('UPDATE users SET faculty_id_card = ? WHERE id = ?', [facId, faculty.id]);
            await connection.query('UPDATE faculties SET faculty_id_card = ? WHERE id = ?', [facId, faculty.id]);
            console.log(`Updated faculty: ${faculty.name} (ID: ${faculty.id}) -> ${facId}`);
            counter++;
        }

        console.log("Finished updating faculty IDs successfully.");
    } catch (error) {
        console.error("Error during migration:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Database connection closed.");
        }
    }
};

updateFacultyIds();
