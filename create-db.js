const { Client } = require('pg');

async function createDatabaseAndUser() {
  // Connect to default PostgreSQL database
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Create database
    try {
      await client.query('CREATE DATABASE glasscode_dev');
      console.log('Database glasscode_dev created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Database glasscode_dev already exists');
      } else {
        throw err;
      }
    }

    // Create user
    try {
      await client.query("CREATE USER glasscode_user WITH PASSWORD 'secure_password_change_me'");
      console.log('User glasscode_user created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('User glasscode_user already exists');
      } else {
        throw err;
      }
    }

    // Grant privileges
    await client.query('GRANT ALL PRIVILEGES ON DATABASE glasscode_dev TO glasscode_user');
    console.log('Privileges granted');

    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

createDatabaseAndUser();