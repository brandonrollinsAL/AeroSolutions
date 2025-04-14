import { db } from '../db';
import { 
  abTests, 
  abTestVariants, 
  abTestImpressions, 
  abTestConversions,
  type ABTest, 
  type ABTestVariant
} from '@shared/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import xaiClient from './xaiClient';

// Cache A/B test data to reduce database load
const abTestCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes standard TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Don't clone objects on get/set
});

// Cache key prefixes
const ACTIVE_TESTS_CACHE_KEY = 'active_tests';
const TEST_BY_ID_CACHE_KEY = 'test_';

/**
 * Get all active A/B tests
 * @returns Array of active A/B tests with their variants
 */
export async function getActiveTests(): Promise<ABTest[]> {
  // Try to get from cache first
  const cachedTests = abTestCache.get<ABTest[]>(ACTIVE_TESTS_CACHE_KEY);
  if (cachedTests) {
    return cachedTests;
  }

  try {
    // Fetch active tests from the database
    const tests = await db.query.abTests.findMany({
      where: eq(abTests.status, 'running'),
      with: {
        variants: true
      }
    });

    // Cache the results
    abTestCache.set(ACTIVE_TESTS_CACHE_KEY, tests);
    
    return tests;
  } catch (error) {
    console.error('Error getting active A/B tests:', error);
    return [];
  }
}

/**
 * Get a specific A/B test by ID
 * @param id Test ID
 * @returns Complete A/B test data with variants and metrics
 */
export async function getTestById(id: string): Promise<ABTest | null> {
  // Try to get from cache first
  const cacheKey = `${TEST_BY_ID_CACHE_KEY}${id}`;
  const cachedTest = abTestCache.get<ABTest>(cacheKey);
  if (cachedTest) {
    return cachedTest;
  }

  try {
    // Fetch test from database
    const test = await db.query.abTests.findFirst({
      where: eq(abTests.id, id),
      with: {
        variants: true
      }
    });

    if (!test) {
      return null;
    }

    // For each variant, fetch impressions and conversions
    for (const variant of test.variants) {
      // Get impression count
      const impressionResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(abTestImpressions)
        .where(and(
          eq(abTestImpressions.testId, id),
          eq(abTestImpressions.variantId, variant.id)
        ))
        .then(res => res[0]?.count || 0);

      // Get conversion count
      const conversionResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(abTestConversions)
        .where(and(
          eq(abTestConversions.testId, id),
          eq(abTestConversions.variantId, variant.id)
        ))
        .then(res => res[0]?.count || 0);

      // Attach metrics to variant
      variant.impressions = impressionResult;
      variant.conversions = conversionResult;
      variant.conversionRate = impressionResult > 0 
        ? (conversionResult / impressionResult) * 100 
        : 0;
    }

    // Cache the results
    abTestCache.set(cacheKey, test);
    
    return test;
  } catch (error) {
    console.error(`Error getting A/B test with ID ${id}:`, error);
    return null;
  }
}

/**
 * Create a new A/B test
 * @param testData Test data
 * @returns Created test
 */
export async function createTest(testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'> & { variants: Omit<ABTestVariant, 'id' | 'testId'>[] }): Promise<ABTest> {
  try {
    // Generate UUID for test
    const testId = uuidv4();
    
    // Insert the test
    await db.insert(abTests).values({
      id: testId,
      name: testData.name,
      description: testData.description || null,
      status: testData.status || 'draft',
      elementSelector: testData.elementSelector,
      goalType: testData.goalType,
      goalSelector: testData.goalSelector || null,
      minSampleSize: testData.minSampleSize || 100,
      confidenceLevel: testData.confidenceLevel || 0.95,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Insert the variants
    for (const variant of testData.variants) {
      await db.insert(abTestVariants).values({
        id: uuidv4(),
        testId,
        name: variant.name,
        description: variant.description || null,
        changes: variant.changes,
        isControl: variant.isControl || false,
        weight: variant.weight || 1
      });
    }
    
    // Clear the cache
    abTestCache.del(ACTIVE_TESTS_CACHE_KEY);
    
    // Fetch and return the created test
    const createdTest = await getTestById(testId);
    if (!createdTest) {
      throw new Error('Failed to retrieve created test');
    }
    
    return createdTest;
  } catch (error) {
    console.error('Error creating A/B test:', error);
    throw error;
  }
}

/**
 * Update an existing A/B test
 * @param id Test ID
 * @param testData Updated test data
 * @returns Updated test
 */
export async function updateTest(id: string, testData: Partial<ABTest> & { variants?: Partial<ABTestVariant>[] }): Promise<ABTest> {
  try {
    // Update the test
    await db.update(abTests)
      .set({
        ...testData,
        updatedAt: new Date()
      })
      .where(eq(abTests.id, id));
    
    // If variants are provided, update them
    if (testData.variants && testData.variants.length > 0) {
      for (const variant of testData.variants) {
        if (!variant.id) {
          // New variant
          await db.insert(abTestVariants).values({
            id: uuidv4(),
            testId: id,
            name: variant.name!,
            description: variant.description || null,
            changes: variant.changes!,
            isControl: variant.isControl || false,
            weight: variant.weight || 1
          });
        } else {
          // Existing variant
          await db.update(abTestVariants)
            .set({
              name: variant.name,
              description: variant.description,
              changes: variant.changes,
              isControl: variant.isControl,
              weight: variant.weight
            })
            .where(eq(abTestVariants.id, variant.id));
        }
      }
    }
    
    // Clear the cache
    abTestCache.del(ACTIVE_TESTS_CACHE_KEY);
    abTestCache.del(`${TEST_BY_ID_CACHE_KEY}${id}`);
    
    // Fetch and return the updated test
    const updatedTest = await getTestById(id);
    if (!updatedTest) {
      throw new Error('Failed to retrieve updated test');
    }
    
    return updatedTest;
  } catch (error) {
    console.error(`Error updating A/B test with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an A/B test
 * @param id Test ID
 */
export async function deleteTest(id: string): Promise<void> {
  try {
    // First delete all impressions and conversions
    await db.delete(abTestImpressions).where(eq(abTestImpressions.testId, id));
    await db.delete(abTestConversions).where(eq(abTestConversions.testId, id));
    
    // Delete all variants
    await db.delete(abTestVariants).where(eq(abTestVariants.testId, id));
    
    // Delete the test
    await db.delete(abTests).where(eq(abTests.id, id));
    
    // Clear the cache
    abTestCache.del(ACTIVE_TESTS_CACHE_KEY);
    abTestCache.del(`${TEST_BY_ID_CACHE_KEY}${id}`);
  } catch (error) {
    console.error(`Error deleting A/B test with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Track an impression for a variant
 * @param testId Test ID
 * @param variantId Variant ID
 */
export async function trackImpression(testId: string, variantId: string): Promise<void> {
  try {
    await db.insert(abTestImpressions).values({
      id: uuidv4(),
      testId,
      variantId,
      timestamp: new Date()
    });
    
    // Clear the cache to ensure fresh data
    abTestCache.del(`${TEST_BY_ID_CACHE_KEY}${testId}`);
  } catch (error) {
    console.error(`Error tracking impression for test ${testId}, variant ${variantId}:`, error);
    throw error;
  }
}

/**
 * Track a conversion for a variant
 * @param testId Test ID
 * @param variantId Variant ID
 */
export async function trackConversion(testId: string, variantId: string): Promise<void> {
  try {
    await db.insert(abTestConversions).values({
      id: uuidv4(),
      testId,
      variantId,
      timestamp: new Date()
    });
    
    // Clear the cache to ensure fresh data
    abTestCache.del(`${TEST_BY_ID_CACHE_KEY}${testId}`);
  } catch (error) {
    console.error(`Error tracking conversion for test ${testId}, variant ${variantId}:`, error);
    throw error;
  }
}

/**
 * Generate variant suggestions for A/B testing using AI
 * @param elementSelector CSS selector for the element
 * @param elementType Type of element (button, heading, form, etc.)
 * @param currentContent Current content of the element (if applicable)
 * @returns Array of suggested variants
 */
export async function generateTestSuggestions(
  elementSelector: string,
  elementType: string,
  currentContent?: string
): Promise<{ variantName: string, description: string, changes: Record<string, any> }[]> {
  try {
    // Create AI prompt based on element type and current content
    const prompt = `Generate 3 A/B test variants for a ${elementType} element with selector "${elementSelector}"${currentContent ? ` that currently contains: "${currentContent}"` : ''}.
    
Each variant should be optimized for better conversion rates and user engagement based on best practices in UX design.

For each variant, provide:
1. A short name (max 25 characters)
2. A brief description explaining the change and why it might perform better
3. The specific changes to apply, formatted as a JSON object with properties that can be applied to the DOM element

For example, with a button variant, the changes might include properties like:
- text: The new button text
- backgroundColor: New background color
- color: New text color
- borderRadius: New border radius value
- padding: New padding value
- etc.

Format your response as a valid JSON array with each variant as an object.`;

    const systemPrompt = `You are an expert UX designer and conversion rate optimization specialist. Your task is to generate thoughtful A/B test variants for web elements that could improve conversion rates, engagement, or user satisfaction.

Only generate variants that follow these rules:
- Suggest realistic changes that can be applied through CSS and content changes
- Do not suggest changes that would require new images, fonts, or external resources
- Focus on evidence-based best practices from UX research
- Ensure all color suggestions use contrasting colors that maintain accessibility
- Include only the requested information in your response
- Make sure the response is valid JSON`;

    // Call Elevion AI to generate suggestions
    const response = await xaiClient.generateJson(prompt, {
      model: 'grok-3', 
      systemPrompt: systemPrompt
    });

    // Parse and return the suggestions
    if (Array.isArray(response) && response.length > 0) {
      return response.map(variant => ({
        variantName: variant.name || 'Unnamed Variant',
        description: variant.description || '',
        changes: variant.changes || {}
      }));
    }

    // Fallback if AI response is not as expected
    return [
      {
        variantName: 'High Contrast Option',
        description: 'Increases contrast and visibility to draw more attention',
        changes: elementType === 'button' 
          ? { backgroundColor: '#3B5B9D', color: '#FFFFFF', fontWeight: 'bold', padding: '12px 24px' }
          : { color: '#3B5B9D', fontWeight: 'bold' }
      },
      {
        variantName: 'Action-Oriented Option',
        description: 'Uses action-oriented language to encourage clicks',
        changes: { 
          text: elementType === 'button' 
            ? 'Get Started Now' 
            : 'Discover How to Boost Your Business Today',
          fontWeight: 'bold'
        }
      },
      {
        variantName: 'Simplified Option',
        description: 'Reduces visual complexity for a cleaner appearance',
        changes: elementType === 'button'
          ? { backgroundColor: '#00D1D1', color: '#FFFFFF', borderRadius: '4px', boxShadow: 'none' }
          : { fontSize: '1.2em', lineHeight: '1.5', color: '#333333' }
      }
    ];
  } catch (error) {
    console.error('Error generating A/B test suggestions:', error);
    
    // Fallback to standard variants if AI fails
    return [
      {
        variantName: 'Original (Control)',
        description: 'The original version as baseline',
        changes: {}
      },
      {
        variantName: 'Bold Variant',
        description: 'More prominent styling to increase visibility',
        changes: elementType === 'button' 
          ? { backgroundColor: '#FF7043', color: '#FFFFFF', fontWeight: 'bold' }
          : { color: '#3B5B9D', fontWeight: 'bold' }
      },
      {
        variantName: 'Minimal Variant',
        description: 'Simplified design for a cleaner look',
        changes: elementType === 'button'
          ? { backgroundColor: 'transparent', color: '#00D1D1', border: '2px solid #00D1D1' }
          : { fontSize: '1.1em', color: '#555555' }
      }
    ];
  }
}

/**
 * Calculate statistical significance for A/B test results
 * @param testId Test ID
 * @returns Object with statistical significance information
 */
export async function calculateStatisticalSignificance(testId: string): Promise<{
  hasWinner: boolean;
  winningVariantId?: string;
  confidenceLevel: number;
  significantResults: boolean;
  needsMoreData: boolean;
  variantStats: Array<{
    variantId: string;
    name: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
    relativeImprovement?: number; // Compared to control
    pValue?: number; // Statistical p-value 
  }>;
}> {
  try {
    // Get the test with its variants
    const test = await getTestById(testId);
    if (!test) {
      throw new Error('Test not found');
    }
    
    // Find the control variant
    const controlVariant = test.variants.find(v => v.isControl);
    if (!controlVariant) {
      throw new Error('No control variant found');
    }
    
    // Calculate statistical significance for each variant
    const variantStats = test.variants.map(variant => {
      const stats = {
        variantId: variant.id,
        name: variant.name,
        impressions: variant.impressions || 0,
        conversions: variant.conversions || 0,
        conversionRate: variant.conversionRate || 0,
        relativeImprovement: 0,
        pValue: 1.0
      };
      
      // Skip further calculations for control variant
      if (variant.id === controlVariant.id) {
        return stats;
      }
      
      // Calculate relative improvement compared to control
      if (controlVariant.conversionRate && controlVariant.conversionRate > 0) {
        stats.relativeImprovement = ((variant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
      }
      
      // Calculate p-value using z-test for proportions
      if (variant.impressions > 0 && controlVariant.impressions > 0) {
        const p1 = variant.conversions / variant.impressions;
        const p2 = controlVariant.conversions / controlVariant.impressions;
        const p = (variant.conversions + controlVariant.conversions) / (variant.impressions + controlVariant.impressions);
        const z = (p1 - p2) / Math.sqrt(p * (1 - p) * (1/variant.impressions + 1/controlVariant.impressions));
        
        // Convert z-score to p-value using standard normal distribution
        stats.pValue = 1 - (0.5 * (1 + Math.erf(Math.abs(z) / Math.sqrt(2))));
      }
      
      return stats;
    });
    
    // Determine if we have a statistically significant winner
    const significantVariants = variantStats.filter(v => 
      v.variantId !== controlVariant.id && 
      v.pValue < (1 - test.confidenceLevel) &&
      v.relativeImprovement > 0
    );
    
    const hasWinner = significantVariants.length > 0;
    let winningVariantId: string | undefined;
    
    if (hasWinner) {
      // Find the variant with the highest conversion rate among significant ones
      const winner = significantVariants.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      winningVariantId = winner.variantId;
    }
    
    // Determine if we need more data
    const needsMoreData = test.variants.some(v => 
      (v.impressions || 0) < test.minSampleSize
    );
    
    return {
      hasWinner,
      winningVariantId,
      confidenceLevel: test.confidenceLevel,
      significantResults: significantVariants.length > 0,
      needsMoreData,
      variantStats
    };
  } catch (error) {
    console.error(`Error calculating statistical significance for test ${testId}:`, error);
    throw error;
  }
}