import { Request, Response } from 'express';
import { analyzeUserInteractions, analyzeErrorLogs, analyzeUILayout } from '../utils/analyticsHelper';

/**
 * Register cross-platform analytics routes
 */
export function registerCrossPlatformAnalyticsRoutes(app: any) {
  // Analyze user interactions for UI/UX improvements
  app.post("/api/analytics/user-interactions", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      
      if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No interaction data provided"
        });
      }
      
      const analysis = await analyzeUserInteractions(data);
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error("Error analyzing user interactions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to analyze user interactions",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Analyze error logs for cross-platform compatibility issues
  app.post("/api/analytics/error-logs", async (req: Request, res: Response) => {
    try {
      const logs = req.body;
      
      if (!logs || Object.keys(logs).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No error logs provided"
        });
      }
      
      const analysis = await analyzeErrorLogs(logs);
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error("Error analyzing error logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to analyze error logs",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Analyze UI layout for responsive design improvements
  app.post("/api/analytics/ui-layout", async (req: Request, res: Response) => {
    try {
      const layoutData = req.body;
      
      if (!layoutData || Object.keys(layoutData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No layout data provided"
        });
      }
      
      const analysis = await analyzeUILayout(layoutData);
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error("Error analyzing UI layout:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to analyze UI layout",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Get combined analysis for cross-platform optimization
  app.get("/api/analytics/cross-platform-report", async (req: Request, res: Response) => {
    try {
      // Sample data for each analysis type (in a real app, this would be fetched from database)
      const interactionData = {
        clickEvents: {
          "login-button": { web: 245, ios: 112, android: 158 },
          "signup-button": { web: 198, ios: 87, android: 124 },
          "portfolio-filter": { web: 156, ios: 34, android: 62 }
        },
        formSubmissions: {
          "login-form": { web: 120, ios: 65, android: 92 },
          "contact-form": { web: 87, ios: 23, android: 41 }
        },
        loadTimes: {
          "homepage": { web: 1.2, ios: 2.3, android: 2.1 },
          "portfolio-page": { web: 2.5, ios: 3.8, android: 3.4 }
        }
      };
      
      const errorLogs = {
        browserErrors: {
          "safari": ["popup rendering issue", "form submission error"],
          "chrome": ["animation timing issue"],
          "firefox": ["layout shift on portfolio page"]
        },
        mobileErrors: {
          "ios": ["touch event not registering", "keyboard obscuring form fields"],
          "android": ["slow animation performance", "inconsistent popup behavior"]
        }
      };
      
      const layoutData = {
        components: {
          "header": { web: "fixed", ios: "sticky", android: "sticky" },
          "portfolio-grid": { web: "3-column", ios: "2-column", android: "1-column" },
          "contact-form": { web: "2-column", ios: "1-column", android: "1-column" }
        },
        interactionPatterns: {
          "navigation": { web: "click", ios: "tap", android: "tap" },
          "portfolio-filtering": { web: "click", ios: "swipe", android: "swipe" }
        }
      };
      
      // Get analysis for each data type
      const [interactionAnalysis, errorAnalysis, layoutAnalysis] = await Promise.all([
        analyzeUserInteractions(interactionData),
        analyzeErrorLogs(errorLogs),
        analyzeUILayout(layoutData)
      ]);
      
      // Combine into a comprehensive report
      return res.status(200).json({
        success: true,
        report: {
          interactionAnalysis,
          errorAnalysis,
          layoutAnalysis,
          summary: {
            highPriorityIssues: [
              ...interactionAnalysis.highPriorityItems,
              ...errorAnalysis.issues
                .filter(issue => issue.priority === 'critical' || issue.priority === 'high')
                .map(issue => issue.description)
            ],
            crossPlatformIssues: interactionAnalysis.crossPlatformIssues,
            responsiveImprovements: layoutAnalysis.responsiveBreakpoints,
            animationRecommendations: layoutAnalysis.animationSuggestions
          }
        }
      });
    } catch (error) {
      console.error("Error generating cross-platform report:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate cross-platform report",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}