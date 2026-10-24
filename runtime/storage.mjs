import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, chmodSync } from 'node:fs';
import path from 'node:path';
export const dataDir=path.resolve(process.env.DATA_DIR||'data');
let connection;
export function database(){
 if(connection)return connection;
 mkdirSync(dataDir,{recursive:true,mode:0o700});
 const file=path.join(dataDir,'aaly.sqlite');connection=new DatabaseSync(file);chmodSync(file,0o600);
 connection.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 connection.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied TEXT NOT NULL)');
 const migrations=path.resolve('drizzle');
 for(const name of readdirSync(migrations).filter(f=>f.endsWith('.sql')).sort()){
  if(connection.prepare('SELECT name FROM _migrations WHERE name=?').get(name))continue;
  connection.exec('BEGIN IMMEDIATE');try{connection.exec(readFileSync(path.join(migrations,name),'utf8'));connection.prepare('INSERT INTO _migrations VALUES (?,?)').run(name,new Date().toISOString());connection.exec('COMMIT');}catch(e){connection.exec('ROLLBACK');throw e;}
 }
 return connection;
}
class Statement{
 constructor(sql,params=[]){this.sql=sql;this.params=params;}
 bind(...params){return new Statement(this.sql,params.map(v=>v===undefined?null:v));}
 first(){return database().prepare(this.sql).get(...this.params)||null;}
 all(){return {results:database().prepare(this.sql).all(...this.params)};}
 run(){const r=database().prepare(this.sql).run(...this.params);return {meta:{changes:Number(r.changes)}};}
}
export const DB={prepare(sql){return new Statement(sql)},batch(statements){const db=database();db.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>s.run());db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}};
function blobPath(key){if(!/^[a-zA-Z0-9-]{1,100}$/.test(key))throw new Error('400:Invalid file identifier');const dir=path.join(dataDir,'uploads');mkdirSync(dir,{recursive:true,mode:0o700});return path.join(dir,key);}
export const BUCKET={
 async put(key,bytes,{httpMetadata}={}){const file=blobPath(key);writeFileSync(file,Buffer.from(bytes),{mode:0o600,flag:'wx'});writeFileSync(file+'.json',JSON.stringify(httpMetadata||{}),{mode:0o600});},
 async get(key){const file=blobPath(key);if(!existsSync(file))return null;return {body:new Uint8Array(readFileSync(file)),httpMetadata:existsSync(file+'.json')?JSON.parse(readFileSync(file+'.json','utf8')):{}};},
 async delete(key){const file=blobPath(key);for(const p of [file,file+'.json'])if(existsSync(p))unlinkSync(p);}
};
