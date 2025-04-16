// DB Push Script to update schema in the database
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema.js';

// Set WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Log the database URL without the password for safety
const dbUrlWithoutPassword = process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@');
console.log(`Connecting to database: ${dbUrlWithoutPassword}`);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

console.log('Pushing schema changes to database...');

// Use direct schema synchronization to push schema changes
async function pushSchema() {
  try {
    // Create portfolio_items table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_items (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        industry_type TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        website_url TEXT,
        technologies JSONB NOT NULL DEFAULT '[]',
        features JSONB NOT NULL DEFAULT '[]',
        testimonial TEXT,
        completion_date DATE,
        featured BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Schema push completed successfully!');
    
    // Populate with sample portfolio items if the table is empty
    const { rows: existingItems } = await pool.query('SELECT COUNT(*) FROM portfolio_items');
    
    if (parseInt(existingItems[0].count) === 0) {
      console.log('Adding sample portfolio items...');
      
      await pool.query(`
        INSERT INTO portfolio_items (
          client_name, 
          title, 
          description, 
          industry_type, 
          thumbnail_url, 
          website_url, 
          technologies, 
          features, 
          featured
        ) VALUES 
        (
          'Sample Bakery', 
          'Artisanal Bakery Website', 
          'A modern website for a local bakery showcasing their products and offering online ordering capabilities.', 
          'Food & Beverage', 
          'https://placehold.co/600x400/png?text=Bakery', 
          'https://samplebakery.com', 
          '["React", "Node.js", "Stripe", "Tailwind CSS"]', 
          '["Online Ordering", "Custom Cake Designer", "Newsletter Signup", "Location Map"]', 
          true
        ),
        (
          'Mountain Fitness', 
          'Fitness Studio Management System', 
          'Complete digital solution for a fitness studio with class scheduling, membership management, and trainer profiles.', 
          'Health & Fitness', 
          'https://placehold.co/600x400/png?text=Fitness', 
          'https://mountainfitness.com', 
          '["React", "Express", "PostgreSQL", "Framer Motion"]', 
          '["Class Booking", "Membership Management", "Trainer Profiles", "Progress Tracking"]', 
          true
        ),
        (
          'TechSolutions Inc', 
          'Enterprise Portal Redesign', 
          'Complete overhaul of a corporate enterprise portal improving user experience and adding modern functionality.', 
          'Technology', 
          'https://placehold.co/600x400/png?text=TechSolutions', 
          'https://techsolutions-portal.com', 
          '["React", "TypeScript", "GraphQL", "Node.js"]', 
          '["Single Sign-On", "Analytics Dashboard", "Document Management", "Team Collaboration Tools"]', 
          false
        );
      `);
      
      console.log('Sample portfolio items added successfully!');
    } else {
      console.log('Portfolio items already exist, skipping sample data creation.');
    }
    
  } catch (error) {
    console.error('Error pushing schema changes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

pushSchema();