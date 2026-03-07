const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Simple JWT implementation for Node.js
export function createToken(payload: any): string {
  const crypto = require('crypto');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${header}.${data}`);
  const signature = Buffer.from(hmac.digest('base64')).toString('base64');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const [header, data, signature] = token.split('.');
    if (!header || !data || !signature) {
      throw new Error('Invalid token format');
    }
    
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${header}.${data}`);
    const expectedSignature = Buffer.from(hmac.digest('base64')).toString('base64');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    return JSON.parse(decodedData);
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
}
