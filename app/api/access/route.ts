import {cookies} from 'next/headers';
import {actor,db,engineering,origin,problem,log} from '@/lib/server';
import {config,levels} from '@/lib/access';
import {digest,encodePassword,verifyPassword,newToken} from '@/runtime/security.mjs';
export const runtime='nodejs';
export async function GET(){try{const cfg=await config();let unlocked=false;try{await actor();unlocked=true;}catch{}return Response.json({configured:!!cfg,unlocked,roles:levels,setup:false,needsServerSetup:!cfg},{headers:{'Cache-Control':'no-store'}});}catch(e){return problem(e);}}
export async function POST(req:Request){try{
 origin(req);const b:any=await req.json();const jar=await cookies();
 if(b.action==='logout'){const token=jar.get('ab-access')?.value;if(token)db().prepare('DELETE FROM settings WHERE key=?').bind('session:'+digest(token)).run();jar.delete('ab-access');return Response.json({ok:true});}
 if(b.action==='configure'){
  const a=await actor();engineering(a);const passwords=levels.map(r=>b.passwords?.[r]);if(passwords.some(p=>typeof p!=='string'||p.length<10||p.length>200))throw new Error('400:Each password must contain 10–200 characters');if(new Set(passwords).size!==3)throw new Error('400:Use different passwords for the three levels');const entries:any={revision:newToken()};for(const role of levels)entries[role]=encodePassword(b.passwords[role]);db().batch([db().prepare("UPDATE settings SET value=? WHERE key='access-passwords'").bind(JSON.stringify(entries)),db().prepare("DELETE FROM settings WHERE key LIKE 'session:%'"),log(a,'Updated access passwords','access')]);jar.delete('ab-access');return Response.json({ok:true});
 }
 const cfg=await config();if(!cfg)throw new Error('401:Run npm run setup on the server first');
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
 if(email.length>200||!email||!levels.includes(b.role)||typeof b.password!=='string'||b.password.length>200)throw new Error('400:Enter your email, access level, and password');
 const now=Date.now(),key='login-rate:'+digest(email);
 const r:any=db().prepare("INSERT INTO settings(key,value) VALUES(?,json_object('count',1,'until',?)) ON CONFLICT(key) DO UPDATE SET value=json_object('count',CASE WHEN json_extract(value,'$.until')<? THEN 1 ELSE json_extract(value,'$.count')+1 END,'until',CASE WHEN json_extract(value,'$.until')<? THEN ? ELSE json_extract(value,'$.until') END) RETURNING value").bind(key,now+900000,now,now,now+900000).first();
 if(JSON.parse(r.value).count>5)throw new Error('403:Too many attempts. Try again in 15 minutes');
 const member:any=db().prepare('SELECT * FROM members WHERE email=?').bind(email).first();
 if(!member||levels.indexOf(b.role)<levels.indexOf(member.role)||!verifyPassword(b.password,cfg[b.role]))throw new Error('403:Incorrect account, level, or password');
 const token=newToken();db().batch([db().prepare('DELETE FROM settings WHERE key=?').bind(key),db().prepare("DELETE FROM settings WHERE key LIKE 'session:%' AND json_extract(value,'$.expires')<?").bind(now),db().prepare('INSERT INTO settings(key,value) VALUES(?,?)').bind('session:'+digest(token),JSON.stringify({email,role:b.role,revision:cfg.revision,expires:now+28800000})),log({email},'Signed in as '+b.role,'access')]);
 jar.set('ab-access',token,{httpOnly:true,secure:process.env.COOKIE_SECURE!=='false',sameSite:'strict',path:'/',maxAge:28800});return Response.json({ok:true});
 }catch(e){return problem(e);}}
