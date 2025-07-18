import * as brevo from '@getbrevo/brevo';

// Email service interface
export interface EmailService {
  sendPasswordEmail(to: string, password: string, username: string): Promise<boolean>;
  sendWelcomeEmail(to: string, username: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean>;
}

// Brevo implementation
class BrevoEmailService implements EmailService {
  private apiInstance: brevo.TransactionalEmailsApi;
  private fromEmail: string = '927880001@smtp-brevo.com';
  private fromName: string = 'RMJ Consultas';

  constructor() {
    this.apiInstance = new brevo.TransactionalEmailsApi();
    brevo.TransactionalEmailsApiApiKeys.apiKey = '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';
  }

  async sendPasswordEmail(to: string, password: string, username: string): Promise<boolean> {
    console.log(`📧 Enviando senha para ${to} via Brevo`);
    
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail
      };
      
      sendSmtpEmail.to = [{ email: to, name: username }];
      sendSmtpEmail.subject = 'Bem-vindo ao RMJ Consultas - Sua senha de acesso';
      sendSmtpEmail.htmlContent = `
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
      `;

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Email enviado com sucesso via Brevo:', response.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email via Brevo:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    console.log(`📧 Enviando boas-vindas para ${to} via Brevo`);
    
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail
      };
      
      sendSmtpEmail.to = [{ email: to, name: username }];
      sendSmtpEmail.subject = 'Bem-vindo ao RMJ Consultas';
      sendSmtpEmail.htmlContent = `
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
      `;

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Email de boas-vindas enviado via Brevo:', response.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de boas-vindas via Brevo:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean> {
    console.log(`📧 Enviando nova senha para ${to} via Brevo`);
    
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: this.fromName,
        email: this.fromEmail
      };
      
      sendSmtpEmail.to = [{ email: to, name: username }];
      sendSmtpEmail.subject = 'RMJ Consultas - Senha redefinida';
      sendSmtpEmail.htmlContent = `
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
      `;

      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Email de redefinição enviado via Brevo:', response.messageId);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email de redefinição via Brevo:', error);
      return false;
    }
  }
}

// Factory function
export function createEmailService(): EmailService {
  return new BrevoEmailService();
}

// Export instance
export const emailService = createEmailService();