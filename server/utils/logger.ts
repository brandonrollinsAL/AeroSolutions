/**
 * Logger utility for standardized logging throughout the application
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  timestamp?: boolean;
  level?: boolean;
  color?: boolean;
}

class Logger {
  private defaultOptions: LogOptions = {
    timestamp: true,
    level: true,
    color: true
  };

  /**
   * Log a debug message
   * @param message The message to log
   * @param data Additional data to log
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param data Additional data to log
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param data Additional data to log
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error The error object or additional data
   */
  error(message: string, error?: any): void {
    this.log('error', message, error);
  }

  /**
   * Log a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param data Additional data to log
   * @param options Logging options
   */
  private log(level: LogLevel, message: string, data?: any, options: LogOptions = this.defaultOptions): void {
    const timestamp = options.timestamp ? this.getTimestamp() : '';
    const levelPrefix = options.level ? `[${level.toUpperCase()}]` : '';
    const color = options.color ? this.getColorForLevel(level) : '';
    const resetColor = options.color ? '\x1b[0m' : '';

    // Format the message
    const formattedMessage = `${color}${timestamp}${levelPrefix} ${message}${resetColor}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, data !== undefined ? data : '');
        break;
      case 'info':
        console.info(formattedMessage, data !== undefined ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data !== undefined ? data : '');
        break;
      case 'error':
        console.error(formattedMessage, data !== undefined ? data : '');
        break;
    }
  }

  /**
   * Get the current timestamp in a readable format
   * @returns Formatted timestamp string
   */
  private getTimestamp(): string {
    const now = new Date();
    return `[${now.toLocaleTimeString()}] `;
  }

  /**
   * Get the ANSI color code for the specified log level
   * @param level The log level
   * @returns ANSI color code
   */
  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '\x1b[36m'; // Cyan
      case 'info':
        return '\x1b[32m'; // Green
      case 'warn':
        return '\x1b[33m'; // Yellow
      case 'error':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[0m'; // Reset
    }
  }
}

// Export a singleton instance
export const logger = new Logger();