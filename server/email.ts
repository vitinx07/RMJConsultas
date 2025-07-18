import fetch from 'node-fetch';

// Email service interface
export interface EmailService {
  sendPasswordEmail(to: string, password: string, username: string): Promise<boolean>;
  sendWelcomeEmail(to: string, username: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean>;
  sendCustomEmail(to: string, subject: string, message: string, isHtml?: boolean): Promise<boolean>;
  sendPasswordResetLink(to: string, username: string, resetToken: string): Promise<boolean>;
}

// Brevo implementation using HTTP API (stable and working)
class BrevoEmailService implements EmailService {
  private fromEmail: string = 'cavalcantisilvav@gmail.com';
  private fromName: string = 'Vitor Cavalcanti';
  private apiKey: string = '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';
  private apiUrl: string = 'https://api.brevo.com/v3/smtp/email';

  constructor() {
    // HTTP implementation - no initialization needed
  }

  private async sendEmail(emailData: {
    subject: string;
    sender: { name: string; email: string };
    to: { email: string; name: string }[];
    htmlContent?: string;
    textContent?: string;
    replyTo?: { email: string };
    tags?: string[];
  }): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Brevo API Error:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('✅ Email enviado via Brevo:', result.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao enviar email via Brevo:', error.message);
      return false;
    }
  }

  async sendPasswordEmail(to: string, password: string, username: string): Promise<boolean> {
    console.log(`📧 Enviando senha para ${to} via Brevo`);
    
    const emailData = {
      subject: 'Bem-vindo ao RMJ Consultas - Sua senha de acesso',
      sender: {
        name: this.fromName,
        email: this.fromEmail
      },
      to: [{ 
        email: to, 
        name: username 
      }],
      htmlContent: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
              .password-box { background-color: #e5e7eb; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px; }
              .password { font-size: 18px; font-weight: bold; color: #1f2937; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>RMJ Consultas</h1>
                <p>Sistema de Benefícios INSS</p>
              </div>
              <div class="content">
                <h2>Bem-vindo ao Sistema!</h2>
                <p>Olá <strong>${username}</strong>,</p>
                <p>Sua conta foi criada com sucesso! Aqui estão seus dados de acesso:</p>
                
                <div class="password-box">
                  <p><strong>Usuário:</strong> ${username}</p>
                  <p><strong>Senha temporária:</strong></p>
                  <div class="password">${password}</div>
                </div>
                
                <p style="color: #dc2626;"><strong>Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
                
                <p>Para acessar o sistema, visite o portal e faça login com as credenciais acima.</p>
              </div>
              <div class="footer">
                <p>RMJ Consultas - Sistema de Benefícios INSS</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: ['password-delivery', 'welcome']
    };

    return await this.sendEmail(emailData);
  }

  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    console.log(`📧 Enviando boas-vindas para ${to} via Brevo`);
    
    const emailData = {
      subject: 'Bem-vindo ao RMJ Consultas',
      sender: {
        name: this.fromName,
        email: this.fromEmail
      },
      to: [{ 
        email: to, 
        name: username 
      }],
      htmlContent: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>RMJ Consultas</h1>
                <p>Sistema de Benefícios INSS</p>
              </div>
              <div class="content">
                <h2>Bem-vindo ao Sistema!</h2>
                <p>Olá <strong>${username}</strong>,</p>
                <p>Seja bem-vindo ao RMJ Consultas! Sua conta foi configurada com sucesso.</p>
                <p>Agora você tem acesso a todas as funcionalidades do sistema para consulta de benefícios INSS.</p>
                <p>Se tiver dúvidas, entre em contato com o administrador do sistema.</p>
              </div>
              <div class="footer">
                <p>RMJ Consultas - Sistema de Benefícios INSS</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: ['welcome', 'account-setup']
    };

    return await this.sendEmail(emailData);
  }

  async sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean> {
    console.log(`📧 Enviando nova senha para ${to} via Brevo`);
    
    const emailData = {
      subject: 'RMJ Consultas - Senha redefinida',
      sender: {
        name: this.fromName,
        email: this.fromEmail
      },
      to: [{ 
        email: to, 
        name: username 
      }],
      htmlContent: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
              .password-box { background-color: #e5e7eb; padding: 15px; margin: 20px 0; text-align: center; border-radius: 8px; }
              .password { font-size: 18px; font-weight: bold; color: #1f2937; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>RMJ Consultas</h1>
                <p>Sistema de Benefícios INSS</p>
              </div>
              <div class="content">
                <h2>Senha Redefinida</h2>
                <p>Olá <strong>${username}</strong>,</p>
                <p>Sua senha foi redefinida com sucesso pelo administrador do sistema.</p>
                
                <div class="password-box">
                  <p><strong>Usuário:</strong> ${username}</p>
                  <p><strong>Nova senha:</strong></p>
                  <div class="password">${newPassword}</div>
                </div>
                
                <p style="color: #dc2626;"><strong>Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha após fazer login.</p>
              </div>
              <div class="footer">
                <p>RMJ Consultas - Sistema de Benefícios INSS</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: ['password-reset', 'admin-action']
    };

    return await this.sendEmail(emailData);
  }

  async sendCustomEmail(to: string, subject: string, message: string, isHtml: boolean = false): Promise<boolean> {
    console.log(`📧 Enviando email personalizado para ${to} via Brevo`);
    
    const emailData = {
      subject: subject,
      sender: {
        name: this.fromName,
        email: this.fromEmail
      },
      to: [{ 
        email: to, 
        name: to.split('@')[0] 
      }],
      [isHtml ? 'htmlContent' : 'textContent']: message,
      tags: ['custom-email', 'admin-sent']
    };

    return await this.sendEmail(emailData);
  }

  async sendPasswordResetLink(to: string, username: string, resetToken: string): Promise<boolean> {
    console.log(`📧 Enviando link de redefinição de senha para ${to} via Brevo`);
    
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailData = {
      subject: 'RMJ Consultas - Redefinir Senha',
      sender: {
        name: this.fromName,
        email: this.fromEmail
      },
      to: [{ 
        email: to, 
        name: username 
      }],
      htmlContent: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; background-color: #f9fafb; border-radius: 0 0 8px 8px; }
              .reset-button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>RMJ Consultas</h1>
                <p>Sistema de Benefícios INSS</p>
              </div>
              <div class="content">
                <h2>Redefinir Senha</h2>
                <p>Olá <strong>${username}</strong>,</p>
                <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="reset-button">Redefinir Senha</a>
                </div>
                
                <p>Se você não solicitou esta redefinição, ignore este email.</p>
                <p><strong>Este link expira em 1 hora.</strong></p>
                
                <p>Ou copie e cole o link abaixo no seu navegador:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
              </div>
              <div class="footer">
                <p>RMJ Consultas - Sistema de Benefícios INSS</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: ['password-reset-link', 'self-service']
    };

    return await this.sendEmail(emailData);
  }
}

// Factory function
export function createEmailService(): EmailService {
  return new BrevoEmailService();
}

// Export instance
export const emailService = createEmailService();