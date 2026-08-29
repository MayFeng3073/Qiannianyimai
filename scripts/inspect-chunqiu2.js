// 探查春秋详细数据：列出春秋的一级人物、事件、以及关联的人物/事件名
const XLSX = require('xlsx');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';

function read(fn) {
  const wb = XLSX.readFile(path.join(dir, fn));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

// 1. 春秋一级人物
const l1 = read('1级人物数据.xlsx').filter(r => String(r['朝代']).includes('春秋'));
console.log('===== 春秋一级人物 (' + l1.length + ') =====');
l1.forEach(r => console.log(r['PersonID'], r['姓名'], '|', r['人物类型'], '|', r['生年'], '-', r['卒年']));

// 2. 春秋事件（含春秋战国之际）
const ev = read('事件数据.xlsx').filter(r => String(r['朝代']).includes('春秋'));
console.log('\n===== 春秋事件 (' + ev.length + ') =====');
ev.forEach(r => console.log(r['EventID'], r['事件名称'], '|', r['朝代'], '|', r['类型']));

// 3. 二级人物全表
const l2 = read('2级人物数据.xlsx');
console.log('\n===== 二级人物全表 (' + l2.length + ') =====');
l2.forEach(r => console.log(r['SupportPersonID'], r['姓名']));

// 4. 涉及春秋一级人物名的关系 & 人事
const names = new Set(l1.map(r => r['姓名']));
const rel = read('人物关系表.xlsx');
const relSel = rel.filter(r => names.has(r['起点人物']) || names.has(r['终点人物']));
console.log('\n===== 涉及春秋一级人物的人物关系 (' + relSel.length + ') =====');
relSel.forEach(r => console.log(r['RelationID'], r['起点人物'], '→', r['终点人物'], '|', r['关系类型（亲属 、 君臣 、 盟友 、 敌对 、 师生 、 继承）']));

const pev = read('人事关系表.xlsx');
const evNames = new Set(ev.map(r => r['事件名称']));
const peSel = pev.filter(r => evNames.has(r['事件']) || names.has(r['人物']));
console.log('\n===== 涉及春秋事件或人物的 人事关系 (' + peSel.length + ') =====');
peSel.forEach(r => console.log(r['RelationID'], r['事件'], '←', r['人物'], '|', r['人事关系类型']));

// 5. 春秋热力图
const kw = read('朝代热力图.xlsx').filter(r => r['朝代'] === '春秋');
console.log('\n===== 春秋热力图 (' + kw.length + ') =====');
kw.forEach(r => console.log(r['关键词'], '|', r['类别'], '|', r['权重（100）']));