import {BUCKET} from "@/runtime/storage.mjs";
import {actor,manage,origin,problem,db,record,branchAccess,log,str} from "@/lib/server";
export async function POST(req:Request){let key:string|undefined;try{
 origin(req);const a=await actor();manage(a);if(Number(req.headers.get("content-length")??0)>11000000)throw new Error("400:File exceeds 10 MB");
 const form=await req.formData();const order=await record(str(form.get("orderId")));if(order.kind!=="order")throw new Error("400:Select an order");branchAccess(a,order.branch);
 const file=form.get("file") as File;if(!file||typeof file.arrayBuffer!=="function"||file.size>10000000||file.size===0)throw new Error("400:Upload a file up to 10 MB");
 if(!["application/pdf","image/png","image/jpeg"].includes(file.type))throw new Error("400:Upload PDF, PNG, or JPEG only");
 const bytes=await file.arrayBuffer();const sig=new Uint8Array(bytes).slice(0,5);if(!(file.type==="application/pdf"&&String.fromCharCode(...sig).startsWith("%PDF")||file.type==="image/png"&&sig[0]===137&&sig[1]===80||file.type==="image/jpeg"&&sig[0]===255&&sig[1]===216))throw new Error("400:File content does not match its type");
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(n=>n.toString(16).padStart(2,"0")).join("");
 const type=str(form.get("type"));
 const duplicate:any=await db().prepare("SELECT id FROM documents WHERE hash=? AND order_id<>? LIMIT 1").bind(hash,order.id).first();if(duplicate&&type==="Commercial invoice")throw new Error("409:This exact invoice is already attached to another order. Review the duplicate.");
 key=crypto.randomUUID();const bucket=BUCKET;if(!bucket)throw new Error("Storage unavailable");await bucket.put(key,bytes,{httpMetadata:{contentType:file.type}});
 const expiry=form.get("expiry")||null;
 await db().batch([db().prepare("INSERT INTO documents(id,order_id,name,type,hash,size,expiry,created) VALUES(?,?,?,?,?,?,?,?)").bind(key,order.id,file.name.slice(0,200),type,hash,file.size,expiry,new Date().toISOString()),log(a,"Uploaded "+type,order.id),db().prepare("UPDATE records SET data=json_set(json_remove(data,'$.approvedBy','$.approvedAt','$.approvalRules'),'$.status',CASE WHEN json_extract(data,'$.status')='Approved' THEN 'Pending' ELSE json_extract(data,'$.status') END) WHERE id=?").bind(order.id)]);
 return Response.json({ok:true,id:key});
 }catch(e){if(key)try{await BUCKET.delete(key)}catch{}return problem(e);}}
