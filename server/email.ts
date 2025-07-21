import fetch from 'node-fetch';

// Email service interface
export interface EmailService {
  sendPasswordEmail(to: string, password: string, username: string): Promise<boolean>;
  sendWelcomeEmail(to: string, username: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean>;
  sendCustomEmail(to: string, subject: string, message: string, isHtml?: boolean, attachments?: EmailAttachment[]): Promise<boolean>;
  sendPasswordResetLink(to: string, username: string, resetToken: string): Promise<boolean>;
}

// Email attachment interface
export interface EmailAttachment {
  name: string;
  content: string; // Base64 encoded content
  contentType?: string;
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
    attachment?: { name: string; content: string }[];
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

  async sendCustomEmail(to: string, subject: string, message: string, isHtml: boolean = false, attachments?: EmailAttachment[]): Promise<boolean> {
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
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 20px; 
                background-color: #f0f2f5;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
                color: white; 
                padding: 30px; 
                text-align: center;
              }
              .logo {
                background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
                color: white;
                width: 70px;
                height: 70px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                font-weight: 900;
                margin: 0 auto 20px auto;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                border: 3px solid rgba(255, 255, 255, 0.2);
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .header p {
                margin: 8px 0 0 0;
                opacity: 0.9;
                font-size: 16px;
                font-weight: 400;
              }
              .content {
                padding: 30px;
                background-color: #ffffff;
              }
              .content-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
              }
              .email-icon {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
                flex-shrink: 0;
              }
              .content-title {
                color: #1e293b;
                margin: 0;
                font-size: 20px;
                font-weight: 600;
              }
              .message-content {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                font-size: 16px;
                line-height: 1.8;
                color: #334155;
                position: relative;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              .message-content::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(135deg, #4f46e5, #7c3aed, #06b6d4);
                border-radius: 18px;
                z-index: -1;
              }
              .subject-info {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
                border-left: 4px solid #3b82f6;
                position: relative;
                z-index: 1;
                text-align: left;
              }
              .footer {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: #94a3b8;
                padding: 35px;
                text-align: center;
                font-size: 14px;
                position: relative;
              }
              .footer::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, #4f46e5, #7c3aed, #06b6d4, #10b981);
              }
              .footer-logo {
                color: #60a5fa;
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                text-align: center;
              }
              .footer-subtitle {
                color: #cbd5e1;
                font-weight: 600;
                margin: 0 0 8px 0;
                text-align: center;
              }
              .footer-disclaimer {
                color: #64748b;
                font-size: 12px;
                margin: 8px 0 0 0;
                opacity: 0.8;
                text-align: center;
              }
              @media (max-width: 600px) {
                body { padding: 10px; }
                .container {
                  margin: 0;
                  border-radius: 15px;
                }
                .content {
                  padding: 30px 25px;
                }
                .header {
                  padding: 30px 20px;
                }
                .header h1 {
                  font-size: 28px;
                }
                .logo {
                  width: 70px;
                  height: 70px;
                  font-size: 24px;
                }
                .content-header {
                  flex-direction: column;
                  text-align: center;
                }
                .email-icon {
                  margin-right: 0;
                  margin-bottom: 10px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">RMJ</div>
                <h1>RMJ Consultas</h1>
                <p>Sistema de Benefícios INSS</p>
              </div>
              <div class="content">
                <div class="content-header">
                  <div class="email-icon">📧</div>
                  <h2 class="content-title">Mensagem Personalizada</h2>
                </div>
                <div class="message-content">
${message}
                </div>
                <div class="subject-info">
                  <strong style="color: #1e40af;">📋 Assunto:</strong> 
                  <span style="color: #1e293b; font-weight: 600;">${subject}</span>
                </div>
              </div>
              <div class="footer">
                <div class="footer-logo">RMJ Consultas</div>
                <p class="footer-subtitle">Sistema Profissional de Benefícios INSS</p>
                <p class="footer-disclaimer">Este é um email automático enviado pelo administrador do sistema.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Process attachments if provided
    let processedAttachments;
    if (attachments && attachments.length > 0) {
      processedAttachments = attachments.map(att => ({
        name: att.name,
        content: att.content
      }));
      console.log(`📎 ${attachments.length} anexo(s) processado(s) para envio`);
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
      tags: ['custom-email', 'admin-sent'],
      ...(processedAttachments && { attachment: processedAttachments })
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