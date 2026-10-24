import {actor,db,manage,engineering,branchAccess,origin,problem,log,str,num,currency,record} from "@/lib/server";
import {defaultRules,reviewOrder} from "@/lib/review";
export async function GET(){try{
 const a=await actor();const scoped=false;const where=scoped?" WHERE branch=?":"";
 const rows=await db().prepare("SELECT * FROM records"+where+" ORDER BY created DESC").bind(...(scoped?[a.branch]:[])).all();
 let records=(rows.results as any[]).map(r=>({...JSON.parse(r.data),id:r.id,kind:r.kind,branch:r.branch,created:r.created,stage:JSON.parse(r.data).stage??(["Completed","Cancelled"].includes(JSON.parse(r.data).status)?JSON.parse(r.data).status:"Pending")})).filter(r=>r.kind!=="branch");
 if(a.role==="seller")records=records.filter(r=>["offer"].includes(r.kind));
 const inventory=await db().prepare("SELECT * FROM stock"+where).bind(...(scoped?[a.branch]:[])).all();
 const categorized=(inventory.results as any[]).map(r=>({...r,category:r.category??"raw"}));
 const safeStock=a.role==="seller"?categorized.map(({expiry,...r})=>r):categorized;
 const docs=a.role==="seller"?[]:(await db().prepare("SELECT d.* FROM documents d JOIN records r ON r.id=d.order_id"+(scoped?" WHERE r.branch=?":"")).bind(...(scoped?[a.branch]:[])).all()).results;
 const rulesRow:any= a.role==="seller"?null:await db().prepare("SELECT value FROM settings WHERE key='bank'").first();
 const rules=rulesRow?JSON.parse(rulesRow.value):defaultRules;
 const members=a.role==="engineer"?(await db().prepare("SELECT email,role,branch FROM members ORDER BY email").all()).results:[];
 const history=a.role==="seller"?[]:(await db().prepare(scoped?"SELECT a.* FROM audit a LEFT JOIN records r ON r.id=a.target LEFT JOIN stock s ON s.id=a.target WHERE r.branch=? OR s.branch=? OR a.actor=? ORDER BY a.created DESC LIMIT 100":"SELECT * FROM audit ORDER BY created DESC LIMIT 100").bind(...(scoped?[a.branch,a.branch,a.email]:[])).all()).results;
 return Response.json({actor:a,records,stock:safeStock,documents:(docs as any[]).map(d=>({...d,orderId:d.order_id})),rules,members,audit:history},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){return problem(e);}}
export async function POST(req:Request){try{
 origin(req);const a=await actor();const b:any=await req.json();const now=new Date().toISOString();const id=b.action==="sale"&&b.requestId?str(b.requestId,80):crypto.randomUUID();
 if(b.action==="member"){engineering(a);const email=str(b.email).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("400:Invalid email");if(email===a.email)throw new Error("400:You cannot change your own engineer access");if(!["engineer","manager","seller"].includes(b.role))throw new Error("400:Invalid role");await db().batch([db().prepare("INSERT INTO members(email,role,branch) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET role=excluded.role,branch=excluded.branch").bind(email,b.role,"all"),log(a,"Set member access",email)]);}
 else if(b.action==="bank"){manage(a);const rules={name:str(b.name),confirmed:b.confirmed===true,currency:currency(b.currency),requiredDocs:str(b.requiredDocs,2000).split(",").map((s:string)=>s.trim()).filter(Boolean)};await db().batch([db().prepare("INSERT INTO settings(key,value) VALUES('bank',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(rules)),log(a,"Updated bank requirements",rules.name)]);}
 else if(b.action==="sale"){
  const product:any=await db().prepare("SELECT * FROM stock WHERE id=?").bind(str(b.productId)).first();if(!product)throw new Error("404:Product not found");branchAccess(a,product.branch);
  const existing:any=await db().prepare("SELECT * FROM records WHERE id=?").bind(id).first();if(existing){const old=JSON.parse(existing.data);if(existing.kind!=="sale"||old.productId!==product.id||old.customer!==b.customer||old.qty!==Number(b.qty))throw new Error("409:Request reference already used");return Response.json({ok:true,id});}
  const qty=num(b.qty,1,1000000);if(!Number.isInteger(qty))throw new Error("400:Quantity must be whole units");
  const customer=str(b.customer);let discount=0;
  if(b.offerId){const offer=await record(b.offerId);if(offer.kind!=="offer"||offer.until<now.slice(0,10))throw new Error("400:Offer is not valid");discount=num(offer.discount,0,100);}
  const amountCents=Math.round(product.price*qty*(1-discount/100));const data=JSON.stringify({customer,product:product.name,productId:product.id,qty,amount:amountCents/100,currency:product.currency,status:"Completed",discount});
  const ledger=JSON.stringify({description:"Sale: "+customer,amount:amountCents/100,currency:product.currency,debit:"Cash",credit:"Sales",source:id});
  const result=await db().batch([
   db().prepare("INSERT INTO records(id,kind,branch,data,created) SELECT ?,'sale',?,?,? WHERE EXISTS(SELECT 1 FROM stock WHERE id=? AND qty>=?)").bind(id,product.branch,data,now,product.id,qty),
   db().prepare("UPDATE stock SET qty=qty-? WHERE id=? AND EXISTS(SELECT 1 FROM records WHERE id=?)").bind(qty,product.id,id),
   db().prepare("INSERT INTO records(id,kind,branch,data,created) SELECT ?,'ledger',?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=?)").bind(crypto.randomUUID(),product.branch,ledger,now,id),
   db().prepare("INSERT INTO audit(id,actor,action,target,created) SELECT ?,?,'Recorded sale',?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=?)").bind(crypto.randomUUID(),a.email,id,now,id)
  ]);if(!result[0].meta.changes)throw new Error("409:Insufficient stock. Refresh and try again.");
 }
 else if(b.action==="stock"){manage(a);if(!["raw","cooked"].includes(b.category))throw new Error("400:Select a material category");const qty=num(b.qty,0,1e8);if(!Number.isInteger(qty))throw new Error("400:Quantity must be whole units");await db().batch([db().prepare("INSERT INTO stock(id,branch,name,sku,qty,price,currency,minimum,unit,expiry,category) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(id,"company",str(b.name),str(b.sku),qty,Math.round(num(b.price)*100),currency(b.currency),Math.round(num(b.minimum)),str(b.unit),b.expiry||null,b.category),log(a,"Added stock",id)]);}
 else if(b.action==="adjust"){manage(a);const p:any=await db().prepare("SELECT * FROM stock WHERE id=?").bind(str(b.id)).first();if(!p)throw new Error("404:Product not found");branchAccess(a,p.branch);const delta=num(b.delta,-1e8,1e8);if(!Number.isInteger(delta))throw new Error("400:Enter a whole quantity adjustment");if(!["raw","cooked"].includes(b.category))throw new Error("400:Select a material category");if(delta===0&&b.category===p.category)throw new Error("400:Change the quantity or material storage");const reason=str(b.reason);const r=await db().batch([db().prepare("UPDATE stock SET qty=qty+?, category=? WHERE id=? AND qty+?>=0").bind(delta,b.category,p.id,delta),db().prepare("INSERT INTO audit(id,actor,action,target,created) SELECT ?,?,?,?,? WHERE changes()>0").bind(crypto.randomUUID(),a.email,"Stock adjustment "+delta+" / "+b.category+" ("+reason+")",p.id,now)]);if(!r[0].meta.changes)throw new Error("409:Adjustment would make stock negative");}
 else if(b.action==="approve"||b.action==="status"||b.action==="stage"){
  manage(a);const order=await record(str(b.id));if(order.kind!=="order")throw new Error("400:Not an order");branchAccess(a,order.branch);
  if(b.action==="approve"){const rr:any=await db().prepare("SELECT value FROM settings WHERE key='bank'").first();const docs=(await db().prepare("SELECT *, order_id AS orderId FROM documents WHERE order_id=?").bind(order.id).all()).results;const all=(await db().prepare("SELECT * FROM records WHERE kind='order'").all()).results.map((r:any)=>({...JSON.parse(r.data),id:r.id}));if(!reviewOrder(order,docs,rr?JSON.parse(rr.value):defaultRules,all).passed)throw new Error("400:Resolve all bank checks before approval");order.approvedBy=a.email;order.approvedAt=now;order.approvalRules=JSON.stringify(rr?JSON.parse(rr.value):defaultRules);order.status="Approved";}
  else if(b.action==="stage"){if(!["Pending","In transit","Raw materials received","Cooking","Cooked materials ready","Completed","Cancelled"].includes(b.stage))throw new Error("400:Invalid stage");order.stage=b.stage;order.status=["Completed","Cancelled"].includes(b.stage)?b.stage:b.stage==="Pending"?"Pending":"Processing";}
  else {if(!["Pending","Processing","Completed","Cancelled"].includes(b.status))throw new Error("400:Invalid status");order.status=b.status;if(["Completed","Cancelled","Pending"].includes(b.status))order.stage=b.status;}
  await db().batch([db().prepare("UPDATE records SET data=? WHERE id=?").bind(JSON.stringify(order),order.id),log(a,b.action==="approve"?"Approved document checklist":"Updated order status",order.id)]);
 }
 else if(b.action==="record"){
  manage(a);if(!["order","contact","offer","ledger"].includes(b.kind))throw new Error("400:Invalid record type");
  const d=b.data??{};let branch=b.id?(await record(str(b.id))).branch:"company";
  let data:any;
  
  if(b.kind==="order"){data={reference:str(d.reference),customer:str(d.customer),supplier:str(d.supplier),buyer:str(d.buyer),beneficiary:d.beneficiary?.trim()??"",invoiceNumber:d.invoiceNumber?.trim()??"",invoiceDate:d.invoiceDate??"",amount:num(d.amount,0.01),lineTotal:num(d.lineTotal),currency:currency(d.currency),due:d.due??"",notes:d.notes?.slice(0,4000)??"",status:"Pending",stage:"Pending"};}
  if(b.kind==="contact")data={name:str(d.name),type:str(d.type),phone:str(d.phone),email:d.email??"",notes:d.notes?.slice(0,4000)??"",followUp:d.followUp??""};
  if(b.kind==="offer")data={name:str(d.name),discount:num(d.discount,0,100),until:str(d.until),notes:d.notes??""};
  if(b.kind==="ledger"){const debit=str(d.debit),credit=str(d.credit);if(debit===credit)throw new Error("400:Debit and credit accounts must differ");data={description:str(d.description),debit,credit,amount:num(d.amount,0.01),currency:currency(d.currency)};}
  if(b.id){const old=await record(str(b.id));branchAccess(a,old.branch);if(old.kind!==b.kind||old.branch!==branch)throw new Error("400:Record type and branch cannot change");if(b.kind==="ledger")throw new Error("400:Posted journal entries are immutable");if(b.kind==="order"){data.status=old.status==="Approved"?"Pending":old.status;data.stage=old.stage??"Pending";}await db().batch([db().prepare("UPDATE records SET data=? WHERE id=?").bind(JSON.stringify(data),old.id),log(a,"Edited "+b.kind,old.id)]);}else await db().batch([db().prepare("INSERT INTO records(id,kind,branch,data,created) VALUES(?,?,?,?,?)").bind(id,b.kind,branch,JSON.stringify(data),now),log(a,"Created "+b.kind,id)]);
 }
 else throw new Error("400:Unknown action");
 return Response.json({ok:true,id});
 }catch(e){return problem(e);}}
