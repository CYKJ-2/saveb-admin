// Validate catalog parity, interpolation and all migrated Vue templates without a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript'),{parse,compileScript,compileTemplate}=require('@vue/compiler-sfc'),{createI18n}=require('vue-i18n');
const root=path.resolve(__dirname,'..');
function load(file) {const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const ctx={exports:{}};vm.runInNewContext(code,ctx);return ctx.exports.default;}
const zh=load('src/lang/modules/zh-CN/pages.ts'),en=load('src/lang/modules/en-US/pages.ts');
assert.deepEqual(Object.keys(zh).sort(),Object.keys(en).sort());
const warnings=[];const i18n=createI18n({legacy:false,locale:'en-US',messages:{'en-US':{pages:en},'zh-CN':{pages:zh}},missing:(_locale,key)=>{throw Error('Missing key: '+key)}});
for(const key in zh) {
 assert.equal(typeof en[key],'string');assert.ok(!/[\u3400-\u9fff]/.test(en[key]),key);
 const params=s=>Array.from(s.matchAll(/\{(\w+)\}/g),m=>m[1]).sort();assert.deepEqual(params(zh[key]),params(en[key]),key);
 for(const locale of ['zh-CN','en-US']) {i18n.global.locale.value=locale;const result=i18n.global.t('pages.'+key,{p0:'100',p1:'200',p2:'300'});assert.ok(!result.includes('{p'),key);}
}
const allFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?allFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);
const targets=allFiles(path.join(root,'src/views')).filter(f=>f.endsWith('.vue')&&((f.includes('workbench'))||f.includes('dashboard'))&&!f.includes('data'));
let compiled=0;
for(const file of targets) {
 const source=fs.readFileSync(file,'utf8');if(!source.includes("t('pages."))continue;
 const {descriptor,errors}=parse(source,{filename:file});assert.equal(errors.length,0,file);
 const script=compileScript(descriptor,{id:'i18n-check'});
 const result=compileTemplate({source:descriptor.template.content,filename:file,id:'i18n-check',compilerOptions:{bindingMetadata:script.bindings}});
 assert.deepEqual(result.errors,[],file);
 for(const [,key]of source.matchAll(/t\('pages\.([^']+)'/g))assert.ok(key in zh,`${file}: ${key}`);
 // All user-visible Chinese should now live in the catalogs, not migrated SFCs.
 assert.ok(!/[\u3400-\u9fff]/.test(descriptor.template.content),file);
 compiled++;
}
console.log(`PASS: ${Object.keys(zh).length} bilingual messages, matching placeholders, ${compiled} compiled Vue components, no hardcoded Chinese templates.`);
