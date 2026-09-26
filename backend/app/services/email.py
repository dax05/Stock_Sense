import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from app.config import settings


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


def get_otp_expiry() -> datetime:
    """Get OTP expiration time"""
    return datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send OTP email to user
    
    Args:
        to_email: Recipient email address
        otp_code: 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Password Reset OTP - Stock Sense"
        message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        message["To"] = to_email

        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: white;
                    padding: 30px;
                    border-radius: 0 0 5px 5px;
                }}
                .otp-code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #4F46E5;
                    text-align: center;
                    padding: 20px;
                    background-color: #f0f0f0;
                    border-radius: 5px;
                    letter-spacing: 5px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 12px;
                }}
                .warning {{
                    color: #dc2626;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You have requested to reset your password for your Stock Sense account.</p>
                    <p>Use the following One-Time Password (OTP) to complete your password reset:</p>
                    
                    <div class="otp-code">{otp_code}</div>
                    
                    <p>This OTP is valid for <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
                    
                    <p class="warning">⚠️ If you did not request this password reset, please ignore this email and ensure your account is secure.</p>
                    
                    <p>Thank you,<br>The Stock Sense Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
        """

        # Create plain text version as fallback
        text_content = f"""
        Password Reset Request - Stock Sense
        
        Hello,
        
        You have requested to reset your password for your Stock Sense account.
        
        Your One-Time Password (OTP) is: {otp_code}
        
        This OTP is valid for {settings.OTP_EXPIRE_MINUTES} minutes.
        
        If you did not request this password reset, please ignore this email and ensure your account is secure.
        
        Thank you,
        The Stock Sense Team
        
        ---
        This is an automated email. Please do not reply to this message.
        """

        # Attach both versions
        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        message.attach(part1)
        message.attach(part2)

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)

        return True

    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False
