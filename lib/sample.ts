export const sample:any={
 actor:{name:"Noor Mahmood",email:"Sample engineer",role:"engineer",branch:"all"},
 records:[
 {id:"o1",kind:"order",branch:"mosul",reference:"AB-2026-1042",customer:"Al Noor Markets",supplier:"Levant Foods Trading",buyer:"Aaly Beirut",beneficiary:"Levant Foods Trading",invoiceNumber:"LF-4821",invoiceDate:"2026-10-01",amount:12480,lineTotal:12480,currency:"USD",due:"2026-10-08",status:"Pending",notes:"Mixed nuts wholesale shipment"},
 {id:"o2",kind:"order",branch:"baghdad",reference:"AB-2026-1041",customer:"Tigris Retail Group",supplier:"Cedar Trading",buyer:"Aaly Beirut",beneficiary:"Cedar Trading",invoiceNumber:"CT-2190",invoiceDate:"2026-10-01",amount:8250,lineTotal:8250,currency:"USD",due:"2026-10-06",stage:"In transit",status:"Processing"},
 {id:"o3",kind:"order",branch:"erbil",reference:"AB-2026-1040",customer:"Dara Food Stores",supplier:"Levant Foods Trading",buyer:"Aaly Beirut",beneficiary:"Levant Foods Trading",invoiceNumber:"LF-4818",invoiceDate:"2026-09-30",amount:5600,lineTotal:5600,currency:"USD",due:"2026-10-05",status:"Pending"},
 {id:"o4",kind:"order",branch:"mosul",reference:"AB-2026-1039",customer:"Nineveh Supermarket",supplier:"Cedar Trading",buyer:"Aaly Beirut",beneficiary:"Cedar Trading",invoiceNumber:"CT-2182",invoiceDate:"2026-09-28",amount:9700,lineTotal:9700,currency:"USD",due:"2026-10-03",stage:"Completed",status:"Completed"},
 ...[2200,3400,2800,4100,3600,5800,4580].map((amount,i)=>({id:"s"+i,kind:"sale",branch:["mosul","baghdad","erbil"][i%3],customer:["Al Noor Markets","Tigris Retail Group","Dara Food Stores"][i%3],product:"Mixed nuts · Premium",qty:100,amount,currency:"USD",status:"Completed",created:new Date(Date.UTC(2026,8,27+i,11)).toISOString()})),
 {id:"c1",kind:"contact",branch:"mosul",name:"Al Noor Markets",type:"Customer",phone:"+964 770 000 0000",email:"",notes:"Weekly wholesale orders. Sample contact.",followUp:"2026-10-05"},
 {id:"c2",kind:"contact",branch:"baghdad",name:"Cedar Trading",type:"Supplier",phone:"+964 780 000 0000",notes:"Supplier documentation follow-up. Sample contact.",followUp:"2026-10-07"},
 {id:"f1",kind:"offer",branch:"mosul",name:"Autumn wholesale offer",discount:5,until:"2026-10-31",notes:"Sample company-wide offer."},
 {id:"l1",kind:"ledger",branch:"mosul",description:"Wholesale sale · Al Noor Markets",amount:4580,currency:"USD",debit:"Cash",credit:"Sales",created:"2026-10-03T11:00:00Z"},
 {id:"l2",kind:"ledger",branch:"baghdad",description:"Warehouse rent",amount:1250,currency:"USD",debit:"Rent expense",credit:"Cash",created:"2026-10-01T11:00:00Z"}
 ],
 stock:[
 {id:"p1",category:"cooked",branch:"mosul",name:"Pistachios · Roasted",sku:"NUT-001",qty:420,price:1850,currency:"USD",minimum:100,unit:"kg",expiry:"2027-03-01"},
 {id:"p2",category:"raw",branch:"mosul",name:"Cashews · Premium",sku:"NUT-002",qty:68,price:1425,currency:"USD",minimum:100,unit:"kg",expiry:"2027-02-15"},
 {id:"p3",category:"raw",branch:"baghdad",name:"Almonds · Raw",sku:"NUT-003",qty:350,price:1100,currency:"USD",minimum:80,unit:"kg",expiry:"2027-04-01"},
 {id:"p4",category:"cooked",branch:"erbil",name:"Mixed nuts · Premium",sku:"NUT-004",qty:540,price:1600,currency:"USD",minimum:150,unit:"kg",expiry:"2027-01-10"},
 {id:"p5",category:"raw",branch:"baghdad",name:"Walnuts · Shelled",sku:"NUT-005",qty:42,price:950,currency:"USD",minimum:75,unit:"kg",expiry:"2027-02-01"},
 {id:"p6",category:"raw",branch:"erbil",name:"Sunflower seeds",sku:"NUT-006",qty:610,price:450,currency:"USD",minimum:120,unit:"kg",expiry:"2027-06-01"}
 ],
 documents:[{id:"d1",orderId:"o1",type:"Commercial invoice",name:"LF-4821-invoice.pdf",size:241200,hash:"sample",created:"2026-10-01"},{id:"d2",orderId:"o1",type:"Company registration",name:"registration.pdf",size:182000,hash:"sample2",created:"2026-10-01"},{id:"d3",orderId:"o2",type:"Commercial invoice",name:"CT-2190.pdf",size:329000,hash:"sample3",created:"2026-10-01"}],
 rules:{name:"Sample bank checklist",confirmed:false,currency:"USD",requiredDocs:["Commercial invoice","Bank request","Company registration"]},
 members:[{email:"engineer@example.com",role:"engineer",branch:"all"},{email:"manager@example.com",role:"manager",branch:"all"},{email:"seller@example.com",role:"seller",branch:"mosul"}],
 audit:[{id:"a1",actor:"Sample manager",action:"Uploaded Commercial invoice",target:"AB-2026-1042",created:"2026-10-03T09:24:00Z"},{id:"a2",actor:"Sample seller",action:"Recorded sale",target:"Al Noor Markets",created:"2026-10-03T09:10:00Z"},{id:"a3",actor:"Sample engineer",action:"Set member access",target:"Company seller",created:"2026-10-02T15:00:00Z"}]
};
