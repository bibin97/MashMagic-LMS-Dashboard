const db = require('./config/db.js');

async function fixDemoIds() {
    try {
        const [demos] = await db.query('SELECT id FROM aoe_demo_schedules ORDER BY created_at ASC');
        for (let i = 0; i < demos.length; i++) {
            const demoIdStr = `DE${String(i + 1).padStart(2, '0')}`;
            await db.query('UPDATE aoe_demo_schedules SET demo_id = ? WHERE id = ?', [demoIdStr, demos[i].id]);
            console.log(`Updated ID ${demos[i].id} to ${demoIdStr}`);
        }
        console.log('Successfully updated all demo IDs');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

fixDemoIds();
