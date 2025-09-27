#!/usr/bin/env node

/**
 * Deneme süresi kontrol scripti
 * Bu script günlük olarak çalıştırılmalıdır (cron job ile)
 * 
 * Cron job kurulumu için terminalde şu komutları çalıştırın:
 * 
 * 1. crontab -e
 * 2. Şu satırı ekleyin (her gün saat 09:00'da çalışır):
 *    0 9 * * * /usr/bin/node /path/to/this/script/check-trial-expiry.js
 * 
 * Alternatif olarak, Windows Task Scheduler kullanabilirsiniz
 */

const fetch = require('node-fetch');

// Proje URL'ini buraya girin
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

async function checkTrialExpiry() {
  try {
    console.log(`[${new Date().toISOString()}] Deneme süresi kontrolü başlatılıyor...`);
    
    // Deneme süresi raporu al
    const reportResponse = await fetch(`${BASE_URL}/api/admin/trial-expiry-check`);
    
    if (!reportResponse.ok) {
      throw new Error(`HTTP error! status: ${reportResponse.status}`);
    }
    
    const reportData = await reportResponse.json();
    console.log(`[${new Date().toISOString()}] Mevcut durum:`, {
      expired: reportData.expiredUsers || 0,
      expiringSoon: reportData.expiringSoonUsers || 0
    });
    
    // Süresi dolmuş hesapları askıya al
    const suspendResponse = await fetch(`${BASE_URL}/api/admin/trial-expiry-check`, {
      method: 'POST'
    });
    
    if (!suspendResponse.ok) {
      throw new Error(`HTTP error! status: ${suspendResponse.status}`);
    }
    
    const suspendData = await suspendResponse.json();
    console.log(`[${new Date().toISOString()}] İşlem tamamlandı:`, {
      expiredUsersCount: suspendData.expiredUsersCount,
      expiredTenantsCount: suspendData.expiredTenantsCount,
      results: suspendData.results?.length || 0
    });
    
    // E-posta bildirimi gönder (isteğe bağlı)
    if (suspendData.expiredUsersCount > 0) {
      console.log(`[${new Date().toISOString()}] ${suspendData.expiredUsersCount} kullanıcı askıya alındı`);
      // Burada admin'lere e-posta gönderme kodu eklenebilir
    } else {
      console.log(`[${new Date().toISOString()}] Askıya alınacak kullanıcı bulunamadı`);
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Deneme süresi kontrolü hatası:`, error.message);
    process.exit(1);
  }
}

// Script çalıştırıldığında kontrol yap
if (require.main === module) {
  checkTrialExpiry().then(() => {
    console.log(`[${new Date().toISOString()}] Deneme süresi kontrolü başarıyla tamamlandı`);
    process.exit(0);
  }).catch(error => {
    console.error(`[${new Date().toISOString()}] Script hatası:`, error);
    process.exit(1);
  });
}

module.exports = checkTrialExpiry;