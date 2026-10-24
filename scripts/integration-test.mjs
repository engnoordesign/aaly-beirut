import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
process.env.DATA_DIR=mkdtempSync(path.join(os.tmpdir(),'aaly-http-'));
const {DB}=await import('../runtime/storage.mjs');const {encodePassword,newToken}=await import('../runtime/security.mjs');
const passwords={engineer:'engineer-test-Password',manager:'manager-test-Password',seller:'seller-test-Password'};
const cfg={revision:newToken()};for(const role of Object.keys(passwords)){cfg[role]=encodePassword(passwords[role]);DB.prepare("INSERT INTO members(email,role,branch) VALUES(?,?,'all')").bind(role+'@example.com',role).run();}
DB.prepare("INSERT INTO settings VALUES('access-passwords',?)").bind(JSON.stringify(cfg)).run();
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const url='http://127.0.0.1:'+port;let log='';const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,APP_ORIGIN:url,COOKIE_SECURE:'false',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let cookie='';
async function call(route,body,status=200){const r=await fetch(url+route,{method:body?'POST':'GET',headers:{origin:url,...(cookie?{cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json();assert.equal(r.status,status,JSON.stringify(j));const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];return j;}
async function login(role){return call('/api/access',{email:role+'@example.com',role,password:passwords[role]});}
try{
 for(let i=0;i<100;i++){try{const r=await fetch(url+'/api/health');if(r.ok)break;}catch{}if(i===99)throw new Error('Server did not start: '+log);await new Promise(r=>setTimeout(r,200));}
 assert.equal((await fetch(url+'/')).status,200);
 await call('/api/workspace',null,401);
 await call('/api/access',{email:'seller@example.com',role:'engineer',password:passwords.engineer},403);
 await login('engineer');
 const stock=await call('/api/workspace',{action:'stock',category:'raw',name:'Almonds',sku:'A-1',qty:10,price:5,minimum:2,currency:'USD',unit:'kg'});
 await call('/api/workspace',{action:'adjust',id:stock.id,category:'cooked',delta:0,reason:'Classification test'});
 const order=await call('/api/workspace',{action:'record',kind:'order',data:{reference:'AB-TEST',customer:'Customer',supplier:'Supplier',buyer:'Aaly',beneficiary:'Supplier',invoiceNumber:'TEST-1',invoiceDate:'2026-01-01',amount:50,lineTotal:50,currency:'USD'}});
 await call('/api/workspace',{action:'stage',id:order.id,stage:'In transit'});
 await call('/api/workspace',{action:'bank',name:'Test bank',currency:'USD',confirmed:true,requiredDocs:'Commercial invoice'});
 const form=new FormData();form.append('file',new Blob(['%PDF-1.4\n%Test file'],{type:'application/pdf'}),'invoice.pdf');form.append('orderId',order.id);form.append('type','Commercial invoice');
 const upload=await fetch(url+'/api/documents',{method:'POST',headers:{origin:url,cookie},body:form});assert.equal(upload.status,200,await upload.clone().text());const doc=await upload.json();
 await call('/api/workspace',{action:'approve',id:order.id});
 const file=await fetch(url+'/api/files/'+doc.id,{headers:{cookie}});assert.equal(file.status,200);assert((await file.text()).startsWith('%PDF'));
 await call('/api/export');
 await call('/api/access',{action:'logout'});await call('/api/workspace',null,401);
 await login('seller');const seller=await call('/api/workspace');assert.equal(seller.documents.length,0);assert.equal(seller.members.length,0);assert(!seller.records.some(x=>x.kind==='order'));
 await call('/api/workspace',{action:'adjust',id:stock.id,category:'raw',delta:1,reason:'forbidden'},403);await call('/api/export',null,403);
 const blocked=await fetch(url+'/api/files/'+doc.id,{headers:{cookie}});assert.equal(blocked.status,403);
 const sale={action:'sale',productId:stock.id,qty:2,customer:'Buyer',requestId:'idempotent-sale'};await call('/api/workspace',sale);await call('/api/workspace',sale);
 const after=await call('/api/workspace');assert.equal(after.stock.find(p=>p.id===stock.id).qty,8);
 await call('/api/workspace',{...sale,requestId:'oversell',qty:99},409);
 await call('/api/access',{action:'logout'});await login('manager');await call('/api/workspace',{action:'member',email:'x@y.com',role:'engineer'},403);
 const csrf=await fetch(url+'/api/workspace',{method:'POST',headers:{origin:'https://evil.example',cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403);
 console.log('PASS: real production HTTP login, permissions, migrations, raw/cooked stock, idempotent sales, uploads/downloads, bank approval, export, and origin checks.');
}catch(e){console.error(log);throw e;}finally{server.kill('SIGTERM');}
