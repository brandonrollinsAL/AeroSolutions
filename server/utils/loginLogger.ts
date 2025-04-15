import fs from 'fs';
import path from 'path';
import { Request } from 'express';

const LOG_FILE_PATH = path.join(process.cwd(), 'login-diagnostic.log');

/**
 * Log login attempt to the login-diagnostic.log file
 * 
 * @param request The Express request object
 * @param username The username attempting to login
 * @param successful Whether the login attempt was successful
 * @param reason Optional reason for failure
 */
export const logLoginAttempt = (
  request: Request, 
  username: string, 
  successful: boolean, 
  reason?: string
): void => {
  try {
    const timestamp = new Date().toISOString();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    const logEntry = {
      timestamp,
      username,
      ip,
      userAgent,
      successful,
      reason: reason || (successful ? 'Success' : 'Failed attempt')
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(LOG_FILE_PATH, logLine);
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
};

/**
 * Get recent login attempts (for admin dashboard)
 * 
 * @param limit Maximum number of entries to return
 * @returns Array of login attempt entries
 */
export const getRecentLoginAttempts = (limit: number = 100): any[] => {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return [];
    }
    
    const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const logLines = logContent.trim().split('\n');
    
    // Get the last N entries
    const recentEntries = logLines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(entry => entry !== null);
    
    return recentEntries;
  } catch (error) {
    console.error('Error reading login attempts log:', error);
    return [];
  }
};