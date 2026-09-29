import {build,version as esbuildVersion} from 'esbuild';
import {readFile,writeFile,mkdir,copyFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join,relative,dirname} from 'node:path';
import {tmpdir} from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const lock=JSON.parse(await readFile(join(root,'package-lock.json'),'utf8'));
if(esbuildVersion!==lock.packages['node_modules/esbuild'].version) throw Error('Installed esbuild does not match package-lock.json. Run npm ci before building.');
const check=process.argv.includes('--check');
const out=check?await mkdtemp(join(tmpdir(),'pdfstudio-build-')):join(root,'dist');
const hash=data=>createHash('sha256').update(data).digest('hex');
await mkdir(out,{recursive:true});
try {
 const result=await build({absWorkingDir:root,entryPoints:['renderer/cli.ts'],outfile:join(out,'renderer.mjs'),bundle:true,platform:'node',format:'esm',target:'node22',minify:false,metafile:true,legalComments:'inline',tsconfig:join(root,'tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},banner:{js:"import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);"},plugins:[{name:'forme-wasm',setup(b){b.onResolve({filter:/pkg-node\/forme\.js$/},()=>({path:'./forme.cjs',external:true}));}}]});
 await copyFile(join(root,'node_modules/@formepdf/core/pkg-node/forme.js'),join(out,'forme.cjs'));
 await copyFile(join(root,'node_modules/@formepdf/core/pkg-node/forme_bg.wasm'),join(out,'forme_bg.wasm'));
 const notices=[['Forme core, React adapter and shared model 0.25.0','@formepdf/core/pkg-node/LICENSE'],['React 19.2.5','react/LICENSE'],['parse5','parse5/LICENSE'],['entities','entities/LICENSE']];
 let text='Bundled renderer third-party notices\n\n';
 for(const [title,path] of notices) text+=title+'\n'+'='.repeat(title.length)+'\n'+await readFile(join(root,'node_modules',path),'utf8')+'\n\n';
 text+='Vendored pdfcn MIT notice: ../renderer/PDFCN-LICENSE\nBundled font notices: ../renderer/fonts/LICENSE\n';
 await writeFile(join(out,'THIRD-PARTY-NOTICES.txt'),text);
 const sourcePaths=Object.keys(result.metafile.inputs).filter(p=>!p.startsWith('node_modules/'));
 sourcePaths.push('scripts/build-renderer.mjs','package.json','package-lock.json','tsconfig.json');
 const sources={};for(const p of [...new Set(sourcePaths)].sort()) sources[p]=hash(await readFile(join(root,p)));
 const assets={};for(const name of ['renderer.mjs','forme.cjs','forme_bg.wasm','THIRD-PARTY-NOTICES.txt']) {const bytes=await readFile(join(out,name));assets[name]={bytes:bytes.length,sha256:hash(bytes)};}
 await writeFile(join(out,'manifest.json'),JSON.stringify({schema:1,builder:'esbuild',builderVersion:esbuildVersion,target:'node22',sources,assets},null,2)+'\n');
 if(check){for(const name of [...Object.keys(assets),'manifest.json']){if(!(await readFile(join(out,name))).equals(await readFile(join(root,'dist',name))))throw Error(`Bundled ${name} is stale. Run npm run build and commit dist/.`);}}
 console.log(check?'Bundled renderer matches source and lockfile.':'Built self-contained renderer in dist/.');
} finally {if(check)await rm(out,{recursive:true,force:true});}
