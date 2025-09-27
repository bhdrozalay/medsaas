import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, type = 'basic' } = await request.json();
    
    if (!to) {
      return NextResponse.json({
        error: 'E-posta adresi gereklidir',
        code: 'MISSING_EMAIL'
      }, { status: 400 });
    }

    // SMTP konfigürasyonunu kontrol et
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        error: 'SMTP ayarları yapılmamış',
        code: 'SMTP_NOT_CONFIGURED'
      }, { status: 500 });
    }

    // Email transporter oluştur
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });

    // Email içeriğini hazırla
    let html = '';
    let emailSubject = subject || 'MedSAS Test Email';

    switch (type) {
      case 'welcome':
        emailSubject = '🎉 Hoş Geldiniz! MedSAS Test';
        html = getWelcomeTestEmail();
        break;
      case 'verification':
        emailSubject = '✉️ E-posta Doğrulama Test - MedSAS';
        html = getVerificationTestEmail();
        break;
      case 'admin':
        emailSubject = '🔔 Yeni Kayıt Test Bildirimi - MedSAS Admin';
        html = getAdminTestEmail();
        break;
      default:
        html = getBasicTestEmail();
    }

    // Email gönder
    const info = await transporter.sendMail({
      from: `"MedSAS Test" <${process.env.SMTP_FROM}>`,
      to,
      subject: emailSubject,
      html,
      text: 'Bu bir MedSAS email sistemi testidir.'
    });

    console.log(`Test email sent to ${to}:`, info.messageId);

    return NextResponse.json({
      success: true,
      message: `Test email "${type}" başarıyla gönderildi!`,
      data: {
        messageId: info.messageId,
        to,
        subject: emailSubject,
        type
      }
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    // SMTP hata analizi
    let errorMessage = 'Email gönderilirken bir hata oluştu';
    let errorCode = 'SMTP_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'SMTP kullanıcı adı veya şifresi hatalı';
        errorCode = 'INVALID_CREDENTIALS';
      } else if (error.message.includes('Connection timeout')) {
        errorMessage = 'SMTP bağlantı zaman aşımı';
        errorCode = 'CONNECTION_TIMEOUT';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'SMTP sunucusu bulunamadı';
        errorCode = 'SMTP_HOST_NOT_FOUND';
      }
    }

    return NextResponse.json({
      error: errorMessage,
      code: errorCode,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getBasicTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>MedSAS Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #16a085; text-align: center;">🧪 MedSAS Email Testi</h1>
          <p style="color: #2c3e50; text-align: center; font-size: 16px;">
            Bu bir test emailidir. SMTP ayarlarınız doğru çalışıyor! ✅
          </p>
          <div style="background: #e8f8f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="color: #16a085; margin: 0; font-weight: bold;">✉️ Email sisteminiz hazır!</p>
          </div>
          <p style="color: #7f8c8d; text-align: center; font-size: 12px; margin-top: 30px;">
            © 2024 MedSAS - Email Sistemi Test
          </p>
        </div>
      </body>
    </html>
  `;
}

function getWelcomeTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome Test Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #16a085 0%, #2980b9 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">🏥 MedSAS</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Hoş Geldin Email Testi</p>
          </div>
          
          <div style="padding: 50px 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 28px; font-weight: bold;">🎉 Test Başarılı!</h2>
              <p style="color: #34495e; margin: 0; font-size: 18px;">
                Welcome email template'i çalışıyor! 
              </p>
            </div>
            
            <div style="background: linear-gradient(135deg, #e8f8f5, #d5f4e6); border-left: 4px solid #16a085; padding: 25px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #16a085; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">✅ Email Sistemi Aktif!</h3>
              <p style="color: #2c3e50; margin: 0; font-size: 16px; line-height: 1.6;">
                SMTP ayarlarınız doğru yapılandırılmış ve email gönderimi çalışıyor.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; padding: 15px 35px; margin: 10px; background: linear-gradient(135deg, #16a085, #2980b9); color: #ffffff; border-radius: 30px; font-size: 16px; font-weight: bold;">
                🚀 Test Tamamlandı
              </div>
            </div>
          </div>
          
          <div style="background-color: #2c3e50; padding: 30px 40px; text-align: center;">
            <p style="color: #95a5a6; margin: 0; font-size: 12px;">
              © 2024 MedSAS - Email Sistem Testi
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getVerificationTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification Test</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #16a085, #2980b9); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">MedSAS</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">E-posta Doğrulama Testi</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">🧪 Test Kullanıcısı!</h2>
            
            <p style="color: #5a6c7d; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Bu e-posta doğrulama template'inin test versiyonudur. Gerçek kullanımda burada doğrulama linki olacak.
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #16a085; padding: 20px; border-radius: 4px; margin: 25px 0;">
              <p style="color: #2c3e50; margin: 0; font-size: 16px; line-height: 1.6;">
                <strong>✅ Test Başarılı:</strong> E-posta doğrulama sistemi çalışıyor!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #16a085, #2980b9); color: #ffffff; border-radius: 25px; font-size: 16px; font-weight: bold;">
                ✉️ Test Email Doğrulaması
              </div>
            </div>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px 30px; text-align: center; border-top: 1px solid #bdc3c7;">
            <p style="color: #7f8c8d; margin: 0; font-size: 12px;">
              © 2024 MedSAS - Email Doğrulama Test Sistemi
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function getAdminTestEmail(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Admin Notification Test</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e74c3c; margin: 0;">🔔 MedSAS Admin</h1>
            <p style="color: #7f8c8d; margin: 10px 0 0 0;">Admin Bildirim Test Sistemi</p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #f39c12; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <h2 style="color: #d35400; margin: 0 0 10px 0;">🧪 Test Bildirimi!</h2>
            <p style="color: #8e6a00; margin: 0;">Bu bir admin bildirim sistemi testidir.</p>
          </div>
          
          <div style="margin: 30px 0;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0;">📋 Test Bilgileri</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ecf0f1; font-weight: bold;">Test Tipi:</td>
                <td style="padding: 10px; border-bottom: 1px solid #ecf0f1;">Admin Notification</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ecf0f1; font-weight: bold;">Durum:</td>
                <td style="padding: 10px; border-bottom: 1px solid #ecf0f1;">✅ Başarılı</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">SMTP:</td>
                <td style="padding: 10px;">Çalışıyor</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #d5f4e6; border-left: 4px solid #16a085; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <h3 style="color: #16a085; margin: 0 0 10px 0;">✅ Test Sonucu</h3>
            <p style="color: #2c3e50; margin: 0;">Admin bildirim sistemi başarıyla çalışıyor!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 12px 25px; background: #3498db; color: white; border-radius: 5px; margin: 5px;">
              🧪 Test Tamamlandı
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}