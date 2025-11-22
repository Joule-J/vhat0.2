
/**
 * Kriptografik olarak güvenli rastgele oda kodu üretir.
 * Math.random() yerine window.crypto kullanır.
 * Format: XXXX-XXXX
 */
export const generateSecureRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 8;
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
    if (i === 3) result += '-';
  }
  return result;
};

/**
 * Basit Rate Limiter sınıfı.
 */
export class RateLimiter {
  private lastActionTime: number = 0;
  private cooldownMs: number;

  constructor(cooldownMs: number) {
    this.cooldownMs = cooldownMs;
  }

  tryAction(): boolean {
    const now = Date.now();
    if (now - this.lastActionTime < this.cooldownMs) {
      return false;
    }
    this.lastActionTime = now;
    return true;
  }
}

/**
 * Client-side Input Sanitization.
 * 1. HTML XSS Koruması: Tagleri encode eder.
 * 2. SQL Injection Önleyici (Basit): Tek tırnakları escape eder.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    // XSS Protection
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Basic SQL Prevention (Client-side precaution)
    .replace(/'/g, "&#x27;"); 
};

/**
 * BACKEND DESIGN SPECIFICATION: SQL INJECTION PROTECTION
 * 
 * Bu uygulama şu an P2P (sunucusuz) çalışmaktadır. Ancak bir veritabanı
 * eklendiğinde (PostgreSQL/MySQL) uyulması gereken güvenlik standardı aşağıdadır.
 * 
 * KURAL: Asla string birleştirme (concatenation) ile SQL yazma.
 * ÇÖZÜM: Parameterized Queries (Hazırlanmış Sorgular) kullan.
 */
export class MockBackendDatabaseLayer {
  
  /**
   * GÜVENSİZ YÖNTEM (ASLA KULLANMA)
   * Saldırgan ' OR '1'='1 gönderirse tüm mesajları okuyabilir.
   */
  unsafeQueryExample(roomCode: string) {
    const sql = `SELECT * FROM messages WHERE room_code = '${roomCode}'`; // TEHLİKELİ!
    console.warn("Bu sorgu SQL Injection'a açıktır.");
  }

  /**
   * GÜVENLİ YÖNTEM (Bunu Kullan)
   * Veritabanı sürücüsü input'u veri olarak işler, kod olarak çalıştırmaz.
   */
  async getMessagesSafe(roomCode: string) {
    // Örnek: Node.js 'pg' (Postgres) kütüphanesi kullanımı
    const query = 'SELECT * FROM messages WHERE room_code = $1';
    const values = [roomCode];
    
    // await db.query(query, values);
    console.log("Güvenli Sorgu Oluşturuldu:", { query, values });
    return [];
  }

  async saveMessageSafe(userId: string, content: string, roomCode: string) {
    // Input sanitization backend tarafında tekrar yapılmalıdır.
    // Ancak Parameterized Query asıl korumayı sağlar.
    const query = 'INSERT INTO messages (user_id, content, room_code) VALUES ($1, $2, $3)';
    const values = [userId, content, roomCode];
    
    // await db.query(query, values);
    console.log("Güvenli Insert Oluşturuldu:", { query, values });
  }
}