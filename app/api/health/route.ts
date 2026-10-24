import {DB} from '@/runtime/storage.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{DB.prepare('SELECT 1').first();return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({ok:false},{status:503});}}
