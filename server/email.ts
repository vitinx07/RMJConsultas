import { MailService } from '@sendgrid/mail';

// Email service interface
export interface EmailService {
  sendPasswordEmail(to: string, password: string, username: string): Promise<boolean>;
  sendWelcomeEmail(to: string, username: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean>;
}

// SendGrid implementation
class SendGridEmailService implements EmailService {
  private mailService: MailService;
  private fromEmail: string = 'noreply@multicorban.com';

  constructor() {
    this.mailService = new MailService();
    if (process.env.SENDGRID_API_KEY) {
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendPasswordEmail(to: string, password: string, username: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`[EMAIL SIMULADO] Enviando senha para ${to}`);
      console.log(`Username: ${username}`);
      console.log(`Senha temporária: ${password}`);
      return true;
    }

    try {
      await this.mailService.send({
        to,
        from: this.fromEmail,
        subject: 'Bem-vindo ao Sistema MULTI CORBAN - Sua senha de acesso',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Bem-vindo ao Sistema MULTI CORBAN</h1>
            <p>Olá <strong>${username}</strong>,</p>
            <p>Sua conta foi criada com sucesso! Aqui estão seus dados de acesso:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Usuário:</strong> ${username}</p>
              <p><strong>Senha temporária:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
            </div>
            
            <p style="color: #dc2626;"><strong>Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha no primeiro acesso.</p>
            
            <p>Para acessar o sistema, visite o portal e faça login com as credenciais acima.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Este é um email automático. Não responda este email.<br>
              Sistema MULTI CORBAN - Consulta de Benefícios INSS
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`[EMAIL SIMULADO] Enviando boas-vindas para ${to}`);
      return true;
    }

    try {
      await this.mailService.send({
        to,
        from: this.fromEmail,
        subject: 'Bem-vindo ao Sistema MULTI CORBAN',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Bem-vindo ao Sistema MULTI CORBAN!</h1>
            <p>Olá <strong>${username}</strong>,</p>
            <p>Sua conta foi ativada com sucesso e você já pode começar a usar o sistema.</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
              <h3 style="color: #2563eb; margin-top: 0;">Recursos disponíveis:</h3>
              <ul>
                <li>Consulta de benefícios por CPF</li>
                <li>Consulta de benefícios por número</li>
                <li>Simulação de refinanciamento Banrisul</li>
                <li>Histórico de consultas</li>
                <li>Gerenciamento de clientes favoritos</li>
              </ul>
            </div>
            
            <p>Se precisar de ajuda, entre em contato com o administrador do sistema.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Sistema MULTI CORBAN - Consulta de Benefícios INSS
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, username: string, newPassword: string): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log(`[EMAIL SIMULADO] Enviando nova senha para ${to}`);
      console.log(`Username: ${username}`);
      console.log(`Nova senha: ${newPassword}`);
      return true;
    }

    try {
      await this.mailService.send({
        to,
        from: this.fromEmail,
        subject: 'Sistema MULTI CORBAN - Senha redefinida',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Senha Redefinida</h1>
            <p>Olá <strong>${username}</strong>,</p>
            <p>Sua senha foi redefinida com sucesso pelo administrador do sistema.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Usuário:</strong> ${username}</p>
              <p><strong>Nova senha:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${newPassword}</code></p>
            </div>
            
            <p style="color: #dc2626;"><strong>Importante:</strong> Por questões de segurança, recomendamos que você altere sua senha após fazer login.</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Este é um email automático. Não responda este email.<br>
              Sistema MULTI CORBAN - Consulta de Benefícios INSS
            </p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de redefinição:', error);
      return false;
    }
  }
}

// Factory function
export function createEmailService(): EmailService {
  return new SendGridEmailService();
}

// Export email service instance
export const emailService = createEmailService();