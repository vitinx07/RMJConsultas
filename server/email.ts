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
    
    let finalContent;
    
    if (isHtml) {
      // Se já é HTML, mantém o conteúdo original
      finalContent = message;
    } else {
      // Se é texto simples, cria um template HTML profissional
      finalContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: 'Roboto', Arial, sans-serif; 
                line-height: 1.6; 
                color: #1f2937; 
                margin: 0; 
                padding: 0; 
                background-color: #f8fafc;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white; 
                padding: 30px 20px; 
                text-align: center;
                position: relative;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="20" cy="80" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                pointer-events: none;
              }
              .logo-container {
                position: relative;
                z-index: 1;
                margin-bottom: 15px;
              }
              .logo {
                width: 80px;
                height: 80px;
                background: white;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                font-weight: bold;
                font-size: 24px;
                color: #2563eb;
              }
              .header h1 { 
                margin: 0; 
                font-size: 28px; 
                font-weight: 700;
                position: relative;
                z-index: 1;
              }
              .header p { 
                margin: 8px 0 0 0; 
                font-size: 16px; 
                opacity: 0.9;
                position: relative;
                z-index: 1;
              }
              .content { 
                padding: 40px 30px; 
                background-color: #ffffff;
              }
              .message-content {
                background-color: #f8fafc;
                padding: 25px;
                border-radius: 8px;
                border-left: 4px solid #2563eb;
                margin: 20px 0;
                white-space: pre-wrap;
                font-size: 16px;
                line-height: 1.8;
              }
              .footer { 
                padding: 25px 30px; 
                text-align: center; 
                font-size: 14px; 
                color: #64748b;
                background-color: #f1f5f9;
                border-top: 1px solid #e2e8f0;
              }
              .footer-logo {
                font-weight: 600;
                color: #2563eb;
                margin-bottom: 8px;
              }
              .divider {
                height: 2px;
                background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
                margin: 0;
                border: none;
              }
              @media (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 25px 20px; }
                .header { padding: 25px 20px; }
                .header h1 { font-size: 24px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo-container">
                  <div class="logo">RMJ</div>
                </div>
                <h1>RMJ Consultas</h1>
                <p>Sistema de Benefícios INSS</p>
              </div>
              <hr class="divider">
              <div class="content">
                <h2 style="color: #2563eb; margin-top: 0; font-size: 22px;">📧 Mensagem Personalizada</h2>
                <div class="message-content">
${message}
                </div>
                <p style="margin-bottom: 0; color: #64748b; font-size: 14px;">
                  <strong>Assunto:</strong> ${subject}
                </p>
              </div>
              <div class="footer">
                <div class="footer-logo">RMJ Consultas</div>
                <p style="margin: 0;">Sistema Profissional de Benefícios INSS</p>
                <p style="margin: 5px 0 0 0; font-size: 12px;">Este é um email automático enviado pelo administrador do sistema.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }
    
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
      htmlContent: finalContent,
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