'use strict';
const main=document.getElementById('main');
const number=n=>n.toLocaleString('ru-RU');
const normalized=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
let catalog, topics, revision=0, searchText='', filter='', groupCache=new Map();
function el(tag,txt='',cls=''){
  const node=document.createElement(tag);
  if(txt)node.textContent=txt;
  if(cls)node.className=cls;
  return node;
}
function link(txt,url,cls=''){
  const a=el('a',txt,cls);a.href=url;return a;
}
async function checked(url){
  const r=await fetch(url);if(!r.ok)throw Error(String(r.status));return r;
}
function listPage(){
  document.title='Технический форум Kyron Clan — архив';
  main.replaceChildren(el('h1','Технический форум'),el('p',number(topics.size)+' тем · '+number(catalog.topics.reduce((n,t)=>n+t[4],0))+' сообщений','meta'));
  const controls=el('div','','controls'),query=el('input'),forum=el('select'),out=el('div');
  query.type='search';query.placeholder='Например, раздатка или D20DT';query.value=searchText;
  forum.append(new Option('Все разделы',''));
  const names=Object.entries(catalog.forums).sort((a,b)=>a[1].localeCompare(b[1],'ru'));
  const parents=new Set(catalog.topics.map(t=>String(t[2])));
  for(const [id,title] of names)if(parents.has(id))forum.append(new Option(title,id));
  forum.value=filter;
  for(const [title,node] of [['Поиск по названию темы',query],['Раздел',forum]]){
    const label=el('label',title);label.append(node);controls.append(label);
  }
  main.append(controls,out);
  function update(){
    searchText=query.value;filter=forum.value;const q=normalized(searchText.trim());out.replaceChildren();
    for(const [id,title] of names){
      if(filter && filter!==id)continue;
      const rows=catalog.topics.filter(t=>String(t[2])===id && (!q||normalized(t[1]).includes(q)));
      if(!rows.length)continue;
      const box=el('details','','section'),head=el('summary',title+' '),ul=el('ul','','topics');
      head.append(el('span',' · '+number(rows.length)));box.append(head,ul);
      function fill(){
        if(ul.childElementCount)return;
        for(const t of rows){
          const li=el('li');li.append(link(t[1],'#t/'+t[0]+'/1'),el('span',number(t[4])+' сообщ.','meta'));ul.append(li);
        }
      }
      box.ontoggle=()=>{if(box.open)fill();};
      if(q||filter){box.open=true;fill();}out.append(box);
    }
    if(!out.childElementCount)out.append(el('p','Тем с таким названием не найдено.'));
  }
  query.oninput=update;forum.onchange=update;update();
}
function nav(t,page){
  const bar=el('div','','nav');
  if(page>1)bar.append(link('← Назад','#t/'+t[0]+'/'+(page-1)));
  if(t[3]>1){
    const n=el('input'),btn=el('button','Перейти');n.type='number';n.min='1';n.max=String(t[3]);n.value=String(page);n.setAttribute('aria-label','Номер страницы');
    const go=()=>{if(n.reportValidity()&&Number.isInteger(Number(n.value)))location.hash='t/'+t[0]+'/'+n.value;};
    btn.onclick=go;n.onkeydown=e=>{if(e.key==='Enter')go();};bar.append(n,el('span','из '+number(t[3]),'meta'),btn);
  }
  if(page<t[3])bar.append(link('Дальше →','#t/'+t[0]+'/'+(page+1)));
  return bar;
}
async function route(){
  const current=++revision;
  try{
    if(!catalog){catalog=await (await checked('catalog.json')).json();topics=new Map(catalog.topics.map(t=>[t[0],t]));}
    if(current!==revision)return;
    const match=location.hash.match(/^#t\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/);
    if(!match){listPage();return;}
    const t=topics.get(Number(match[1]));if(!t)throw Error();
    const page=Math.max(1,Math.min(t[3],Number(match[2]||1))),key=t[0]+'-'+Math.floor((page-1)/10);
    main.replaceChildren(el('p','Открываем тему…'));
    if(!groupCache.has(key)){
      const r=await checked('t/'+key+'.bin'),stream=r.body.pipeThrough(new DecompressionStream('gzip'));
      if(groupCache.size>=6)groupCache.clear();groupCache.set(key,await new Response(stream).json());
    }
    if(current!==revision)return;
    const posts=groupCache.get(key)[page];if(!posts)throw Error();
    document.title=t[1]+' — Kyron Clan';
    const crumb=el('p','','crumb'),back=link(catalog.forums[t[2]]||'Каталог','#/');
    back.onclick=()=>{searchText='';filter=String(t[2]);};
    crumb.append(link('Все разделы','#/'),document.createTextNode(' / '),back);
    main.replaceChildren(crumb,el('h1',t[1]),link('Тема на исходном форуме',t[5],'meta'),nav(t,page));
    for(const [id,user,date,html] of posts){
      const article=el('article'),head=el('div','','byline'),content=el('div','','post');article.id='p'+id;
      head.append(el('strong',user||'Участник форума'));
      if(date){const d=new Date(date);head.append(el('span',Number.isFinite(+d)?d.toLocaleDateString('ru-RU',{dateStyle:'long',timeZone:'Europe/Moscow'}):date,'meta'));}
      head.append(link('#'+id,'#t/'+t[0]+'/'+page+'/'+id,'meta'));content.innerHTML=html;
      article.append(head,content);main.append(article);
    }
    if(!posts.length)main.append(el('p','В сохранённой версии этой страницы текст сообщений отсутствует.'));
    main.append(nav(t,page));if(match[3])document.getElementById('p'+match[3])?.scrollIntoView();else window.scrollTo(0,0);
  }catch(e){if(current===revision)main.replaceChildren(el('h1','Не удалось открыть страницу'),el('p','Обновите страницу или вернитесь в каталог.'),link('Открыть каталог','#/'));}
}
window.addEventListener('hashchange',route);route();
