const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dir = 'd:/SHUMEI/GraduationProject';

function read(fn) {
  const wb = XLSX.readFile(path.join(dir, fn));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

// 1. 人事关系表全部行
console.log('===== 人事关系表全部 (' + read('人事关系表.xlsx').length + ') =====');
read('人事关系表.xlsx').forEach(r => console.log(r['RelationID'], r['事件'], '←', r['人物'], '|', r['人事关系类型']));

// 2. dynasty_201.json 的 events id 格式
const d201 = JSON.parse(fs.readFileSync(path.join(dir, 'frontend/public/data/dynasty_201.json'), 'utf-8'));
console.log('\n===== dynasty_201 events id 例 =====');
d201.events.slice(0, 5).forEach(e => console.log(e.id, e.name));
console.log('===== dynasty_201 persons id 例 =====');
d201.persons.slice(0, 8).forEach(p => console.log(p.id, p.name, 'level=' + p.level));

// 3. 春秋涉及的二级人物：从关系表中收集非一级春秋人物的所有节点名
const l1 = read('1级人物数据.xlsx').filter(r => String(r['朝代']).includes('春秋')).map(r => r['姓名']);
const rel = read('人物关系表.xlsx');
const nodes = new Set();
rel.forEach(r => { nodes.add(r['起点人物']); nodes.add(r['终点人物']); });
const level2Nodes = [...nodes].filter(n => !l1.includes(n));
console.log('\n===== 涉及春秋的人物关系中的二级人物 (' + level2Nodes.length + ') =====');
console.log(level2Nodes.join('、'));