const { Client } = require('pg');
const fs = require('fs');

async function runMigrations() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Abubest1234!@db.vhqesxqjwqjqzhnulxez.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase');

    const sql = fs.readFileSync('./supabase/migrations/20250101000000_init.sql', 'utf-8');
    
    // Execute the entire SQL
    await client.query(sql);
    
    console.log('Migrations complete!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
