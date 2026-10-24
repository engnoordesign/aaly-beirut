import {DB} from '@/runtime/storage.mjs';
import {sessionActor} from '@/lib/access';
export function db(){return DB;}
export async function actor(){return sessionActor();}
export function manage(a:any){if(a.role==="seller")throw new Error("403:Manager access required");}
export function engineering(a:any){if(a.role!=="engineer")throw new Error("403:Engineer access required");}
export function branchAccess(a:any,branch:string){if(a.branch!=="all"&&a.branch!==branch)throw new Error("403:Branch access denied");}
export function origin(request:Request){const o=request.headers.get("origin");const expected=process.env.APP_ORIGIN||new URL(request.url).origin;if(!o||o!==expected)throw new Error("403:Invalid request origin");}
export function problem(e:any){console.error(e);const m=e.message??"";const status=/^(400|401|403|404|409):/.test(m)?Number(m.slice(0,3)):503;return Response.json({error:status===503?"Service unavailable. Your changes were not saved. Please try again.":m.slice(4)},{status});}
export function log(a:any,action:string,target:string){return db().prepare("INSERT INTO audit(id,actor,action,target,created) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),a.email,action,target,new Date().toISOString());}
export function str(v:any,max=200){if(typeof v!=="string"||!v.trim()||v.length>max)throw new Error("400:Required text is missing or too long");return v.trim();}
export function num(v:any,min=0,max=1e12){const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw new Error("400:Invalid numeric value");return n;}
export function currency(v:any){if(!["USD","IQD"].includes(v))throw new Error("400:Unsupported currency");return v;}
export async function record(id:string){const r:any=await db().prepare("SELECT * FROM records WHERE id=?").bind(id).first();if(!r)throw new Error("404:Record not found");return {...JSON.parse(r.data),id:r.id,kind:r.kind,branch:r.branch,created:r.created};}
