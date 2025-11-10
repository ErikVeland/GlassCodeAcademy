const { Client } = require('pg');

// Connect to default postgres database to create our database
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres', // Connect to default database first
});

async function createDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Check if database exists
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'glasscode_dev'"
    );
    
    if (res.rows.length === 0) {
      console.log('Database glasscode_dev does not exist. Creating...');
      await client.query('CREATE DATABASE glasscode_dev');
      console.log('✅ Database glasscode_dev created successfully');
    } else {
      console.log('✅ Database glasscode_dev already exists');
    }
    
    await client.end();
    console.log('✅ Connection closed');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createDatabase();