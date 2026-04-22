import { Pool } from 'pg';

// Note: In production (Render), environment variables are provided directly
// dotenv is only needed for local development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// PostgreSQL Configuration
const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

console.log('🔍 Environment Check:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DATABASE_URL exists:', !!connectionString);
console.log('   Connection string preview:', connectionString ? connectionString.substring(0, 30) + '...' : 'MISSING');

const poolConfig = connectionString ? {
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
} : {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

/**
 * Initialize PostgreSQL connection pool
 */
export const initializePool = async (): Promise<Pool> => {
    try {
        console.log('🔄 Connecting to PostgreSQL...');

        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database:', process.env.DB_NAME || 'via connection string');
        client.release();

        pool.on('error', (err) => {
            console.error('❌ PostgreSQL pool error:', err);
        });

        return pool;
    } catch (error) {
        console.error('❌ Failed to connect to PostgreSQL:', error);
        throw error;
    }
};

/**
 * Get pool instance
 */
export const getPool = (): Pool => {
    return pool;
};

/**
 * Execute query with logging
 */
export const query = async (queryText: string, params?: any[]): Promise<any> => {
    const start = Date.now();
    try {
        const result = await pool.query(queryText, params);
        const duration = Date.now() - start;

        console.log('✅ Query executed', {
            duration: `${duration}ms`,
            rows: result.rowCount || 0,
        });

        return result;
    } catch (error) {
        console.error('❌ Query error:', error);
        console.error('Query text:', queryText.substring(0, 100));
        throw error;
    }
};

/**
 * Close pool connection
 */
export const closePool = async (): Promise<void> => {
    try {
        await pool.end();
        console.log('✅ PostgreSQL connection pool closed');
    } catch (error) {
        console.error('❌ Error closing pool:', error);
        throw error;
    }
};

export default {
    initializePool,
    getPool,
    query,
    closePool,
};
