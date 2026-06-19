import fs from 'fs/promises';
import path from 'path';
import pool from '../lib/db';

async function seed() {
  try {
    const sqlDir = path.join(process.cwd(), 'app', 'database', 'sql');
    const files = await fs.readdir(sqlDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    if (sqlFiles.length === 0) {
      console.log('No SQL files found in app/database/sql');
      return;
    }

    console.log(`Found ${sqlFiles.length} SQL files. Starting execution...`);

    for (const file of sqlFiles) {
      console.log(`Executing ${file}...`);
      const filePath = path.join(sqlDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      // Execute the SQL file content
      await pool.query(sql);
      console.log(`Successfully executed ${file}`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the database pool so the script can exit
    await pool.end();
  }
}

seed();
