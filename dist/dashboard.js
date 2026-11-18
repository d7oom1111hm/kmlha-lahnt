"use strict";
let bank=[], editing=null, removing=null, connection=null, base=null, dirty=false, busy=false;
const prefsKey='kalimat-repository-v1';
const status=message=>{$('git-status').textContent=message};
function remember(){
 const saved=writeJSON(localStorage,DRAFT_KEY,{bank,base,dirty});
 $('bank-status').textContent=saved?(dirty?'محفوظ على هذا الجهاز. التغييرات بانتظار الحفظ في GitHub.':''):'تعذر الحفظ على هذا الجهاز. احتفظ بالصفحة مفتوحة.';
}
function draw(){
 $('bank').replaceChildren(...bank.map((r,index)=>{
  const row=el('div','bank-row'), info=el('div','bank-info');
  info.append(el('strong','',r.name),el('small','',r.words.join(' ← ')));
  const edit=button('icon-btn','تعديل '+r.name,()=>openEditor(index),'pencil',true);
  const remove=button('icon-btn','حذف '+r.name,()=>{
   removing=index;$('remove-name').textContent=r.name;$('delete-dialog').showModal();
  },'trash',true);
  edit.disabled=busy;remove.disabled=busy||bank.length===1;
  row.append(el('span','number',pad(index+1)),info,edit,remove);return row;
 }));
 $('add').disabled=busy||bank.length>=120;
 $('link-btn').disabled=busy;$('publish').disabled=busy||(!dirty&&!!connection?.sha);$('disconnect').disabled=busy;
 $('connect-form').hidden=!!connection;$('connected').hidden=!connection;
}
function openEditor(index){
 editing=index;const round=bank[index];
 $('edit-title').textContent=round?'تعديل الجولة':'جولة جديدة';
 $('round-name').value=round?.name||'الجولة '+(bank.length+1);$('words').value=round?.words.join('\n')||'';
 $('edit-error').textContent='';$('edit-dialog').showModal();$('round-name').focus();
}
function changed(){dirty=true;remember();draw()}
$('add').onclick=()=>openEditor(null);
$('edit-form').onsubmit=e=>{
 e.preventDefault();const words=$('words').value.split(/\r?\n/).map(w=>w.trim()).filter(Boolean);
 const round={id:bank[editing]?.id||crypto.randomUUID(),name:$('round-name').value.trim(),words};
 try{validate([round])}catch{$('edit-error').textContent='أدخل اسم الجولة و٣ إلى ١٢ كلمة، بحد أقصى ٣٢ حرفًا في السطر.';return}
 if(editing===null)bank.push(round);else bank[editing]=round;
 $('edit-dialog').close();changed();
};
$('delete-ok').onclick=()=>{if(removing!==null&&bank.length>1)bank.splice(removing,1);removing=null;$('delete-dialog').close();changed()};
function repoError(code){
 if(code===401)return 'التوكن غير صالح أو انتهت صلاحيته.';
 if(code===403)return 'رفض GitHub الطلب. تحقق من صلاحية المحتوى وحدّ الطلبات.';
 if(code===404)return 'تعذّر الوصول إلى المستودع أو الفرع. تحقق من الاسم وصلاحية التوكن.';
 if(code===409||code===422)return 'تعذّر الحفظ. قد تكون نسخة المستودع تغيّرت أو الفرع محميًا. نسختك المحلية محفوظة. افصل الاتصال وأعد الربط لمراجعة النسخة الحالية.';
 return 'تعذّر تنفيذ الطلب في GitHub ('+code+').';
}
async function github(url,token,options={}){
 const response=await fetch(url,{...options,cache:'no-store',redirect:'error',credentials:'omit',headers:{
  Accept:'application/vnd.github+json',Authorization:'Bearer '+token,...(options.body?{'Content-Type':'application/json'}:{})
 }});
 if(!response.ok){const err=new Error(repoError(response.status));err.status=response.status;throw err}
 return response.json();
}
const sameBase=(a,b)=>a&&a.repo.toLowerCase()===b.repo.toLowerCase()&&a.branch===b.branch&&a.sha===b.sha;
function confirmReplace(){
 const d=$('replace-dialog');d.returnValue='';d.showModal();
 return new Promise(resolve=>d.addEventListener('close',()=>resolve(d.returnValue==='load'),{once:true}));
}
$('replace-ok').onclick=()=>$('replace-dialog').close('load');
function playerLink(c){
 const u=new URL('index.html',location.href);u.searchParams.set('repo',c.repo);u.searchParams.set('branch',c.branch);return u.href;
}
function updateLink(){
 const canShare=connection&&!connection.private&&!!connection.sha;
 $('share').hidden=!canShare||location.protocol==='file:';
 if(canShare)$('share').href=playerLink(connection);
}
$('connect-form').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;draw();status('جارٍ الاتصال…');
 const token=$('token').value.trim();$('token').value='';
 try{
  const repo=$('repo').value.trim().replace(/^https:\/\/github\.com\//i,'').replace(/\/$/,'').replace(/\.git$/,'');
  const api=repoPath(repo), metadata=await github(api,token);
  const branch=$('branch').value.trim()||metadata.default_branch;
  await github(api+'/branches/'+encodeURIComponent(branch),token);
  let file;
  try{file=await github(contentsUrl(repo,branch),token)}catch(err){if(err.status!==404)throw err}
  const remote=file?decodeBank(file):null;
  const nextBase={repo,branch,sha:file?.sha||null};
  const keep=dirty&&sameBase(base,nextBase);
  if(remote&&!keep&&dirty&&JSON.stringify(remote)!==JSON.stringify(bank)&&!await confirmReplace()){status('أُلغي الاتصال.');return}
  if(remote&&!keep){bank=remote;dirty=false}
  if(!remote)dirty=true;
  connection={...nextBase,token,private:metadata.private};base=nextBase;
  writeJSON(localStorage,prefsKey,{repo,branch});remember();
  $('repo-name').textContent=repo+' · '+branch;
  updateLink();status(remote?'تم الاتصال.':'تم الاتصال. احفظ لإنشاء ملف الأسئلة.');
 }catch(err){status(err instanceof TypeError?'تعذر الاتصال بـ GitHub. تحقق من الشبكة.':err.message)}
 finally{busy=false;draw()}
};
$('publish').onclick=async()=>{
 if(busy||!connection)return;busy=true;draw();status('جارٍ الحفظ…');
 try{
  const c=connection;
  const bytes=new TextEncoder().encode(JSON.stringify(validate(bank),null,2)+'\n');
  const content=btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
  const body={message:'تحديث جولات الكلمات',branch:c.branch,content};
  if(c.sha)body.sha=c.sha;
  const result=await github(contentsUrl(c.repo),c.token,{method:'PUT',body:JSON.stringify(body)});
  c.sha=result.content.sha;base={repo:c.repo,branch:c.branch,sha:c.sha};dirty=false;remember();updateLink();
  status(c.private?'حُفظت الأسئلة في المستودع الخاص.':'حُفظت الأسئلة في GitHub.');
 }catch(err){status(err instanceof TypeError?'تعذر الاتصال. التغييرات ما زالت على هذا الجهاز.':err.message)}
 finally{busy=false;draw()}
};
$('disconnect').onclick=()=>{connection=null;$('share').hidden=true;$('share').removeAttribute('href');$('token').value='';draw();status('تم فصل الاتصال.')};
async function init(){
 const prefs=loadJSON(localStorage,prefsKey);$('repo').value=prefs?.repo||'';$('branch').value=prefs?.branch||'';
 try{
  bank=await startingBank();const draft=localDraft();dirty=!!draft?.dirty;base=draft?.base||null;
  if(dirty)$('bank-status').textContent='تغييرات محلية بانتظار الحفظ في GitHub.';
  draw();
 }catch(err){$('bank-status').textContent=err.message;$('add').disabled=true;$('link-btn').disabled=true}
}
init();

