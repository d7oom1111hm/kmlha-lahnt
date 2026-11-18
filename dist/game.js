"use strict";
let bank = [], current = 0, reveals = [], scores = [0,0], selected = 0;
const identifier = 'kalimat-match-v1';
const query = new URLSearchParams(location.search);
const segmenter = new Intl.Segmenter('ar', {granularity:'grapheme'});
const letters = word => Array.from(segmenter.segment(word), x => x.segment);
const normalize = word => word.normalize('NFKC').replace(/[\u064B-\u065F\u0670ـ\s]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').trim();
function initialReveals(round,saved){
 return round.words.map((word,i)=>{
  const prior=saved?.[i];
  return letters(word).map((char,pos)=>{
   if(i===0 || i===round.words.length-1 || !char.trim())return true;
   // Earlier matches stored the length of the visible prefix.
   return Number.isInteger(prior) ? pos<prior : prior?.[pos]===true;
  });
 });
}
function persist(){
 writeJSON(sessionStorage,identifier,{signature:JSON.stringify(bank),current,reveals,scores});
}
function begin(resume){
 current=0; scores=[0,0];
 const saved=resume && loadJSON(sessionStorage,identifier);
 const sameMatch=saved && saved.signature===JSON.stringify(bank);
 reveals=bank.map((round,i)=>initialReveals(round,sameMatch?saved.reveals?.[i]:null));
 if(sameMatch && Number.isInteger(saved.current) && bank[saved.current])current=saved.current;
 if(sameMatch && Array.isArray(saved.scores)&&saved.scores.length===2&&saved.scores.every(Number.isInteger)){
  scores=saved.scores;
 }
 render();persist();
}
function go(index){current=index;render();persist()}
function showWord(index){
 reveals[current][index].fill(true);
 render();persist();
}
function pickLetter(index){
 const positions=$('letter-positions');
 const revealed=reveals[current][index];
 const choices=[];
 letters(bank[current].words[index]).forEach((char,pos)=>{
  if(!char.trim())return;
  const number=(choices.length+1).toLocaleString('ar-EG');
  const choice=button('letter-position',number,()=>{
   revealed[pos]=true;
   $('letter-picker').close();
   render();persist();
   const row=$('chain').children[index];
   (row.querySelector('.hint-btn') || $('next')).focus({preventScroll:true});
  });
  choice.setAttribute('aria-label','الحرف '+number+(revealed[pos]?'، مكشوف '+char:''));
  if(revealed[pos]){choice.disabled=true;choice.append(el('small','',char))}
  choices.push(choice);
 });
 positions.replaceChildren(...choices);
 $('letter-picker').showModal();
 positions.querySelector('button:not(:disabled)')?.focus();
}
function guess(index){
 selected=index;$('guess-title').textContent='تخمين الكلمة '+(index+1);$('answer').value='';$('feedback').textContent='';
 $('guess').showModal();$('answer').focus();
}
function wordRow(word,index){
 const chars=letters(word), revealed=reveals[current][index], shown=revealed.every(Boolean);
 const row=el('li','word-row'+(shown?' shown':''));
 row.append(el('span','number',pad(index+1)));
 if(shown){
  const known=el('span','known');known.append(icon('check'),index===0?'أول كلمة':index===bank[current].words.length-1?'آخر كلمة':'مكشوفة');
  row.append(el('strong','word',word),known);return row;
 }
 const attempt=button('word','',()=>guess(index));
 attempt.setAttribute('aria-label','تخمين الكلمة '+(index+1));
 const mask=el('span','mask');
 if(chars.some((c,pos)=>c.trim() && revealed[pos])){
  chars.forEach((c,pos)=>mask.append(revealed[pos]?el('b','',c):el('span','','؟')));
  attempt.setAttribute('aria-label',attempt.getAttribute('aria-label')+'، '+Array.from(mask.children,c=>c.textContent).join(' '));
 }else{
  for(let i=0;i<8;i++)mask.append(el('span','','؟'));
 }
 attempt.append(mask);
 const controls=el('div','word-actions');
 const hint=button('hint-btn','كشف حرف',()=>pickLetter(index),'bulb');
 hint.setAttribute('aria-haspopup','dialog');
 hint.setAttribute('aria-label','كشف حرف من الكلمة '+(index+1));
 controls.append(hint,button('eye-btn','كشف الكلمة '+(index+1),()=>showWord(index),'eye',true));
 row.append(attempt,controls);return row;
}
function renderScores(){
 const teams=$('teams');teams.replaceChildren();
 ['الفريق الأزرق','الفريق الذهبي'].forEach((name,i)=>{
  const team=el('div','team'+(i?' second':''));
  const label=el('span','team-label');label.append(el('i'),name);
  const score=el('strong','score',pad(scores[i]));score.setAttribute('aria-live','polite');
  const controls=el('div','score-controls');
  for(const [delta,action,glyph] of [[1,'إضافة نقطة','plus'],[-1,'خصم نقطة','minus']]){
   const b=button('',action+' — '+name,()=>{scores[i]=Math.max(0,scores[i]+delta);renderScores();persist()},glyph,true);
   b.disabled=delta<0 && scores[i]===0;controls.append(b);
  }
  team.append(label,score,controls);teams.append(team);
 });
}
function render(){
 const round=bank[current];
 $('round-title').textContent=round.name;
 $('range').textContent='من «'+round.words[0]+'» إلى «'+round.words.at(-1)+'»';
 $('round-id').textContent=pad(current+1)+' / '+pad(bank.length);
 $('chain').replaceChildren(...round.words.map(wordRow));
 $('rounds').replaceChildren(...bank.map((r,i)=>{
  const complete=reveals[i].every(word=>word.every(Boolean));
  const b=button(complete?'complete':'',pad(i+1),()=>go(i));
  b.title=r.name;b.setAttribute('aria-label',r.name);if(i===current)b.setAttribute('aria-current','step');return b;
 }));
 $('next').replaceChildren(current===bank.length-1?'عرض النتيجة':'الجولة التالية',icon('left'));
 renderScores();
}
$('rules').onclick=()=>$('guide').showModal();
$('guess-form').onsubmit=e=>{
 e.preventDefault();
 if(normalize($('answer').value)===normalize(bank[current].words[selected])){
  $('guess').close();showWord(selected);
 }else{$('feedback').textContent='جرّب كلمة ثانية.';$('answer').select()}
};
$('reset').onclick=()=>$('confirm').showModal();
$('do-reset').onclick=()=>{reveals[current]=initialReveals(bank[current]);$('confirm').close();render();persist()};
$('next').onclick=()=>{
 if(current<bank.length-1){go(current+1);return}
 $('result-scores').textContent='الفريق الأزرق '+scores[0]+'  ·  الفريق الذهبي '+scores[1];$('result').showModal();
};
$('restart').onclick=()=>{$('result').close();begin(false)};
async function start(){
 try{
  if(query.has('repo')){
   const url=contentsUrl(query.get('repo'),query.get('branch')||'');
   const res=await fetch(url,{cache:'no-store',credentials:'omit'});
   if(!res.ok)throw Error('تعذّر تحميل أسئلة المستودع. تحقق من الرابط وأن المستودع عام.');
   bank=decodeBank(await res.json());
  }else bank=await startingBank();
  begin(true);
 }catch(error){
  $('notice').textContent=error.message;$('notice').hidden=false;document.querySelector('.layout').hidden=true;
  $('notice').append(' ',button('quiet','إعادة المحاولة',()=>location.reload()));
 }
}
start();

