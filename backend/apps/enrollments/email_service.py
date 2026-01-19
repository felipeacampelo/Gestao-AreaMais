"""
Email service for enrollment notifications using Resend.
"""
import resend
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Resend with API key
resend.api_key = getattr(settings, 'RESEND_API_KEY', None)


def _get_base_styles():
    """Return base CSS styles for emails."""
    return """
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #a52cf0 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .info-box { background: #f8f9fa; padding: 24px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #a52cf0; }
        .info-box-success { border-left-color: #10b981; }
        .info-box h3 { margin: 0 0 16px 0; color: #1f2937; font-size: 18px; }
        .info-box p { margin: 8px 0; color: #4b5563; }
        .info-box strong { color: #1f2937; }
        .button { display: inline-block; padding: 14px 32px; background: #a52cf0; color: white; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; font-size: 16px; }
        .button-success { background: #10b981; }
        .button:hover { opacity: 0.9; }
        .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; }
        .emoji { font-size: 48px; margin-bottom: 16px; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; color: #4b5563; }
    """


def send_enrollment_confirmation_email(enrollment):
    """
    Send confirmation email when enrollment is created.
    """
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    
    user_name = enrollment.form_data.get('nome_completo', enrollment.user.get_full_name()) or 'Participante'
    user_email = enrollment.form_data.get('email', enrollment.user.email)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://areamais.com.br')
    
    payment_method = enrollment.get_payment_method_display() if enrollment.payment_method else 'Não selecionado'
    installments_html = f'<p><strong>Parcelas:</strong> {enrollment.installments}x</p>' if enrollment.installments > 1 else ''
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">✅</div>
            <h1>Inscrição Confirmada!</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>{user_name}</strong>!</p>
            
            <p>Sua inscrição foi registrada com sucesso! 🎉</p>
            
            <div class="info-box">
                <h3>📋 Detalhes da Inscrição</h3>
                <p><strong>Evento:</strong> {enrollment.product.name}</p>
                <p><strong>Lote:</strong> {enrollment.batch.name}</p>
                <p><strong>Valor:</strong> R$ {enrollment.final_amount}</p>
                <p><strong>Forma de Pagamento:</strong> {payment_method}</p>
                {installments_html}
            </div>
            
            <p><strong>📌 Próximos Passos:</strong></p>
            <ul>
                <li>Acesse sua área de inscrições para acompanhar o status do pagamento</li>
                <li>Você receberá um email quando o pagamento for confirmado</li>
                <li>Em caso de dúvidas, entre em contato conosco</li>
            </ul>
            
            <center>
                <a href="{frontend_url}/minhas-inscricoes" class="button">
                    Ver Minhas Inscrições
                </a>
            </center>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>© 2025 AreaMais - Todos os direitos reservados</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [user_email],
            "subject": f"✅ Inscrição Confirmada - {enrollment.product.name}",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Email de confirmação enviado para {user_email}: {response}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email de confirmação de inscrição: {e}")
        return False


def send_payment_confirmation_email(enrollment):
    """
    Send confirmation email when payment is confirmed.
    """
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    
    user_name = enrollment.form_data.get('nome_completo', enrollment.user.get_full_name()) or 'Participante'
    user_email = enrollment.form_data.get('email', enrollment.user.email)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://areamais.com.br')
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="container">
        <div class="header header-success">
            <div class="emoji">🎉</div>
            <h1>Pagamento Confirmado!</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>{user_name}</strong>!</p>
            
            <p>Ótima notícia! Seu pagamento foi confirmado com sucesso!</p>
            
            <div class="info-box info-box-success">
                <h3>💳 Detalhes do Pagamento</h3>
                <p><strong>Evento:</strong> {enrollment.product.name}</p>
                <p><strong>Lote:</strong> {enrollment.batch.name}</p>
                <p><strong>Valor Pago:</strong> R$ {enrollment.final_amount}</p>
                <p><strong>Status:</strong> ✓ Pago</p>
            </div>
            
            <p><strong>🚀 Próximos Passos:</strong></p>
            <ul>
                <li>Sua inscrição está 100% confirmada!</li>
                <li>Você receberá mais informações sobre o evento em breve</li>
                <li>Acesse sua área de inscrições para ver todos os detalhes</li>
            </ul>
            
            <center>
                <a href="{frontend_url}/minhas-inscricoes" class="button button-success">
                    Ver Minhas Inscrições
                </a>
            </center>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>© 2025 AreaMais - Todos os direitos reservados</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [user_email],
            "subject": f"🎉 Pagamento Confirmado - {enrollment.product.name}",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Email de confirmação de pagamento enviado para {user_email}: {response}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email de confirmação de pagamento: {e}")
        return False


def send_installment_reminder_email(enrollment, payment):
    """
    Send reminder email for upcoming PIX installment payment.
    """
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    
    user_name = enrollment.form_data.get('nome_completo', enrollment.user.get_full_name()) or 'Participante'
    user_email = enrollment.form_data.get('email', enrollment.user.email)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://areamais.com.br')
    
    due_date_formatted = payment.due_date.strftime('%d/%m/%Y') if payment.due_date else 'N/A'
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div class="emoji">⏰</div>
            <h1>Lembrete de Parcela</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>{user_name}</strong>!</p>
            
            <p>Este é um lembrete amigável sobre sua próxima parcela.</p>
            
            <div class="info-box" style="border-left-color: #f59e0b;">
                <h3>📅 Detalhes da Parcela</h3>
                <p><strong>Evento:</strong> {enrollment.product.name}</p>
                <p><strong>Parcela:</strong> {payment.installment_number} de {enrollment.installments}</p>
                <p><strong>Valor:</strong> R$ {payment.amount}</p>
                <p><strong>Vencimento:</strong> {due_date_formatted}</p>
            </div>
            
            <p>Acesse sua área de inscrições para efetuar o pagamento via PIX.</p>
            
            <center>
                <a href="{frontend_url}/minhas-inscricoes" class="button" style="background: #f59e0b;">
                    Pagar Agora
                </a>
            </center>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>© 2025 AreaMais - Todos os direitos reservados</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [user_email],
            "subject": f"⏰ Lembrete: Parcela {payment.installment_number} - {enrollment.product.name}",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Email de lembrete de parcela enviado para {user_email}: {response}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email de lembrete de parcela: {e}")
        return False


def send_password_reset_email(user, reset_link):
    """
    Send password reset email.
    """
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    
    user_name = user.get_full_name() or user.email
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
            <div class="emoji">🔐</div>
            <h1>Recuperação de Senha</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>{user_name}</strong>!</p>
            
            <p>Você solicitou a recuperação de senha da sua conta.</p>
            
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <center>
                <a href="{reset_link}" class="button" style="background: #6366f1;">
                    Redefinir Senha
                </a>
            </center>
            
            <p style="color: #6b7280; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Este link expira em 24 horas.<br>
                Se você não solicitou esta recuperação, ignore este email.
            </p>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>© 2025 AreaMais - Todos os direitos reservados</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        params = {
            "from": settings.DEFAULT_FROM_EMAIL,
            "to": [user.email],
            "subject": "🔐 Recuperação de Senha - AreaMais",
            "html": html_content,
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Email de recuperação de senha enviado para {user.email}: {response}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar email de recuperação de senha: {e}")
        return False
