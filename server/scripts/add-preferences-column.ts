import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Migration script to add the preferences column to the users table
 */
async function addPreferencesColumn() {
  try {
    console.log('Adding preferences column to users table');

    // Check if the column already exists
    const checkColumnSql = sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'preferences';
    `;
    const columnsResult = await db.execute(checkColumnSql);
    
    // If the column doesn't exist, add it
    if (columnsResult.rows.length === 0) {
      const alterTableSql = sql`
        ALTER TABLE users
        ADD COLUMN preferences TEXT;
      `;
      await db.execute(alterTableSql);
      console.log('Preferences column added successfully');
    } else {
      console.log('Preferences column already exists');
    }
    
    // Update existing users with default preferences
    const updatePreferencesSql = sql`
      UPDATE users
      SET preferences = 'business growth, web development, small business'
      WHERE preferences IS NULL;
    `;
    
    await db.execute(updatePreferencesSql);
    console.log('Default preferences set for existing users');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
addPreferencesColumn();