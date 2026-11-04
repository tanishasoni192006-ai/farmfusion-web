/**
 * Database Initialization Script for FarmFusion Web
 * Reads and executes farmfusion.sql against the target MySQL server
 * Run via: npm run init-db
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    console.log('==================================================');
    console.log('   FarmFusion Web - Database Setup & Migrations   ');
    console.log('==================================================');

    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: Number(process.env.DB_PORT) || 3306,
        multipleStatements: true
    };

    console.log(`Connecting to MySQL Server at ${config.host}:${config.port} as user '${config.user}'...`);

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✓ Successfully connected to MySQL server.');

        const sqlFilePath = path.join(__dirname, '..', 'farmfusion.sql');
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`farmfusion.sql file not found at ${sqlFilePath}`);
        }

        console.log('Reading SQL script from farmfusion.sql...');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing database schema creation and seed insertion...');
        await connection.query(sqlScript);

        console.log('✓ Database `farmfusion_db` created and populated successfully!');
        console.log('✓ Tables ready: users, farmer_profiles, reminders, expenses, crop_information, disease_information, market_prices.');
        console.log('✓ Sample test account created:');
        console.log('    Email: ramesh@farmfusion.in');
        console.log('    Password: farmer123');
        console.log('==================================================');
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Ensure MySQL is running (Start MySQL in XAMPP / WAMP or start the MySQL service).');
        console.log('2. Verify your DB_PASSWORD in the .env file.');
        console.log('3. Alternatively, import farmfusion.sql directly via phpMyAdmin or MySQL Workbench.');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initializeDatabase();
