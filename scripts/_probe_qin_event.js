const XLSX = require('xlsx');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';
const wb = XLSX.readFile(path.join(dir, '事件数据.xlsx'));
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
console.log('=== 列名 ===');
console.log(Object.keys(rows[0]).map((k,i)=>`${i}:${k}`).join('\n'));
function col(r,...ks){for(const k of ks){const fk=Object.keys(r).find(kk=>String(kk).includes(k));if(fk&&r[fk]!=null&&String(r[fk])!=='')return r[fk];}return null;}
const qin = rows.filter(r=>String(col(r,'朝代')).includes('秦'));
console.log('\n=== 秦事件数:', qin.length, '===');
qin.forEach((r,i)=>{
  const keys = Object.keys(r);
  console.log(`\n[${i+1}] 事件名称="${r[Object.keys(r)[0]]}"`);
  keys.forEach(k=>{const v=r[k]; if(v!=null&&String(v)!=='') console.log(`    ${k} => ${String(v).slice(0,60)}`)});
});