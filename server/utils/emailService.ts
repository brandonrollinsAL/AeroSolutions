import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { db } from '../db';
import { emailCampaigns } from '@shared/schema';

// Setup SendGrid API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email functionality will be limited.');
}

// Configure email settings
const FROM_EMAIL = process.env.EMAIL_FROM || 'info@elevion.dev';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Elevion';

// Email transporter
let transporter: nodemailer.Transporter;

// Initialize email transporter
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // If SendGrid API key is available, use it
  if (process.env.SENDGRID_API_KEY) {
    return null; // Will use SendGrid directly
  }

  // Fallback to SMTP if available
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
    return transporter;
  }

  // Fallback to development setup - logs emails instead of sending
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
  
  return transporter;
}

/**
 * Send an email using SendGrid or SMTP
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from = FROM_EMAIL,
  fromName = FROM_NAME,
  replyTo,
  attachments = []
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
  attachments?: any[];
}): Promise<boolean> {
  try {
    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      throw new Error('Missing required email fields');
    }

    // If using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: {
          email: from,
          name: fromName
        },
        subject,
        text,
        html,
        replyTo: replyTo,
        attachments: attachments?.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.contentType,
          disposition: 'attachment'
        }))
      });
      return true;
    }

    // Using Nodemailer
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
      replyTo,
      attachments
    });

    // If using development transport, log the email
    if (process.env.NODE_ENV === 'development' && info.message) {
      console.log('Email sent (development mode):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', text || html);
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send an email for a specific campaign and track it
 */
export async function sendCampaignEmail({
  to,
  subject,
  content,
  campaignId,
  userId,
  attachments = []
}: {
  to: string;
  subject: string;
  content: string;
  campaignId: string;
  userId?: number;
  attachments?: any[];
}): Promise<boolean> {
  try {
    // Render template with content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { padding-bottom: 20px; border-bottom: 1px solid #eee; text-align: center; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
          .logo { max-width: 150px; }
          .content { padding: 20px 0; }
          .cta-button { display: inline-block; padding: 10px 20px; background-color: #3B5B9D; color: white; text-decoration: none; border-radius: 4px; margin: 15px 0; }
          .unsubscribe { font-size: 11px; color: #999; margin-top: 15px; }
          .unsubscribe a { color: #999; text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://elevion.dev/logo.png" alt="Elevion" class="logo">
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elevion. All rights reserved.</p>
          <p class="unsubscribe">
            You're receiving this email because you have an account with Elevion.
            <br>
            <a href="https://elevion.dev/unsubscribe?email=${encodeURIComponent(to)}">Unsubscribe</a>
          </p>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const sent = await sendEmail({
      to,
      subject,
      html: htmlContent,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
      attachments
    });

    if (sent) {
      // Record in database
      await db.insert(emailCampaigns).values({
        email: to,
        userId: userId || null,
        campaignId,
        subject,
        content: htmlContent.substring(0, 1000), // Store truncated content
        status: 'sent',
      });
    }

    return sent;
  } catch (error) {
    console.error('Failed to send campaign email:', error);
    
    // Record failure
    try {
      await db.insert(emailCampaigns).values({
        email: to,
        userId: userId || null,
        campaignId,
        subject,
        content: content.substring(0, 1000),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    } catch (dbError) {
      console.error('Failed to record email failure:', dbError);
    }
    
    return false;
  }
}

/**
 * Check if SendGrid is properly configured
 */
export function isSendGridConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

/**
 * Check if SMTP is properly configured
 */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

/**
 * Check if any email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return isSendGridConfigured() || isSmtpConfigured();
}