// 查看战国事件数据（名称/时间/类型/5维背景是否齐全）
const XLSX = require('xlsx');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';
function read(fn){const wb=XLSX.readFile(path.join(dir,fn));return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);}
function col(r,...ks){for(const k of ks){const fk=Object.keys(r).find(kk=>String(kk).includes(k));if(fk&&r[fk]!=null&&String(r[fk]).trim()!=='')return r[fk];}return null;}
const ev = read('事件数据.xlsx').filter(r=>String(col(r,'朝代')).includes('战国'));
console.log('战国事件共', ev.length, '个:');
ev.forEach((r,i)=>{
  const bg = ['政治背景','经济背景','社会背景','文化背景','地理背景'].filter(k=>col(r,k)).length;
  console.log(`  ${String(i+1).padStart(2)}. ${col(r,'事件名称')} | 时间=${col(r,'发生时间')} | 类型=${col(r,'类型')} | 背景维度=${bg}/5`);
});