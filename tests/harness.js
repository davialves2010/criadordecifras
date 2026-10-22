/* Carrega os arquivos de js/ num contexto isolado, com um "navegador de mentira" (document/$ viram proxies).
   load(files, extra): "extra" acrescenta variáveis globais ao contexto. Cada load tem seu próprio localStorage. */
const vm=require("vm"),fs=require("fs"),path=require("path");
const deep=()=>{const p=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>"":k==="length"?0:p,apply:()=>p,construct:()=>p,set:()=>true});return p};
function load(files,extra){
 const m={},store={getItem:k=>k in m?m[k]:null,setItem(k,v){m[k]=String(v)},removeItem(k){delete m[k]}};
 const ctx={document:deep(),window:{},navigator:{},localStorage:store,sessionStorage:store,addEventListener(){},matchMedia:()=>({matches:false}),
  ResizeObserver:function(){return{observe(){}}},requestAnimationFrame(){},setTimeout,clearTimeout,setInterval(){},clearInterval(){},console,
  location:{search:"",origin:"",pathname:"/",protocol:"http:"},history:{},URL,Blob,innerWidth:1000,innerHeight:800,...(extra||{})};
 vm.createContext(ctx);
 for(const f of files)vm.runInContext(fs.readFileSync(path.join(__dirname,"..","js",f),"utf8"),ctx,{filename:f});
 return{run:c=>vm.runInContext(c,ctx),json:c=>JSON.parse(vm.runInContext("JSON.stringify("+c+")",ctx)),ctx};
}
module.exports={load};
