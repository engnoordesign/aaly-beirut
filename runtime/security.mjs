import { scryptSync, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
export const levels=['engineer','manager','seller'];
export const digest=value=>createHash('sha256').update(value).digest('hex');
export function encodePassword(value){const salt=randomBytes(24).toString('hex');return {salt,hash:scryptSync(value,salt,64).toString('hex')};}
export function verifyPassword(value,stored){if(typeof value!=='string'||value.length>200||!stored?.salt||!stored?.hash)return false;const actual=scryptSync(value,stored.salt,64),expected=Buffer.from(stored.hash,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export const newToken=()=>randomBytes(48).toString('base64url');
