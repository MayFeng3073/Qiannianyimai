// 详细分析无法匹配的问题
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_DIR = 'd:\\SHUMEI\\GraduationProject';

function readExcel(filename) {
    const filepath = path.join(BASE_DIR, filename);
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

// 读取数据
const persons1 = readExcel('1级人物数据.xlsx');
const persons2 = readExcel('2级人物数据.xlsx');
const events = readExcel('事件数据.xlsx');
const personRelations = readExcel('人物关系表.xlsx');
const eventRelations = readExcel('人事关系表.xlsx');

// 构建名称集合
const allPersonNames = new Set([
    ...persons1.map(r => r['姓名']).filter(Boolean),
    ...persons2.map(r => r['姓名']).filter(Boolean)
]);

const allEventNames = new Set(events.map(r => r['事件名称']).filter(Boolean));

console.log('【事件数据完整列表】');
console.log('已有的事件:');
events.forEach(r => console.log(`  ${r['EventID']} | ${r['朝代']} | ${r['事件名称']}`));

console.log('\n【检查无法匹配的事件名】');
const unmatchedEventNames = new Set();
eventRelations.forEach(r => {
    const evt = r['事件'];
    if (evt && !allEventNames.has(evt)) {
        unmatchedEventNames.add(evt);
    }
});
console.log('人事关系中引用但不存在的事件:');
unmatchedEventNames.forEach(name => console.log(`  - ${name}`));

console.log('\n【检查无法匹配的人物名】');
const unmatchedPersonNames = new Set();
personRelations.forEach(r => {
    const start = r['起点人物'];
    const end = r['终点人物'];
    if (start && !allPersonNames.has(start)) unmatchedPersonNames.add(start);
    if (end && !allPersonNames.has(end)) unmatchedPersonNames.add(end);
});

eventRelations.forEach(r => {
    const person = r['人物'];
    if (person && !allPersonNames.has(person)) unmatchedPersonNames.add(person);
});

console.log('人物关系表和人事关系表中引用但不存在的人物:');
unmatchedPersonNames.forEach(name => console.log(`  - ${name}`));

console.log('\n【一级人物完整列表】');
persons1.forEach(r => console.log(`  ${r['PersonID']} | ${r['姓名']} | ${r['朝代']}`));

console.log('\n【二级人物完整列表 - 夏商西周】');
const SHANG_ZHOU_DYNASTIES = ['夏', '商', '西周'];
persons2.filter(r => SHANG_ZHOU_DYNASTIES.includes(r['朝代'])).forEach(r => 
    console.log(`  ${r['SupportPersonID']} | ${r['姓名']} | ${r['朝代']}`)
);
