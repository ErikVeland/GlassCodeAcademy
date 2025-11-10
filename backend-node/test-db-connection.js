const { Client } = require('pg');

// Database configuration
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'glasscode_dev',
});

async function testConnection() {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL');
    
    // Test query
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database query successful:', res.rows[0]);
    
    await client.end();
    console.log('✅ Connection closed');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();