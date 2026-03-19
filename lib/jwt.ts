import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

export function createToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Invalid token');
  }
}
