// Real local Git repositories exercise release safety without contacting GitHub.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script=resolve('scripts/push-main.mjs');
let folder,repo,remote,env;
function git(...args){const result=spawnSync('git',args,{cwd:repo,encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);return result.stdout.trim();}
function gates(){writeFileSync(join(repo,'release-gates.json'),JSON.stringify({gates:['bookingReplay','schemaValidation','stylistProfileUpdates','providerWorkflows','browserCompatibility'].map(id=>({id,status:'passed',evidence:'Verified in isolated release testing'}))}));}
function commit(){git('add','.');git('commit','-qm','candidate');}
function run(...args){return spawnSync(process.execPath,[script,...args],{cwd:repo,env,encoding:'utf8'});}
beforeEach(()=>{
 folder=mkdtempSync(join(tmpdir(),'rapidstyler-release-'));repo=join(folder,'repo');remote=join(folder,'remote.git');mkdirSync(repo);git('init','-q','-b','main');git('config','user.name','Release test');git('config','user.email','release@example.test');writeFileSync(join(repo,'README.md'),'base');commit();git('init','--bare','-q',remote);git('remote','add','origin',remote);git('push','-q','origin','main');git('switch','-qc','dev');gates();commit();
 const bin=join(folder,'bin');mkdirSync(bin);for(const command of ['npm','npx'])writeFileSync(join(bin,command),'#!/bin/sh\nexit "${RELEASE_TEST_EXIT:-0}"\n',{mode:0o755});mkdirSync(join(repo,'scripts'));writeFileSync(join(repo,'scripts','verify-build-chunks.js'),'process.exit(0);');commit();env={...process.env,PATH:`${bin}:${process.env.PATH}`};
});
afterEach(()=>rmSync(folder,{recursive:true,force:true}));
it('check mode runs checks without publishing or switching branches',()=>{const before=git('ls-remote','origin','refs/heads/main');const result=run();expect(result.status,result.stderr).toBe(0);expect(git('ls-remote','origin','refs/heads/main')).toBe(before);expect(git('branch','--show-current')).toBe('dev');});
it('refuses uncommitted work',()=>{writeFileSync(join(repo,'README.md'),'dirty');const result=run('--push');expect(result.status).not.toBe(0);expect(result.stderr).toMatch(/clean|commit/i);});
it('refuses pending release gates',()=>{writeFileSync(join(repo,'release-gates.json'),JSON.stringify({gates:[]}));commit();const result=run('--push');expect(result.status).not.toBe(0);expect(result.stderr).toContain('Unresolved release gates');});
it('failed verification cannot publish main',()=>{const before=git('ls-remote','origin','refs/heads/main');env.RELEASE_TEST_EXIT='1';expect(run('--push').status).not.toBe(0);expect(git('ls-remote','origin','refs/heads/main')).toBe(before);});
it('publishes the verified dev commit to both branches without switching',()=>{const candidate=git('rev-parse','HEAD');const result=run('--push');expect(result.status,result.stderr).toBe(0);expect(git('ls-remote','origin','refs/heads/main')).toContain(candidate);expect(git('ls-remote','origin','refs/heads/dev')).toContain(candidate);expect(git('branch','--show-current')).toBe('dev');});
it('refuses main divergence instead of overwriting it',()=>{git('switch','-q','main');writeFileSync(join(repo,'other.txt'),'remote change');commit();git('push','-q','origin','main');git('switch','-q','dev');const before=git('ls-remote','origin','refs/heads/main');expect(run('--push').status).not.toBe(0);expect(git('ls-remote','origin','refs/heads/main')).toBe(before);});

it('refuses execution from main',()=>{git('switch','-q','main');const result=run('--push');expect(result.status).not.toBe(0);expect(result.stderr).toContain('Switch to dev');});
it('strict chunk validation failure prevents publication',()=>{
 delete env.BUILD_VERIFY_REQUIRE_PRESENT;
 writeFileSync(join(repo,'scripts','verify-build-chunks.js'),'process.exit(process.env.BUILD_VERIFY_REQUIRE_PRESENT === "1" ? 1 : 0);');commit();
 const before=git('ls-remote','origin','refs/heads/main');const result=run('--push');
 expect(result.status).not.toBe(0);expect(git('ls-remote','origin','refs/heads/main')).toBe(before);
});
