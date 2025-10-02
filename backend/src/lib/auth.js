import dotenv from 'dotenv';
dotenv.config();  // OVO MORA BITI NA VRHU

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET || 'tajna_jwt_kljuc';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(password, hash) {
  return await bcrypt.compare(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    console.log('Verifying token with secret:', SECRET);
    const payload = jwt.verify(token, SECRET);
    return payload;
  } catch (err) {
    console.error('verifyToken error:', err.message);
    return null;
  }
}
