import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
process.env.DATA_DIR=mkdtempSync(path.join(os.tmpdir(),'aaly-test-'));
const {DB,BUCKET}=await import('../runtime/storage.mjs');
const {encodePassword,verifyPassword}=await import('../runtime/security.mjs');
test('migrations, parameter binding, and transactional rollback',()=>{
 assert(DB.prepare("PRAGMA table_info(stock)").all().results.some(x=>x.name==='category'));
 assert.throws(()=>DB.batch([DB.prepare("INSERT INTO settings VALUES('rollback','1')"),DB.prepare('INSERT INTO missing_table VALUES(1)')]));
 assert.equal(DB.prepare("SELECT * FROM settings WHERE key='rollback'").first(),null);
 const hostile="x'); DROP TABLE settings; --";DB.prepare('INSERT INTO settings VALUES(?,?)').bind('parameter',hostile).run();assert.equal(DB.prepare("SELECT value FROM settings WHERE key='parameter'").first().value,hostile);
});
test('password hashing and matching',()=>{const h=encodePassword('test-password-123');assert(verifyPassword('test-password-123',h));assert(!verifyPassword('wrong',h));assert(!h.hash.includes('test-password'));});
test('private document bytes and path validation',async()=>{const b=new TextEncoder().encode('%PDF-1.4 test');await BUCKET.put('test-doc',b,{httpMetadata:{contentType:'application/pdf'}});const r=await BUCKET.get('test-doc');assert.equal(r.httpMetadata.contentType,'application/pdf');assert.deepEqual(r.body,b);await assert.rejects(()=>BUCKET.get('../secrets'));await BUCKET.delete('test-doc');assert.equal(await BUCKET.get('test-doc'),null);});
