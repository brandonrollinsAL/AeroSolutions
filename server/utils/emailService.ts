import mailgun from 'mailgun-js';
import { logger } from './logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  'v:templateData'?: Record<string, any>;
  attachment?: mailgun.Attachment[];
  cc?: string | string[];
  bcc?: string | string[];
  tags?: string[];
  campaign?: string;
  'o:tracking'?: boolean;
  'o:tracking-clicks'?: boolean | string;
  'o:tracking-opens'?: boolean;
  'o:dkim'?: boolean;
  'o:deliverytime'?: string;
  'h:Reply-To'?: string;
  'h:X-Mailgun-Variables'?: string;
}

class EmailService {
  private mailgunClient: mailgun.Mailgun;
  private isInitialized: boolean = false;
  private defaultSender: string = 'Elevion <notifications@elevion.dev>';

  constructor() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    if (!apiKey || !domain) {
      logger.warn('Mailgun configuration missing. Email functionality will be limited.');
      return;
    }

    try {
      this.mailgunClient = mailgun({
        apiKey,
        domain
      });
      this.isInitialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Send an email using Mailgun
   * 
   * @param options Email options including recipient, subject, and content
   * @returns Promise that resolves with Mailgun's response or rejects with an error
   */
  async sendEmail(options: EmailOptions): Promise<mailgun.messages.SendResponse> {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized. Check Mailgun configuration.');
    }

    const emailData = {
      from: this.defaultSender,
      ...options
    };

    try {
      const response = await new Promise<mailgun.messages.SendResponse>((resolve, reject) => {
        this.mailgunClient.messages().send(emailData, (error, body) => {
          if (error) reject(error);
          else resolve(body);
        });
      });

      logger.info(`Email sent successfully to ${options.to}`);
      return response;
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Send a welcome email to a new user
   * 
   * @param to Recipient email address
   * @param username Username of the new user
   * @returns Promise that resolves with Mailgun's response
   */
  async sendWelcomeEmail(to: string, username: string): Promise<mailgun.messages.SendResponse> {
    const subject = 'Welcome to Elevion!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://elevion.dev/logo.png" alt="Elevion Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #3B5B9D; text-align: center;">Welcome to Elevion!</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Hello ${username},
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Thank you for joining Elevion! We're excited to help you create amazing digital experiences for your business.
        </p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #3B5B9D; margin-top: 0;">Getting Started</h3>
          <ul style="color: #555; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Explore our <a href="https://elevion.dev/marketplace" style="color: #00D1D1; text-decoration: none;">marketplace</a> for digital tools and services</li>
            <li style="margin-bottom: 10px;">Try our free AI-powered mockup generator</li>
            <li style="margin-bottom: 10px;">Check out our premium features to take your business to the next level</li>
          </ul>
        </div>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          If you have any questions or need assistance, don't hesitate to contact our support team.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://elevion.dev/dashboard" style="display: inline-block; background-color: #3B5B9D; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">Go to Your Dashboard</a>
        </div>
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          © ${new Date().getFullYear()} Elevion. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send a verification email with a verification link
   * 
   * @param to Recipient email address
   * @param username Username of the user
   * @param verificationToken Token to verify the email address
   * @returns Promise that resolves with Mailgun's response
   */
  async sendVerificationEmail(
    to: string, 
    username: string, 
    verificationToken: string
  ): Promise<mailgun.messages.SendResponse> {
    const verificationLink = `https://elevion.dev/verify-email?token=${verificationToken}`;
    const subject = 'Verify Your Email Address';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://elevion.dev/logo.png" alt="Elevion Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #3B5B9D; text-align: center;">Verify Your Email Address</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Hello ${username},
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Thank you for creating an account with Elevion. To complete your registration and access all features, please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="display: inline-block; background-color: #3B5B9D; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          If you did not create an account with Elevion, please ignore this email or contact our support team.
        </p>
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          © ${new Date().getFullYear()} Elevion. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send a password reset email with a reset link
   * 
   * @param to Recipient email address
   * @param username Username of the user
   * @param resetToken Token to reset the password
   * @returns Promise that resolves with Mailgun's response
   */
  async sendPasswordResetEmail(
    to: string, 
    username: string, 
    resetToken: string
  ): Promise<mailgun.messages.SendResponse> {
    const resetLink = `https://elevion.dev/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://elevion.dev/logo.png" alt="Elevion Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #3B5B9D; text-align: center;">Reset Your Password</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Hello ${username},
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          We received a request to reset your password for your Elevion account. Please click the button below to set a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background-color: #3B5B9D; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          This link will expire in 30 minutes. If you did not request a password reset, please ignore this email or contact our support team.
        </p>
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          © ${new Date().getFullYear()} Elevion. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send a notification email for marketplace activity
   * 
   * @param to Recipient email address
   * @param username Username of the user
   * @param itemName Name of the marketplace item
   * @param action Action performed on the item (e.g., "published", "purchased")
   * @param itemId ID of the marketplace item
   * @returns Promise that resolves with Mailgun's response
   */
  async sendMarketplaceNotification(
    to: string,
    username: string,
    itemName: string,
    action: 'published' | 'purchased' | 'updated' | 'sold',
    itemId: string
  ): Promise<mailgun.messages.SendResponse> {
    const itemLink = `https://elevion.dev/marketplace/item/${itemId}`;
    let subject = '';
    let actionText = '';
    let actionDescription = '';

    switch (action) {
      case 'published':
        subject = `Your Item "${itemName}" Has Been Published`;
        actionText = 'has been published';
        actionDescription = 'Your item is now visible to all Elevion users in the marketplace.';
        break;
      case 'purchased':
        subject = `You Purchased "${itemName}"`;
        actionText = 'has been purchased';
        actionDescription = 'Thank you for your purchase! You can now access this item in your dashboard.';
        break;
      case 'updated':
        subject = `Your Item "${itemName}" Has Been Updated`;
        actionText = 'has been updated';
        actionDescription = 'The changes you made to your item are now live in the marketplace.';
        break;
      case 'sold':
        subject = `Your Item "${itemName}" Has Been Sold`;
        actionText = 'has been sold';
        actionDescription = 'Congratulations! Someone has purchased your item.';
        break;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://elevion.dev/logo.png" alt="Elevion Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #3B5B9D; text-align: center;">${subject}</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Hello ${username},
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Your marketplace item <strong>${itemName}</strong> ${actionText}.
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          ${actionDescription}
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${itemLink}" style="display: inline-block; background-color: #3B5B9D; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">View Item</a>
        </div>
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          © ${new Date().getFullYear()} Elevion. All rights reserved.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send a weekly newsletter with personalized content
   * 
   * @param to Recipient email address
   * @param username Username of the user
   * @param recommendations Array of recommended items or articles
   * @returns Promise that resolves with Mailgun's response
   */
  async sendWeeklyNewsletter(
    to: string,
    username: string,
    recommendations: Array<{ title: string; description: string; link: string; imageUrl?: string }>
  ): Promise<mailgun.messages.SendResponse> {
    const subject = 'Your Weekly Elevion Update';

    // Generate HTML for recommendations
    const recommendationsHtml = recommendations.map(item => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 5px; margin-bottom: 10px;">` : ''}
        <h3 style="color: #3B5B9D; margin: 0 0 10px 0;">${item.title}</h3>
        <p style="color: #555; margin: 0 0 10px 0;">${item.description}</p>
        <a href="${item.link}" style="color: #00D1D1; text-decoration: none; font-weight: bold;">Learn More →</a>
      </div>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://elevion.dev/logo.png" alt="Elevion Logo" style="max-width: 150px;">
        </div>
        <h1 style="color: #3B5B9D; text-align: center;">Your Weekly Update</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Hello ${username},
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          Here's your personalized weekly update with recommendations and the latest from Elevion:
        </p>
        
        <h2 style="color: #3B5B9D; margin-top: 30px;">Recommended for You</h2>
        ${recommendationsHtml}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://elevion.dev/dashboard" style="display: inline-block; background-color: #3B5B9D; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          © ${new Date().getFullYear()} Elevion. All rights reserved.<br>
          <a href="https://elevion.dev/unsubscribe?email=${encodeURIComponent(to)}" style="color: #999; text-decoration: none;">Unsubscribe</a> from these emails.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      'o:tracking': true,
      tags: ['newsletter', 'weekly'],
      campaign: 'weekly-newsletter'
    });
  }
}

// Create and export a singleton instance of the email service
export const emailService = new EmailService();