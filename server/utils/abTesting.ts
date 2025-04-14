import { db } from '../db';
import { callXAI, generateJson } from './xaiClient';
import NodeCache from 'node-cache';
import { randomUUID } from 'crypto';

// Cache for storing test data and results
const abTestCache = new NodeCache({ stdTTL: 86400 * 7, checkperiod: 600 }); // 7 day cache

// AB Test types
export type ABTestVariant = {
  id: string;
  name: string;
  description?: string;
  changes: Record<string, any>; // CSS/styling/content changes
  conversionRate?: number;
  impressions: number;
  conversions: number;
};

export type ABTest = {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'stopped';
  elementSelector: string; // The DOM element to modify
  goalType: 'click' | 'form_submit' | 'page_view' | 'custom';
  goalSelector?: string; // DOM selector for the goal (e.g., button to click)
  startDate: Date;
  endDate?: Date;
  minSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  variants: ABTestVariant[];
  winningVariantId?: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Creates a new A/B test
 * @param test The test configuration
 * @returns The created test
 */
export async function createABTest(testData: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
  const id = randomUUID();
  const now = new Date();
  
  const test: ABTest = {
    ...testData,
    id,
    createdAt: now,
    updatedAt: now,
    variants: testData.variants.map(variant => ({
      ...variant,
      impressions: 0,
      conversions: 0
    }))
  };
  
  // Store test in cache
  abTestCache.set(`test:${id}`, test);
  
  return test;
}

/**
 * Gets a specific test by ID
 * @param testId The test ID
 * @returns The test data or null if not found
 */
export function getABTest(testId: string): ABTest | null {
  return abTestCache.get<ABTest>(`test:${testId}`) || null;
}

/**
 * Gets all active A/B tests
 * @returns Array of active tests
 */
export function getActiveABTests(): ABTest[] {
  const tests: ABTest[] = [];
  const keys = abTestCache.keys();
  
  for (const key of keys) {
    if (key.startsWith('test:')) {
      const test = abTestCache.get<ABTest>(key);
      if (test && test.status === 'running') {
        tests.push(test);
      }
    }
  }
  
  return tests;
}

/**
 * Gets all A/B tests
 * @returns Array of all tests
 */
export function getAllABTests(): ABTest[] {
  const tests: ABTest[] = [];
  const keys = abTestCache.keys();
  
  for (const key of keys) {
    if (key.startsWith('test:')) {
      const test = abTestCache.get<ABTest>(key);
      if (test) {
        tests.push(test);
      }
    }
  }
  
  return tests;
}

/**
 * Records an impression for a specific variant
 * @param testId The test ID
 * @param variantId The variant ID
 * @returns Success status
 */
export function recordImpression(testId: string, variantId: string): boolean {
  const test = getABTest(testId);
  if (!test) return false;
  
  const variantIndex = test.variants.findIndex(v => v.id === variantId);
  if (variantIndex === -1) return false;
  
  test.variants[variantIndex].impressions++;
  test.updatedAt = new Date();
  
  // Update test in cache
  abTestCache.set(`test:${testId}`, test);
  
  return true;
}

/**
 * Records a conversion for a specific variant
 * @param testId The test ID
 * @param variantId The variant ID
 * @returns Success status
 */
export function recordConversion(testId: string, variantId: string): boolean {
  const test = getABTest(testId);
  if (!test) return false;
  
  const variantIndex = test.variants.findIndex(v => v.id === variantId);
  if (variantIndex === -1) return false;
  
  test.variants[variantIndex].conversions++;
  test.updatedAt = new Date();
  
  // Calculate new conversion rate
  const variant = test.variants[variantIndex];
  variant.conversionRate = variant.impressions > 0 
    ? variant.conversions / variant.impressions 
    : 0;
  
  // Update test in cache
  abTestCache.set(`test:${testId}`, test);
  
  // Check if we should analyze results
  if (test.status === 'running') {
    const totalImpressions = test.variants.reduce((sum, v) => sum + v.impressions, 0);
    if (totalImpressions >= test.minSampleSize) {
      // Queue analysis if we've hit the minimum sample size
      setTimeout(() => analyzeTestResults(testId), 100);
    }
  }
  
  return true;
}

/**
 * Updates an existing A/B test
 * @param testId The test ID
 * @param updates The updates to apply
 * @returns The updated test or null if not found
 */
export function updateABTest(testId: string, updates: Partial<ABTest>): ABTest | null {
  const test = getABTest(testId);
  if (!test) return null;
  
  const updatedTest: ABTest = {
    ...test,
    ...updates,
    updatedAt: new Date()
  };
  
  // Store updated test in cache
  abTestCache.set(`test:${testId}`, updatedTest);
  
  return updatedTest;
}

/**
 * Analyzes test results using statistical methods
 * @param testId The test ID
 * @returns The updated test or null if not found
 */
export async function analyzeTestResults(testId: string): Promise<ABTest | null> {
  const test = getABTest(testId);
  if (!test) return null;
  
  // Simple analysis: find variant with highest conversion rate
  let highestRate = -1;
  let winningVariantId: string | undefined = undefined;
  
  for (const variant of test.variants) {
    if (variant.conversionRate && variant.conversionRate > highestRate) {
      highestRate = variant.conversionRate;
      winningVariantId = variant.id;
    }
  }
  
  // Get the control and winner variants
  const controlVariant = test.variants.find(v => v.name.toLowerCase().includes('control'));
  const winnerVariant = winningVariantId ? test.variants.find(v => v.id === winningVariantId) : null;
  
  if (!controlVariant || !winnerVariant) {
    return test;
  }
  
  // Use XAI to analyze more deeply
  try {
    const analysisResult = await generateJson<{
      significant: boolean;
      winningVariantId: string | null;
      confidence: number;
      explanation: string;
      recommendations: string[];
    }>({
      model: 'grok-3',
      prompt: JSON.stringify({
        testDescription: test.description,
        variants: test.variants.map(v => ({
          id: v.id,
          name: v.name,
          impressions: v.impressions,
          conversions: v.conversions,
          conversionRate: v.conversionRate
        })),
        confidenceLevel: test.confidenceLevel
      }),
      systemPrompt: `You are an expert A/B testing analyzer. Analyze the provided test data and determine if the results are statistically significant.
      Use Bayesian probability and statistical methods to evaluate the test results.
      For the given confidence level, determine if there is a clear winner among the variants.
      If results are not significant, indicate that the test should continue running.
      Provide a clear explanation of why the results are or are not significant.
      Return your analysis as a JSON object with the following fields:
      - significant: boolean indicating whether results are statistically significant
      - winningVariantId: ID of the winning variant or null if no significant winner
      - confidence: confidence level achieved (0-1)
      - explanation: explanation of the results in plain language
      - recommendations: array of actionable recommendations based on the results`
    });
    
    // Update test with analysis results
    const updatedTest: ABTest = {
      ...test,
      updatedAt: new Date()
    };
    
    if (analysisResult.significant && analysisResult.winningVariantId) {
      updatedTest.status = 'completed';
      updatedTest.winningVariantId = analysisResult.winningVariantId;
      updatedTest.endDate = new Date();
    }
    
    // Store updated test in cache
    abTestCache.set(`test:${testId}`, updatedTest);
    
    // Log the analysis
    console.log(`A/B Test analysis for test ${test.name} (${testId}):`, {
      significant: analysisResult.significant,
      winningVariantId: analysisResult.winningVariantId,
      confidence: analysisResult.confidence,
      explanation: analysisResult.explanation
    });
    
    return updatedTest;
  } catch (error) {
    console.error('Error analyzing A/B test results:', error);
    return test;
  }
}

/**
 * Generates variant ideas for an A/B test based on a description
 * @param elementType The element type to test (button, header, form, etc.)
 * @param goalDescription The goal description (increase clicks, form submissions, etc.)
 * @param currentVersion The current version/content
 * @returns Array of variant suggestions
 */
export async function generateABTestVariants(
  elementType: string,
  goalDescription: string,
  currentVersion: string
): Promise<{ 
  variants: Omit<ABTestVariant, 'impressions' | 'conversions'>[];
  testName: string;
  elementSelector: string;
  recommendedSampleSize: number;
}> {
  try {
    const result = await generateJson<{
      testName: string;
      elementSelector: string;
      recommendedSampleSize: number;
      variants: Array<{
        id: string;
        name: string;
        description: string;
        changes: Record<string, any>;
      }>;
    }>({
      model: 'grok-3',
      prompt: `Generate A/B test variants for a ${elementType} with the goal to ${goalDescription}.
      Current version: "${currentVersion}"
      Include at least 2 variants plus a control.`,
      systemPrompt: `You are an expert in conversion rate optimization and A/B testing.
      Generate creative, data-driven variant ideas for an A/B test.
      Each variant should be meaningfully different and focused on the specific goal.
      Always include a control variant that represents the current version.
      For each variant, include specific CSS or content changes that can be applied.
      The returned JSON should include:
      - testName: A descriptive name for the test
      - elementSelector: A CSS selector that could target the element (e.g., '#signup-button', '.hero-headline')
      - recommendedSampleSize: A recommended minimum sample size based on expected effect size
      - variants: Array of variant objects with id, name, description, and changes`
    });
    
    return result;
  } catch (error) {
    console.error('Error generating A/B test variants:', error);
    
    // Return basic variants if AI generation fails
    return {
      testName: `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} Optimization Test`,
      elementSelector: `#${elementType.toLowerCase().replace(/\s+/g, '-')}`,
      recommendedSampleSize: 1000,
      variants: [
        {
          id: randomUUID(),
          name: 'Control',
          description: 'The current version without modifications',
          changes: {}
        },
        {
          id: randomUUID(),
          name: 'Variant A',
          description: 'First alternative version',
          changes: { 
            'css': { 'color': '#3B5B9D' },
            'content': currentVersion
          }
        }
      ]
    };
  }
}