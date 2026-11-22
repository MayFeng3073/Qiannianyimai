// 临时排查：战国人物名单 + 警告中缺失的人到底在不在表里（看是否换了叫法）
const XLSX = require('xlsx');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';
function read(fn){const wb=XLSX.readFile(path.join(dir,fn));return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);}
function col(r,...ks){for(const k of ks){const fk=Object.keys(r).find(kk=>String(kk).includes(k));if(fk&&r[fk]!=null&&String(r[fk]).trim()!=='')return r[fk];}return null;}

const l1 = read('1级人物数据.xlsx').filter(r=>String(col(r,'朝代')).includes('战国'));
const l2 = read('2级人物数据.xlsx').filter(r=>String(col(r,'朝代')).includes('战国'));
const names = new Set([...l1,...l2].map(r=>String(col(r,'姓名'))));

console.log('== 一级人物('+l1.length+') ==');
l1.forEach(r=>console.log('  L1', col(r,'姓名')));
console.log('== 二级人物('+l2.length+') ==');
l2.forEach(r=>console.log('  L2', col(r,'姓名')));

const missing = ['嫪毐','鬼谷子','公输般','禽滑厘','梁惠王','姚贾','燕惠王','滕文公','田光','齐桓侯','秦武王','魏安釐王','赵太后','楚考烈王','李园','韩昭侯','陈嚣','子游','子夏','子张','苏辟','秦太医令','鲁哀公','楚庄王','秦始皇','孔子'];
console.log('\n== 缺失人员核查 ==');
for(const n of missing){
  // 尝试在全部人物表里模糊找（含跨朝代）
  const all = read('1级人物数据.xlsx').concat(read('2级人物数据.xlsx'));
  const hit = all.filter(r=>String(col(r,'姓名')||'').includes(n));
  console.log(`  ${n}: 战国表${names.has(n)?'有':'无'} | 全表${hit.length? '→'+hit.map(r=>col(r,'姓名')+'@'+col(r,'朝代')).join(','):'也没有'}`);
}
// 一级人物时间轴列名确认
console.log('\n== 一级战国行 列名样例 ==');
const keys = Object.keys(l1[0]||{});
console.log(keys.join(' | '));
console.log('\n== 二级战国行 列名样例 ==');
const k2 = Object.keys(l2[0]||{});
console.log(k2.join(' | '));