'use strict';
const fold=text=>text.toLocaleLowerCase('ru').replaceAll('ё','е');
const field=document.getElementById('find-file');
const groups=[...document.querySelectorAll('details')].map(box=>({
  box,title:fold(box.querySelector('summary').textContent),
  entries:[...box.querySelectorAll('p')].map(row=>[row,fold(row.querySelector('a').textContent)])
}));
let timer;
function update(){
  const terms=fold(field.value.trim()).split(/\s+/).filter(Boolean);
  let count=0;
  for(const {box,title,entries} of groups){
    let shown=0;
    for(const [row,name] of entries){
      row.hidden=!terms.every(t=>title.includes(t)||name.includes(t));
      if(!row.hidden)shown++;
    }
    box.hidden=shown===0;
    box.open=!!terms.length && shown>0;
    count+=shown;
  }
  document.getElementById('file-status').textContent=terms.length?'Совпадений: '+count.toLocaleString('ru-RU'):'';
}
field.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,100);});
if(field.value.trim())update();
function deepLink(){
  const match=location.hash.match(/^#topic-\d+$/);
  if(match){const box=document.getElementById(match[0].slice(1));if(box){box.open=true;box.scrollIntoView();}}
}
deepLink();window.addEventListener('hashchange',deepLink);
