import { getPool } from '../config/database';

const checkUnits = async () => {
    const pool = getPool();
    try {
        const res = await pool.query('SELECT * FROM units');
        console.log('Units count:', res.rowCount);
        console.log('Units:', res.rows);
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        process.exit();
    }
};

checkUnits();
