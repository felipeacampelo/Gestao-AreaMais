"""
Email service for enrollment notifications.
"""
from django.core.mail import send_mail
from django.conf import settings


def send_enrollment_confirmation_email(enrollment):
    """
    Send confirmation email when enrollment is created.
    """
    user_name = enrollment.form_data.get('nome_completo', enrollment.user.get_full_name())
    user_email = enrollment.form_data.get('email', enrollment.user.email)
    
    subject = f'Inscrição Confirmada - {enrollment.product.name}'
    
    # HTML email
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #a52cf0 0%, #dcfd61 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .info-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #a52cf0; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #a52cf0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Inscrição Confirmada!</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>{user_name}</strong>!</p>
            
            <p>Sua inscrição foi confirmada com sucesso! 🎉</p>
            
            <div class="info-box">
                <h3>Detalhes da Inscrição:</h3>
                <p><strong>Produto:</strong> {enrollment.product.name}</p>
                <p><strong>Lote:</strong> {enrollment.batch.name}</p>
                <p><strong>Valor Total:</strong> R$ {enrollment.final_amount}</p>
                <p><strong>Forma de Pagamento:</strong> {enrollment.get_payment_method_display()}</p>
                {'<p><strong>Parcelas:</strong> ' + str(enrollment.installments) + 'x</p>' if enrollment.installments > 1 else ''}
            </div>
            
            <p><strong>Próximos Passos:</strong></p>
            <ul>
                <li>Acesse sua área de inscrições para acompanhar o status do pagamento e pagar outras parcelas, se necessário.</li>
                <li>Você receberá um email assim que o pagamento completo for confirmado.</li>
                <li>Em caso de dúvidas, entre em contato conosco.</li>
            </ul>
            
            <center>
                <a href="{settings.FRONTEND_URL}/minhas-inscricoes" class="button">
                    Ver Minhas Inscrições
                </a>
            </center>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; 2025 AreaMais</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    # Plain text version
    plain_message = f"""
Inscrição Confirmada!

Olá, {user_name}!

Sua inscrição foi confirmada com sucesso!

Detalhes da Inscrição:
- Produto: {enrollment.product.name}
- Lote: {enrollment.batch.name}
- Valor Total: R$ {enrollment.final_amount}
- Forma de Pagamento: {enrollment.get_payment_method_display()}
{'- Parcelas: ' + str(enrollment.installments) + 'x' if enrollment.installments > 1 else ''}

Próximos Passos:
- Acesse sua área de inscrições para acompanhar o status do pagamento e pagar outras parcelas, se necessário.
- Você receberá um email assim que o pagamento completo for confirmado.
- Em caso de dúvidas, entre em contato conosco.

Acesse: {settings.FRONTEND_URL}/minhas-inscricoes

---
Este é um email automático, por favor não responda.
© 2025 AreaMais
"""
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Erro ao enviar email de confirmação de inscrição: {e}")
        return False


def send_payment_confirmation_email(enrollment):
    """
    Send confirmation email when payment is confirmed.
    """
    user_name = enrollment.form_data.get('nome_completo', enrollment.user.get_full_name())
    user_email = enrollment.form_data.get('email', enrollment.user.email)
    
    subject = f'Pagamento Confirmado - {enrollment.product.name}'
    
    # HTML email
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #dcfd61 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .info-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }}
        .success {{ color: #10b981; font-size: 48px; text-align: center; }}
        .button {{ display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success">✓</div>
            <h1>Pagamento Confirmado!</h1>
        </div>
        <div class="content">
            <p>Olá, <strong>{user_name}</strong>!</p>
            
            <p>Seu pagamento foi confirmado com sucesso! 🎉</p>
            
            <div class="info-box">
                <h3>Detalhes do Pagamento:</h3>
                <p><strong>Produto:</strong> {enrollment.product.name}</p>
                <p><strong>Lote:</strong> {enrollment.batch.name}</p>
                <p><strong>Valor Pago:</strong> R$ {enrollment.final_amount}</p>
                <p><strong>Status:</strong> ✓ Pago</p>
            </div>
            
            <p><strong>Próximos Passos:</strong></p>
            <ul>
                <li>Sua inscrição está confirmada!</li>
                <li>Você receberá mais informações sobre o acampamento em breve</li>
                <li>Acesse sua área de inscrições para ver todos os detalhes</li>
            </ul>
            
            <center>
                <a href="{settings.FRONTEND_URL}/minhas-inscricoes" class="button">
                    Ver Minhas Inscrições
                </a>
            </center>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; 2025 AreaMais - Todos os direitos reservados</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    # Plain text version
    plain_message = f"""
Pagamento Confirmado!

Olá, {user_name}!

Seu pagamento foi confirmado com sucesso!

Detalhes do Pagamento:
- Produto: {enrollment.product.name}
- Lote: {enrollment.batch.name}
- Valor Pago: R$ {enrollment.final_amount}
- Status: ✓ Pago

Próximos Passos:
- Sua inscrição está confirmada!
- Você receberá mais informações sobre o acampamento em breve
- Acesse sua área de inscrições para ver todos os detalhes

Acesse: {settings.FRONTEND_URL}/minhas-inscricoes

---
Este é um email automático, por favor não responda.
© 2025 AreaMais
"""
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Erro ao enviar email de confirmação de pagamento: {e}")
        return False
