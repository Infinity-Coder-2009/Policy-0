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
    
    // Split by statements and run individually
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await client.query(stmt);
          console.log('✓ Executed:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
        } catch (err) {
          console.log('✗ Error:', err.message.substring(0, 100));
        }
      }
    }

    console.log('\nMigrations complete!');
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

runMigrations();
