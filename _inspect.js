const fs=require('fs'); const d=JSON.parse(fs.readFileSync('./frontend/public/data/dynasty_202.json','utf-8'));
const l2=d.persons.filter(p=>p.level===2);
l2.forEach(p=>{
  const c=(p.story&&p.story.content||'');
  const first=c.split(/[。！？]/)[0]||'';
  console.log(`${p.name}\t«${p.story?.title||''}»\t| ${first.slice(0,40)}`);
});