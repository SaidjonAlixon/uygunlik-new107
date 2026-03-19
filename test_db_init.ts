import { initializeDatabase } from './lib/postgres';

require('dotenv').config();

async function testInit() {
    try {
        console.log('Testing DB init...');
        await initializeDatabase();
        console.log('Success!');
    } catch (error) {
        console.error('Initialisation Error:', error);
    } finally {
        process.exit(0);
    }
}

testInit();
