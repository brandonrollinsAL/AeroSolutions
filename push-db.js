// This script runs the drizzle-kit push command to update the database schema
import { execSync } from 'child_process';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function main() {
  console.log('Pushing database schema changes...');

  try {
    // Run drizzle-kit push
    execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });
    console.log('Schema push completed successfully!');
    
    // Add sample portfolio items
    console.log('Adding sample portfolio items...');
    
    // Create a database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    try {
      // Check if there are already portfolio items
      const checkResult = await pool.query('SELECT COUNT(*) FROM portfolio_items');
      
      if (parseInt(checkResult.rows[0].count) === 0) {
        console.log('Inserting sample portfolio items...');
        
        // Insert sample data
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
        console.log('Portfolio items already exist, skipping sample data insertion.');
      }
    } catch (error) {
      console.error('Error adding sample portfolio items:', error);
    } finally {
      await pool.end();
    }
    
  } catch (error) {
    console.error('Error pushing schema changes:', error);
    process.exit(1);
  }
}

main();