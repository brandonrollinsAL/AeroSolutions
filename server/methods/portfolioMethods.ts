import { db } from '../db';
import { portfolioItems, type PortfolioItem, InsertPortfolioItem } from '@shared/schema';
import { eq, desc, sql, asc } from 'drizzle-orm';

export const portfolioMethods = {
  /**
   * Get all portfolio items
   */
  async getAllPortfolioItems(): Promise<PortfolioItem[]> {
    try {
      return await db
        .select()
        .from(portfolioItems)
        .orderBy(desc(portfolioItems.order))
        .orderBy(desc(portfolioItems.createdAt));
    } catch (error) {
      console.error('Error fetching all portfolio items:', error);
      throw error;
    }
  },

  /**
   * Get featured portfolio items
   * @param limit - Optional limit of items to return
   */
  async getFeaturedPortfolioItems(limit?: number): Promise<PortfolioItem[]> {
    try {
      let query = db
        .select()
        .from(portfolioItems)
        .where(eq(portfolioItems.featured, true))
        .orderBy(desc(portfolioItems.order))
        .orderBy(desc(portfolioItems.createdAt));

      if (limit) {
        query = query.limit(limit);
      }

      return await query;
    } catch (error) {
      console.error('Error fetching featured portfolio items:', error);
      throw error;
    }
  },

  /**
   * Get a specific portfolio item by ID
   * @param id - Portfolio item ID
   */
  async getPortfolioItemById(id: number): Promise<PortfolioItem | undefined> {
    try {
      const [item] = await db
        .select()
        .from(portfolioItems)
        .where(eq(portfolioItems.id, id));
      
      return item;
    } catch (error) {
      console.error(`Error fetching portfolio item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get portfolio items by industry type
   * @param industryType - The industry type to filter by
   */
  async getPortfolioItemsByIndustry(industryType: string): Promise<PortfolioItem[]> {
    try {
      return await db
        .select()
        .from(portfolioItems)
        .where(eq(portfolioItems.industryType, industryType))
        .orderBy(desc(portfolioItems.order))
        .orderBy(desc(portfolioItems.createdAt));
    } catch (error) {
      console.error(`Error fetching portfolio items for industry ${industryType}:`, error);
      throw error;
    }
  },

  /**
   * Create a new portfolio item
   * @param data - Portfolio item data
   */
  async createPortfolioItem(data: InsertPortfolioItem): Promise<PortfolioItem> {
    try {
      // Convert technologies and features to arrays if they're not already
      const insertData = {
        ...data,
        technologies: Array.isArray(data.technologies) ? data.technologies : [],
        features: Array.isArray(data.features) ? data.features : []
      };

      const [newItem] = await db
        .insert(portfolioItems)
        .values(insertData)
        .returning();
      
      return newItem;
    } catch (error) {
      console.error('Error creating portfolio item:', error);
      throw error;
    }
  },

  /**
   * Update an existing portfolio item
   * @param id - Portfolio item ID
   * @param data - Updated portfolio item data
   */
  async updatePortfolioItem(id: number, data: Partial<PortfolioItem>): Promise<PortfolioItem> {
    try {
      // Convert technologies and features to arrays if provided and not already arrays
      const updateData = { ...data };
      if (data.technologies && !Array.isArray(data.technologies)) {
        updateData.technologies = [];
      }
      if (data.features && !Array.isArray(data.features)) {
        updateData.features = [];
      }

      const [updatedItem] = await db
        .update(portfolioItems)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(portfolioItems.id, id))
        .returning();
      
      return updatedItem;
    } catch (error) {
      console.error(`Error updating portfolio item with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a portfolio item
   * @param id - Portfolio item ID
   */
  async deletePortfolioItem(id: number): Promise<boolean> {
    try {
      const [deletedItem] = await db
        .delete(portfolioItems)
        .where(eq(portfolioItems.id, id))
        .returning();
      
      return !!deletedItem;
    } catch (error) {
      console.error(`Error deleting portfolio item with ID ${id}:`, error);
      throw error;
    }
  }
};