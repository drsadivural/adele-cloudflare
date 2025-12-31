/**
 * Email Service - Resend Integration for ADELE
 * Handles transactional emails: welcome, password reset, notifications
 */

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email Templates
export const emailTemplates = {
  welcome: (name: string, loginUrl: string) => ({
    subject: 'Welcome to ADELE - Your AI-Powered Application Builder',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ADELE</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">ADELE</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">AI-Powered Application Builder</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1d1d1f; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Welcome, ${name}!</h2>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Thank you for joining ADELE. You're now part of a community building the future of application development with AI.
        </p>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
          With ADELE, you can:
        </p>
        <ul style="color: #424245; font-size: 16px; line-height: 1.8; margin: 0 0 30px; padding-left: 20px;">
          <li>Build complete applications using natural language</li>
          <li>Generate production-ready code with our multi-agent AI system</li>
          <li>Deploy instantly to the cloud</li>
          <li>Download full source code and configurations</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 500;">
            Start Building
          </a>
        </div>
        <p style="color: #86868b; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
          If you have any questions, just reply to this email. We're here to help!
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f5f5f7; text-align: center;">
        <p style="color: #86868b; font-size: 12px; margin: 0;">
          © 2024 ADELE by Ayonix. All rights reserved.
        </p>
        <p style="color: #86868b; font-size: 12px; margin: 10px 0 0;">
          <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> · 
          <a href="#" style="color: #667eea; text-decoration: none;">Terms of Service</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Welcome to ADELE, ${name}!\n\nThank you for joining ADELE. You're now part of a community building the future of application development with AI.\n\nWith ADELE, you can:\n- Build complete applications using natural language\n- Generate production-ready code with our multi-agent AI system\n- Deploy instantly to the cloud\n- Download full source code and configurations\n\nStart building: ${loginUrl}\n\nIf you have any questions, just reply to this email. We're here to help!\n\n© 2024 ADELE by Ayonix`
  }),

  passwordReset: (name: string, resetUrl: string, expiresIn: string) => ({
    subject: 'Reset Your ADELE Password',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">ADELE</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1d1d1f; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Hi ${name},
        </p>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 500;">
            Reset Password
          </a>
        </div>
        <p style="color: #86868b; font-size: 14px; line-height: 1.6; margin: 20px 0;">
          This link will expire in ${expiresIn}. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <div style="background-color: #f5f5f7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #86868b; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #667eea; font-size: 12px; margin: 10px 0 0; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f5f5f7; text-align: center;">
        <p style="color: #86868b; font-size: 12px; margin: 0;">
          © 2024 ADELE by Ayonix. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Reset Your Password\n\nHi ${name},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in ${expiresIn}. If you didn't request a password reset, you can safely ignore this email.\n\n© 2024 ADELE by Ayonix`
  }),

  emailVerification: (name: string, verifyUrl: string) => ({
    subject: 'Verify Your ADELE Email Address',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">ADELE</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1d1d1f; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Verify Your Email</h2>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Hi ${name},
        </p>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Please verify your email address to complete your ADELE registration and unlock all features.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 500;">
            Verify Email
          </a>
        </div>
        <p style="color: #86868b; font-size: 14px; line-height: 1.6; margin: 20px 0;">
          If you didn't create an account with ADELE, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f5f5f7; text-align: center;">
        <p style="color: #86868b; font-size: 12px; margin: 0;">
          © 2024 ADELE by Ayonix. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Verify Your Email\n\nHi ${name},\n\nPlease verify your email address to complete your ADELE registration and unlock all features.\n\nVerify here: ${verifyUrl}\n\nIf you didn't create an account with ADELE, you can safely ignore this email.\n\n© 2024 ADELE by Ayonix`
  }),

  subscriptionConfirmation: (name: string, plan: string, amount: string, nextBillingDate: string) => ({
    subject: `Your ADELE ${plan} Subscription is Active`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">ADELE</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background-color: #34c759; border-radius: 50%; width: 60px; height: 60px; line-height: 60px;">
            <span style="color: #ffffff; font-size: 30px;">✓</span>
          </div>
        </div>
        <h2 style="color: #1d1d1f; margin: 0 0 20px; font-size: 24px; font-weight: 600; text-align: center;">Subscription Confirmed!</h2>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Hi ${name},
        </p>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
          Thank you for subscribing to ADELE ${plan}! Your subscription is now active and you have access to all ${plan} features.
        </p>
        <div style="background-color: #f5f5f7; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Plan</td>
              <td style="color: #1d1d1f; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${plan}</td>
            </tr>
            <tr>
              <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Amount</td>
              <td style="color: #1d1d1f; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${amount}</td>
            </tr>
            <tr>
              <td style="color: #86868b; font-size: 14px; padding: 8px 0;">Next Billing Date</td>
              <td style="color: #1d1d1f; font-size: 14px; padding: 8px 0; text-align: right; font-weight: 500;">${nextBillingDate}</td>
            </tr>
          </table>
        </div>
        <p style="color: #86868b; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
          You can manage your subscription anytime from your account settings.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f5f5f7; text-align: center;">
        <p style="color: #86868b; font-size: 12px; margin: 0;">
          © 2024 ADELE by Ayonix. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Subscription Confirmed!\n\nHi ${name},\n\nThank you for subscribing to ADELE ${plan}! Your subscription is now active.\n\nPlan: ${plan}\nAmount: ${amount}\nNext Billing Date: ${nextBillingDate}\n\nYou can manage your subscription anytime from your account settings.\n\n© 2024 ADELE by Ayonix`
  }),

  projectDeployed: (name: string, projectName: string, deployUrl: string) => ({
    subject: `Your Project "${projectName}" is Live!`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Deployed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">ADELE</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 60px;">🚀</span>
        </div>
        <h2 style="color: #1d1d1f; margin: 0 0 20px; font-size: 24px; font-weight: 600; text-align: center;">Your Project is Live!</h2>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Hi ${name},
        </p>
        <p style="color: #424245; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
          Great news! Your project <strong>"${projectName}"</strong> has been successfully deployed and is now live.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${deployUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 500;">
            View Your Project
          </a>
        </div>
        <div style="background-color: #f5f5f7; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #86868b; font-size: 12px; margin: 0;">
            Your project URL:
          </p>
          <p style="color: #667eea; font-size: 14px; margin: 10px 0 0; word-break: break-all;">
            ${deployUrl}
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px; background-color: #f5f5f7; text-align: center;">
        <p style="color: #86868b; font-size: 12px; margin: 0;">
          © 2024 ADELE by Ayonix. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `Your Project is Live!\n\nHi ${name},\n\nGreat news! Your project "${projectName}" has been successfully deployed and is now live.\n\nView your project: ${deployUrl}\n\n© 2024 ADELE by Ayonix`
  })
};

// Email Service Class
export class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl = 'https://api.resend.com';

  constructor(config: EmailConfig) {
    this.apiKey = config.apiKey;
    this.fromEmail = config.fromEmail;
    this.fromName = config.fromName;
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
          reply_to: options.replyTo,
          tags: options.tags
        })
      });

      if (!response.ok) {
        const error = await response.json() as { message?: string };
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`
        };
      }

      const result = await response.json() as { id: string };
      return {
        success: true,
        messageId: result.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Convenience methods for common emails
  async sendWelcome(to: string, name: string, loginUrl: string): Promise<EmailResult> {
    const template = emailTemplates.welcome(name, loginUrl);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'welcome' }]
    });
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string, expiresIn = '1 hour'): Promise<EmailResult> {
    const template = emailTemplates.passwordReset(name, resetUrl, expiresIn);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'password-reset' }]
    });
  }

  async sendEmailVerification(to: string, name: string, verifyUrl: string): Promise<EmailResult> {
    const template = emailTemplates.emailVerification(name, verifyUrl);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'email-verification' }]
    });
  }

  async sendSubscriptionConfirmation(
    to: string,
    name: string,
    plan: string,
    amount: string,
    nextBillingDate: string
  ): Promise<EmailResult> {
    const template = emailTemplates.subscriptionConfirmation(name, plan, amount, nextBillingDate);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'subscription' }]
    });
  }

  async sendProjectDeployed(to: string, name: string, projectName: string, deployUrl: string): Promise<EmailResult> {
    const template = emailTemplates.projectDeployed(name, projectName, deployUrl);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      tags: [{ name: 'type', value: 'deployment' }]
    });
  }
}

// Factory function to create email service from environment
export function createEmailService(env: { RESEND_API_KEY?: string; FROM_EMAIL?: string; FROM_NAME?: string }): EmailService | null {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, email service disabled');
    return null;
  }

  return new EmailService({
    apiKey: env.RESEND_API_KEY,
    fromEmail: env.FROM_EMAIL || 'noreply@adele.ayonix.com',
    fromName: env.FROM_NAME || 'ADELE'
  });
}
