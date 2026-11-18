"use strict";
const BUILTIN = [
  {
    "id": "round-1",
    "name": "الجولة الأولى",
    "words": [
      "فتح",
      "صندوق",
      "كرتون",
      "بيض",
      "عيون",
      "عسلية"
    ]
  },
  {
    "id": "round-2",
    "name": "الجولة الثانية",
    "words": [
      "مفتاح",
      "باب",
      "غرفة",
      "نوم",
      "عميق"
    ]
  },
  {
    "id": "round-3",
    "name": "الجولة الثالثة",
    "words": [
      "رأس",
      "مال",
      "عام",
      "دراسي",
      "جديد"
    ]
  },
  {
    "id": "round-4",
    "name": "الجولة الرابعة",
    "words": [
      "خط",
      "سير",
      "العمل",
      "الجماعي"
    ]
  },
  {
    "id": "round-5",
    "name": "الجولة الخامسة",
    "words": [
      "قلم",
      "حبر",
      "أزرق",
      "سماوي"
    ]
  },
  {
    "id": "round-6",
    "name": "الجولة السادسة",
    "words": [
      "صوت",
      "جرس",
      "المدرسة",
      "الابتدائية"
    ]
  },
  {
    "id": "round-7",
    "name": "الجولة السابعة",
    "words": [
      "حبة",
      "رمل",
      "ناعم"
    ]
  },
  {
    "id": "round-8",
    "name": "الجولة الثامنة",
    "words": [
      "جواز",
      "سفر",
      "طويل",
      "الأمد"
    ]
  }
];
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const icons = {
 board:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 14h6"/>',
 sliders:'<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
 screen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
 chain:'<path d="m8 15-1 1a3 3 0 0 1-4-4l5-5a3 3 0 0 1 5 1m3 1 1-1a3 3 0 1 1 4 4l-5 5a3 3 0 0 1-5-1m-3-2 7-6"/>',
 left:'<path d="M20 12H4m6-6-6 6 6 6"/>',reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
 trophy:'<path d="M7 3h10v6a5 5 0 0 1-10 0zm5 11v5m-4 2h8M7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>',x:'<path d="m6 6 12 12M18 6 6 18"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
 check:'<path d="m5 12 4 4L19 6"/>', bulb:'<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
 pencil:'<path d="m4 16 11-11 4 4L8 20l-5 1zm9-9 4 4"/>',trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 github:'<path d="M9 21v-3c-4 1-4-2-6-2m12 5v-3c0-1-.3-2-1-2 3 0 6-2 6-6 0-1-.5-3-1.5-4 .3-1 .3-2-.2-3-2 0-3 1-4 2a12 12 0 0 0-5 0C8 4 7 3 5 3c-.5 1-.5 2 0 3-1 1-2 3-2 4 0 4 3 6 7 6-1 0-1 1-1 2"/>',link:'<path d="M14 3h7v7m0-7L10 14m8-1v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
};
function icon(name){const template=document.createElement('template');template.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">'+icons[name]+'</svg>';return template.content.firstChild}
function el(tag,style,text){const node=document.createElement(tag);if(style)node.className=style;if(text!==undefined)node.textContent=text;return node}
function button(style,label,fn,glyph,iconOnly=false){const b=el('button',style);b.type='button';if(glyph)b.append(icon(glyph));if(iconOnly){b.title=label;b.setAttribute('aria-label',label)}else b.append(label);b.addEventListener('click',fn);return b}
function loadJSON(storage,key){try{return JSON.parse(storage.getItem(key))}catch{return null}}
function writeJSON(storage,key,value){try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function validate(bank){
 if(!Array.isArray(bank)||!bank.length||bank.length>120)throw Error('يجب أن يحتوي الملف على ١ إلى ١٢٠ جولة.');
 const ids=new Set();
 for(const r of bank){
  if(!r||typeof r.id!=='string'||!r.id.trim()||r.id.length>100||ids.has(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>55||!Array.isArray(r.words)||r.words.length<3||r.words.length>12||r.words.some(w=>typeof w!=='string'||!w.trim()||w.length>32))throw Error('صيغة الأسئلة غير صحيحة. تحتاج كل جولة إلى اسم و٣ إلى ١٢ كلمة.');
  ids.add(r.id);
 }
 return bank.map(({id,name,words})=>({id,name:name.trim(),words:words.map(w=>w.trim())}));
}
const DRAFT_KEY='kalimat-bank-v1';
function localDraft(){const d=loadJSON(localStorage,DRAFT_KEY);if(!d)return null;try{d.bank=validate(d.bank);return d}catch{return null}}
async function startingBank(){
 const draft=localDraft();if(draft)return draft.bank;
 if(location.protocol==='file:')return structuredClone(BUILTIN);
 const res=await fetch('questions.json',{cache:'no-store'});if(!res.ok)throw Error('تعذر تحميل ملف الأسئلة.');
 return validate(await res.json());
}
function repoPath(repo){
 if(!/^[a-z0-9][a-z0-9-]*\/[a-z0-9_.-]+$/i.test(repo)||repo.split('/').some(p=>p==='.'||p==='..'))throw Error('أدخل المستودع بصيغة owner/repository.');
 return 'https://api.github.com/repos/'+repo;
}
function contentsUrl(repo,branch){return repoPath(repo)+'/contents/questions.json'+(branch?'?ref='+encodeURIComponent(branch):'')}
function decodeBank(file){
 if(file.type!=='file'||file.encoding!=='base64'||typeof file.content!=='string')throw Error('تعذرت قراءة questions.json.');
 const bytes=Uint8Array.from(atob(file.content),c=>c.charCodeAt(0));return validate(JSON.parse(new TextDecoder().decode(bytes)));
}
document.querySelectorAll('[data-icon]').forEach(i=>i.replaceWith(icon(i.dataset.icon)));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
if(!document.fullscreenEnabled)$('screen').hidden=true;
$('screen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('screen').hidden=true}};
document.addEventListener('fullscreenchange',()=>{const label=document.fullscreenElement?'خروج من ملء الشاشة':'ملء الشاشة';$('screen').title=label;$('screen').setAttribute('aria-label',label)});

