export const defaultRules={name:"Unconfigured bank",confirmed:false,requiredDocs:["Commercial invoice","Bank request","Company registration"],currency:"USD"};
export function reviewOrder(order:any,docs:any[],rules:any,orders:any[]){
 const checks:{label:string,pass:boolean,detail:string}[]=[];
 const add=(label:string,pass:boolean,detail:string)=>checks.push({label,pass,detail});
 add("Bank requirements confirmed",rules.confirmed===true,"Confirm your bank's actual requirements in Bank rules.");
 add("Invoice number",!!order.invoiceNumber,"Enter the invoice reference.");
 add("Supplier and beneficiary",!!order.supplier&&!!order.beneficiary&&order.supplier.trim().toLowerCase()===order.beneficiary.trim().toLowerCase(),"Supplier and bank beneficiary must match; differences need bank clarification.");
 add("Buyer name",!!order.buyer,"Enter the buyer's legal name.");
 add("Invoice date",!!order.invoiceDate && order.invoiceDate<=new Date().toISOString().slice(0,10),"Enter a valid invoice date, not in the future.");
 add("Currency",order.currency===rules.currency,"Invoice currency must match this bank profile.");
 add("Invoice total",Number(order.amount)>0&&Number(order.lineTotal)>0&&Math.abs(Number(order.amount)-Number(order.lineTotal))<0.005,"Declared invoice total must equal the independently entered line total.");
 add("Duplicate invoice reference",!!order.invoiceNumber&&!orders.some(o=>o.id!==order.id&&o.invoiceNumber===order.invoiceNumber&&o.supplier?.toLowerCase()===order.supplier?.toLowerCase()),"This supplier's invoice number must be unique.");
 for(const name of rules.requiredDocs??[]){const found=docs.filter(d=>d.orderId===order.id&&d.type===name);add(name,found.some(d=>!d.expiry||d.expiry>=new Date().toISOString().slice(0,10)),"Upload a current "+name+".");}
 return {checks,passed:checks.every(c=>c.pass),missing:checks.filter(c=>!c.pass).map(c=>c.label)};
}
