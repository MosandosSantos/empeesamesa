/**
 * Serviço de email com suporte a SMTP (Yahoo)
 */

import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Configuração do transportador SMTP
const createTransporter = () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = parseInt(process.env.EMAIL_PORT || '587');
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Se não tiver configurações, usar modo console
  if (!emailHost || !emailUser || !emailPassword) {
    console.warn('[Email] Configurações SMTP não encontradas. Usando modo console.');
    return null;
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: false, // true for 465, false for other ports (587 usa STARTTLS)
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false, // Para desenvolvimento
    },
  });
};

/**
 * Envia email via SMTP ou console (se SMTP não configurado)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transporter = createTransporter();

  // Modo console (desenvolvimento sem SMTP)
  if (!transporter) {
    console.log('\n========================================');
    console.log('📧 EMAIL ENVIADO (CONSOLE)');
    console.log('========================================');
    console.log(`Para: ${options.to}`);
    console.log(`Assunto: ${options.subject}`);
    console.log('----------------------------------------');
    console.log('Conteúdo HTML:');
    console.log(options.html);
    console.log('========================================\n');
    return;
  }

  // Envio real via SMTP
  try {
    const emailFrom = process.env.EMAIL_FROM || 'EsferaORDO <noreply@esferaordo.com>';

    await transporter.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ [Email] Enviado com sucesso para: ${options.to}`);
  } catch (error) {
    console.error('❌ [Email] Erro ao enviar:', error);

    // Fallback para console em caso de erro
    console.log('\n========================================');
    console.log('📧 EMAIL (FALLBACK - ERRO SMTP)');
    console.log('========================================');
    console.log(`Para: ${options.to}`);
    console.log(`Assunto: ${options.subject}`);
    console.log(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    console.log('========================================\n');

    throw error; // Re-lançar para que o chamador saiba que falhou
  }
}

/**
 * Template de email de convite para definir senha
 */
export function createInviteEmailTemplate(params: {
  userName: string;
  inviteLink: string;
  expiresInHours: number;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - EsferaORDO</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a472a 0%, #2d5f3f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: #d4af37; margin: 0; font-size: 28px;">EsferaORDO</h1>
    <p style="color: #fff; margin: 10px 0 0 0;">Sistema de Gestão - Rito Escocês Retificado</p>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1a472a; margin-top: 0;">Bem-vindo, ${params.userName}!</h2>

    <p>Você foi convidado para fazer parte do sistema EsferaORDO.</p>

    <p>Para ativar sua conta, você precisa definir sua senha de acesso. Clique no botão abaixo:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.inviteLink}"
         style="background: #d4af37; color: #1a472a; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        Criar Senha
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      <strong>Atenção:</strong> Este link é válido por <strong>${params.expiresInHours} horas</strong> e pode ser usado apenas uma vez.
    </p>

    <p style="color: #666; font-size: 14px;">
      Se você não solicitou este convite, ignore este email.
    </p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center;">
      © ${new Date().getFullYear()} EsferaORDO - Sistema de Gestão para Lojas Maçônicas
    </p>
  </div>
</body>
</html>
  `.trim();
}
