import { db } from '../db';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { users, userAchievements, achievements, insertUserAchievementSchema } from '@shared/schema';
import { grokApi } from '../grok';

/**
 * Achievement Service
 * Handles checking and granting achievements to users
 */

// Check for new user achievements
export async function checkForNewAchievements(): Promise<number> {
  let newAchievementsCount = 0;

  try {
    // Get all achievements
    const achievementDefinitions = await db.select().from(achievements);
    
    // Get users
    const allUsers = await db.select().from(users);
    
    // Process each user
    for (const user of allUsers) {
      // Process each achievement type
      for (const achievement of achievementDefinitions) {
        // Check if user already has this achievement
        const existing = await db.select().from(userAchievements)
          .where(
            and(
              eq(userAchievements.userId, user.id),
              eq(userAchievements.type, achievement.type)
            )
          );
        
        // Skip if already earned
        if (existing.length > 0) {
          continue;
        }
        
        // Check achievement criteria
        const achievementEarned = await checkAchievementCriteria(user, achievement);
        
        if (achievementEarned) {
          // Award achievement with AI-generated personalized message
          await awardAchievement(user, achievement);
          newAchievementsCount++;
        }
      }
    }
    
    return newAchievementsCount;
  } catch (error) {
    console.error('Error in checkForNewAchievements:', error);
    return 0;
  }
}

// Check for special day achievements (birthdays, anniversaries)
export async function checkForSpecialDays(): Promise<number> {
  let specialDayAchievementsCount = 0;
  
  try {
    // Get users with birthdays or anniversaries today
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDay = today.getDate();
    
    // Find users with birthdays today (if they have a birthday set)
    const birthdayUsers = await db.select()
      .from(users)
      .where(
        and(
          sql`EXTRACT(MONTH FROM "birthdate") = ${todayMonth}`,
          sql`EXTRACT(DAY FROM "birthdate") = ${todayDay}`
        )
      );
    
    // Find users with account anniversary today
    const anniversaryUsers = await db.select()
      .from(users)
      .where(
        and(
          sql`EXTRACT(MONTH FROM "created_at") = ${todayMonth}`,
          sql`EXTRACT(DAY FROM "created_at") = ${todayDay}`,
          // Only include if it's at least the 1 year anniversary
          sql`EXTRACT(YEAR FROM AGE(CURRENT_DATE, "created_at")) >= 1`
        )
      );
    
    // Process birthday achievements
    for (const user of birthdayUsers) {
      // Check if already awarded birthday achievement this year
      const currentYear = today.getFullYear();
      const existingBirthday = await db.select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, user.id),
            eq(userAchievements.type, 'birthday'),
            gte(userAchievements.createdAt, new Date(currentYear, 0, 1)) // Start of current year
          )
        );
      
      if (existingBirthday.length === 0) {
        // Find or create birthday achievement type
        let birthdayAchievement = await db.select()
          .from(achievements)
          .where(eq(achievements.type, 'birthday'))
          .then(rows => rows[0]);
        
        if (!birthdayAchievement) {
          // Create birthday achievement definition if it doesn't exist
          const [newAchievement] = await db.insert(achievements)
            .values({
              type: 'birthday',
              title: 'Happy Birthday!',
              description: 'Celebrating another year with you',
              icon: 'cake',
              points: 25,
              criteria: { type: 'special_day', day: 'birthday' }
            })
            .returning();
          
          birthdayAchievement = newAchievement;
        }
        
        // Award achievement with personalized message
        await awardAchievement(user, birthdayAchievement);
        specialDayAchievementsCount++;
      }
    }
    
    // Process anniversary achievements
    for (const user of anniversaryUsers) {
      // Check how many years as a member
      const joinDate = new Date(user.createdAt);
      const years = today.getFullYear() - joinDate.getFullYear();
      
      // Check if already awarded anniversary achievement this year
      const currentYear = today.getFullYear();
      const existingAnniversary = await db.select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, user.id),
            eq(userAchievements.type, 'anniversary'),
            gte(userAchievements.createdAt, new Date(currentYear, 0, 1)) // Start of current year
          )
        );
      
      if (existingAnniversary.length === 0) {
        // Find or create anniversary achievement type
        let anniversaryAchievement = await db.select()
          .from(achievements)
          .where(eq(achievements.type, 'anniversary'))
          .then(rows => rows[0]);
        
        if (!anniversaryAchievement) {
          // Create anniversary achievement definition if it doesn't exist
          const [newAchievement] = await db.insert(achievements)
            .values({
              type: 'anniversary',
              title: 'Membership Anniversary',
              description: 'Celebrating your continued membership',
              icon: 'sparkles',
              points: 50,
              criteria: { type: 'special_day', day: 'anniversary' }
            })
            .returning();
          
          anniversaryAchievement = newAchievement;
        }
        
        // Award achievement with personalized message
        await awardAchievement(user, anniversaryAchievement, { years });
        specialDayAchievementsCount++;
      }
    }
    
    return specialDayAchievementsCount;
  } catch (error) {
    console.error('Error in checkForSpecialDays:', error);
    return 0;
  }
}

// Check achievement criteria for a specific user
async function checkAchievementCriteria(user: any, achievement: any): Promise<boolean> {
  const criteria = achievement.criteria;
  
  if (!criteria || typeof criteria !== 'object') {
    return false;
  }
  
  try {
    switch (criteria.type) {
      case 'profile_completion':
        // Check if profile is complete
        return user.profileCompleted || (
          user.firstName && 
          user.lastName && 
          user.email &&
          user.bio &&
          user.profileImage
        );
        
      case 'mockup_viewed':
        // Check if user has viewed any mockups
        const mockupViews = await db.execute(
          sql`SELECT COUNT(*) FROM mockup_engagement WHERE user_id = ${user.id} AND action = 'view'`
        );
        return mockupViews[0]?.count > 0;
        
      case 'first_payment':
        // Check if user has made any payments
        const payments = await db.execute(
          sql`SELECT COUNT(*) FROM marketplace_orders WHERE user_id = ${user.id} AND status = 'completed'`
        );
        return payments[0]?.count > 0;
        
      case 'high_engagement':
        // Check for high engagement metrics
        const engagement = await db.execute(
          sql`SELECT COUNT(*) FROM website_engagement WHERE user_id = ${user.id}`
        );
        return Number(engagement[0]?.count) >= 50;
        
      case 'feedback_provided':
        // Check if user has provided feedback
        const feedback = await db.execute(
          sql`SELECT COUNT(*) FROM feedback WHERE user_id = ${user.id}`
        );
        return feedback[0]?.count > 0;
        
      case 'referrals':
        // Check if user has referred others
        return user.referralCount >= criteria.count;
        
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking achievement criteria for type ${criteria.type}:`, error);
    return false;
  }
}

// Award achievement to user with personalized message
export async function awardAchievement(user: any, achievement: any, extraData: any = {}): Promise<boolean> {
  try {
    // Generate personalized message using Grok
    let personalizedContent = '';
    try {
      // Use Grok to generate a personalized message
      const grokPrompt = getPersonalizedMessagePrompt(user, achievement, extraData);
      
      const response = await grokApi.generateText(grokPrompt);
      personalizedContent = response || '';
      
      if (!personalizedContent) {
        // Fallback content if Grok fails
        personalizedContent = `Congratulations on earning the ${achievement.title} achievement! You've earned ${achievement.points} points.`;
      }
    } catch (error) {
      console.error('Error generating personalized achievement message:', error);
      personalizedContent = `Congratulations on earning the ${achievement.title} achievement! You've earned ${achievement.points} points.`;
    }
    
    // Create user achievement record
    const userAchievement = insertUserAchievementSchema.parse({
      userId: user.id,
      type: achievement.type,
      title: achievement.title,
      content: personalizedContent,
      status: 'unread',
      metadata: {
        achievementType: achievement.type,
        icon: achievement.icon || 'award',
        points: achievement.points,
        timestamp: new Date().toISOString()
      }
    });
    
    // Insert into database
    await db.insert(userAchievements).values(userAchievement);
    
    console.log(`Achievement awarded: ${achievement.type} to user ${user.id}`);
    return true;
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return false;
  }
}

// Get prompt for generating personalized achievement message
function getPersonalizedMessagePrompt(user: any, achievement: any, extraData: any = {}): string {
  const userName = user.firstName || user.username || 'valued user';
  
  // Base prompt with user details
  let prompt = `Write a personalized, friendly, and engaging achievement notification message for ${userName}. `;
  
  // Add achievement-specific context
  prompt += `They just earned the "${achievement.title}" achievement on Elevion, a web development platform. `;
  prompt += `The achievement description is: "${achievement.description}". `;
  prompt += `They received ${achievement.points} points for this achievement. `;
  
  // Add extra context based on achievement type
  switch (achievement.type) {
    case 'birthday':
      prompt += `This is a birthday achievement to celebrate their special day. Make it warm and celebratory. `;
      break;
      
    case 'anniversary':
      const years = extraData.years || 'multiple';
      prompt += `This celebrates their ${years} year(s) as a member of our platform. Express appreciation for their loyalty. `;
      break;
      
    case 'profile_completion':
      prompt += `This is for completing their profile with all required information. Recognize their commitment to our community. `;
      break;
      
    case 'mockup_viewed':
      prompt += `This recognizes their first time viewing a website mockup. Highlight the value of exploring our design options. `;
      break;
      
    case 'first_payment':
      prompt += `This celebrates their first purchase or payment on our platform. Express gratitude for their business. `;
      break;
      
    case 'high_engagement':
      prompt += `This achievement recognizes their high level of engagement with our platform. Acknowledge their active participation. `;
      break;
      
    case 'feedback_provided':
      prompt += `This is for providing valuable feedback to help improve our platform. Thank them for their input. `;
      break;
  }
  
  // Final instructions for formatting
  prompt += `Keep the message concise (max 3-4 sentences), positive, motivational, and personalized. Don't use generic expressions.`;
  
  return prompt;
}