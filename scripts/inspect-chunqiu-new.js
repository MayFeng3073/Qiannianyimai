const path = require('path');
const XLSX = require('xlsx');
const dir = 'D:\\SHUMEI\\GraduationProject';
function read(fn) {
  const wb = XLSX.readFile(path.join(dir, fn));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}
function col(r, ...ks) {
  for (const k of ks) {
    const fk = Object.keys(r).find(kk => String(kk).includes(k));
    if (fk && r[fk] != null && String(r[fk]) !== '') return r[fk];
  }
  return null;
}

// 人事关系表：只看春秋事件相关的，统计角色取值分布
const pev = read('人事关系表.xlsx');
const ev = read('事件数据.xlsx').filter(r => String(col(r,'朝代')).includes('春秋'));
const evNames = new Set(ev.map(r => String(col(r,'事件名称'))));
const pevSpring = pev.filter(r => evNames.has(String(col(r,'事件'))));
const roleCount = {};
pevSpring.forEach(r => { const v = String(col(r,'人事关系类型')); roleCount[v] = (roleCount[v]||0)+1; });
console.log('=== 人事关系表 春秋相关行数:', pevSpring.length);
console.log('角色取值分布:', JSON.stringify(roleCount, null, 1));
console.log('sample:', JSON.stringify(pevSpring[0]));

// 人物关系表 headers + 关系类型分布
const rel = read('人物关系表.xlsx');
const relType = {};
rel.forEach(r => { const t = String(col(r,'关系类型')); relType[t]=(relType[t]||0)+1; });
console.log('\n=== 人物关系表 关系类型分布:', JSON.stringify(relType, null, 1));
console.log('人物关系表 SAMPLE:', JSON.stringify(rel[0], null, 1));

// 2级人物数据 一段完整
const l2 = read('2级人物数据.xlsx');
const l2Spring = l2.filter(r => String(col(r,'朝代')).includes('春秋'));
console.log('\n=== 2级人物 春秋数:', l2Spring.length, ' 总数:', l2.length);
console.log('2级 SAMPLE:', JSON.stringify(l2Spring[1], null, 1));
console.log('2级 HEADERS:', Object.keys(l2[0]||{}));
// 是否有无 故事标题/故事内容 的行？
const noStory = l2Spring.filter(r => !col(r,'故事内容'));
console.log('无故事内容数:', noStory.length, ' 无故事标题数:', l2Spring.filter(r=>!col(r,'故事标题')).length);