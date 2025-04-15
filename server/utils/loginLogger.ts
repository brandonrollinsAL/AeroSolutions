import fs from 'fs';
import path from 'path';
import { Request } from 'express';
import crypto from 'crypto';

const LOG_FILE_PATH = path.join(process.cwd(), 'login-diagnostic.log');
const LOG_DIRECTORY = process.cwd();

// In-memory cache to track failed login attempts by IP
const failedAttemptsCache: Record<string, { count: number; lastAttempt: number }> = {};
const MAX_FAILED_ATTEMPTS = 5; // Maximum allowed failed attempts
const LOCKOUT_PERIOD_MS = 15 * 60 * 1000; // 15 minutes lockout period

/**
 * Mask sensitive information for logging
 * 
 * @param ip The IP address to mask
 * @returns The masked IP address
 */
const maskIP = (ip: string): string => {
  if (!ip || ip === 'unknown') return 'unknown';
  
  // For IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  
  // For IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:****:****`;
  }
  
  return ip;
};

/**
 * Create a log directory if it doesn't exist
 */
const ensureLogDirectory = (): void => {
  try {
    if (!fs.existsSync(LOG_DIRECTORY)) {
      fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create log directory:', error);
  }
};

/**
 * Check if an IP is temporarily locked out due to too many failed attempts
 * 
 * @param ip The IP address to check
 * @returns Whether the IP is locked out
 */
export const isIPLockedOut = (ip: string): boolean => {
  const cacheEntry = failedAttemptsCache[ip];
  if (!cacheEntry) return false;
  
  const currentTime = Date.now();
  const timeSinceLastAttempt = currentTime - cacheEntry.lastAttempt;
  
  // If the lockout period has passed, reset the counter
  if (timeSinceLastAttempt > LOCKOUT_PERIOD_MS) {
    delete failedAttemptsCache[ip];
    return false;
  }
  
  return cacheEntry.count >= MAX_FAILED_ATTEMPTS;
};

/**
 * Track failed login attempt for an IP address
 * 
 * @param ip The IP address to track
 */
const trackFailedAttempt = (ip: string): void => {
  if (!ip || ip === 'unknown') return;
  
  const currentTime = Date.now();
  
  if (!failedAttemptsCache[ip]) {
    failedAttemptsCache[ip] = { count: 1, lastAttempt: currentTime };
    return;
  }
  
  const timeSinceLastAttempt = currentTime - failedAttemptsCache[ip].lastAttempt;
  
  // Reset counter if lockout period has passed
  if (timeSinceLastAttempt > LOCKOUT_PERIOD_MS) {
    failedAttemptsCache[ip] = { count: 1, lastAttempt: currentTime };
    return;
  }
  
  // Increment counter
  failedAttemptsCache[ip].count += 1;
  failedAttemptsCache[ip].lastAttempt = currentTime;
};

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
    ensureLogDirectory();
    
    const timestamp = new Date().toISOString();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const maskedIP = maskIP(ip);
    const userAgent = request.headers['user-agent'] || 'unknown';
    
    // Generate a session identifier
    const sessionId = crypto.randomBytes(8).toString('hex');
    
    const logEntry = {
      timestamp,
      sessionId,
      username,
      ip: maskedIP, // Use masked IP in logs
      userAgent,
      successful,
      reason: reason || (successful ? 'Success' : 'Failed attempt'),
      requestPath: request.path,
      requestMethod: request.method,
    };
    
    // If unsuccessful, track the failed attempt
    if (!successful) {
      trackFailedAttempt(ip);
      
      // Check if this IP is now locked out
      if (isIPLockedOut(ip)) {
        console.warn(`IP ${maskedIP} has been temporarily locked out due to too many failed login attempts`);
        logEntry.reason = 'IP temporarily locked out due to multiple failed attempts';
      }
    } else if (failedAttemptsCache[ip]) {
      // Reset failed attempts counter on successful login
      delete failedAttemptsCache[ip];
    }
    
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

/**
 * Get failed login statistics for dashboard display
 * 
 * @returns Statistics about failed login attempts
 */
export const getLoginStats = (): { 
  totalAttempts: number; 
  failedAttempts: number; 
  successRate: number;
  recentFailureCount: number;
} => {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return {
        totalAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
        recentFailureCount: 0
      };
    }
    
    const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const logLines = logContent.trim().split('\n');
    
    // Parse all entries
    const entries = logLines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(entry => entry !== null);
    
    const totalAttempts = entries.length;
    const failedAttempts = entries.filter(entry => !entry.successful).length;
    const successRate = totalAttempts > 0 
      ? Math.round((totalAttempts - failedAttempts) / totalAttempts * 100) 
      : 0;
    
    // Get recent failures (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentFailures = entries.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return !entry.successful && entryTime >= oneDayAgo;
    });
    
    return {
      totalAttempts,
      failedAttempts,
      successRate,
      recentFailureCount: recentFailures.length
    };
  } catch (error) {
    console.error('Error calculating login stats:', error);
    return {
      totalAttempts: 0,
      failedAttempts: 0,
      successRate: 0,
      recentFailureCount: 0
    };
  }
};