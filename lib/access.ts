import {cookies} from 'next/headers';
import {DB} from '@/runtime/storage.mjs';
import {digest,levels} from '@/runtime/security.mjs';
export {levels};
export async function config(){const row:any=DB.prepare("SELECT value FROM settings WHERE key='access-passwords'").first();return row?JSON.parse(row.value):null;}
export async function sessionActor(){const cfg=await config();if(!cfg)throw new Error('401:Run the server setup command before signing in');const token=(await cookies()).get('ab-access')?.value;if(!token)throw new Error('401:Enter your account email and access-level password');const row:any=DB.prepare('SELECT value FROM settings WHERE key=?').bind('session:'+digest(token)).first();const s=row?JSON.parse(row.value):null;const member:any=s?DB.prepare('SELECT * FROM members WHERE email=?').bind(s.email).first():null;if(!s||s.expires<Date.now()||s.revision!==cfg.revision||!member||!levels.includes(s.role)||levels.indexOf(s.role)<levels.indexOf(member.role))throw new Error('401:Your session expired. Sign in again');return {...member,role:s.role,branch:'all',name:member.email};}
