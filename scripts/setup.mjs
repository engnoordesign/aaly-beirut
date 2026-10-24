import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {DB,dataDir} from '../runtime/storage.mjs';
import {encodePassword,newToken,levels} from '../runtime/security.mjs';
const reset=process.argv.includes('--reset-passwords');
if(DB.prepare("SELECT value FROM settings WHERE key='access-passwords'").first()&&!reset){console.log('Already initialized. To reset passwords: npm run setup -- --reset-passwords');process.exit(0);}
let quiet=false;const output=new Writable({write(chunk,encoding,cb){if(!quiet)process.stdout.write(chunk);cb();}});const rl=createInterface({input:process.stdin,output,terminal:!!process.stdin.isTTY});
async function ask(label,secret=false){quiet=secret;process.stdout.write(label);const answer=await new Promise(resolve=>rl.question('',resolve));quiet=false;if(secret)process.stdout.write('\n');return answer.trim();}
try{
 let email=reset?'':await ask('Engineer account email: ');if(!reset&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid engineer email');email=email.toLowerCase();
 const entries={revision:newToken()},seen=new Set();
 for(const role of levels){const password=await ask(role+' password (10–200 characters): ',true);const confirm=await ask('Repeat password: ',true);if(password.length<10||password.length>200||password!==confirm||seen.has(password))throw new Error('Passwords must match, contain 10–200 characters, and differ between levels');seen.add(password);entries[role]=encodePassword(password);}
 const queries=[DB.prepare("INSERT INTO settings(key,value) VALUES('access-passwords',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(entries)),DB.prepare("DELETE FROM settings WHERE key LIKE 'session:%' OR key LIKE 'login-rate:%'")];
 if(!reset){queries.push(DB.prepare("INSERT INTO members(email,role,branch) VALUES(?,'engineer','all')").bind(email));for(const role of ['manager','seller'])queries.push(DB.prepare("INSERT INTO members(email,role,branch) VALUES(?,?,'all')").bind(role+'@aaly.local',role));}
 DB.batch(queries);console.log('Setup saved in '+dataDir);if(!reset)console.log('Engineer: '+email+'\nManager: manager@aaly.local\nSeller: seller@aaly.local\nAdd named staff accounts under System settings.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{rl.close();}
