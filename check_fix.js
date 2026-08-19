// 人物关系表关联修复检查
const XLSX = require('xlsx');
const path = require('path');

const BASE_DIR = 'd:\\SHUMEI\\GraduationProject';

function readExcel(filename) {
    const filepath = path.join(BASE_DIR, filename);
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

console.log('='.repeat(70));
console.log('【人物关系表关联修复检查】');
console.log('='.repeat(70));

// 读取所有数据
const persons1 = readExcel('1级人物数据.xlsx');
const persons2 = readExcel('2级人物数据.xlsx');
const events = readExcel('事件数据.xlsx');
const personRelations = readExcel('人物关系表.xlsx');
const eventRelations = readExcel('人事关系表.xlsx');

console.log('\n当前人物关系表总记录数:', personRelations.length);

// 构建有效人物名称集合（一级+二级）
const validPersonNames = new Set();
persons1.forEach(r => {
    if (r['姓名']) validPersonNames.add(r['姓名']);
});
persons2.forEach(r => {
    if (r['姓名']) validPersonNames.add(r['姓名']);
});

console.log('有效人物名称数量:', validPersonNames.size);

// 构建有效事件名称集合
const validEventNames = new Set();
events.forEach(r => {
    if (r['事件名称']) validEventNames.add(r['事件名称']);
});

console.log('有效事件名称数量:', validEventNames.size);

// ========== 检查人物关系表 ==========
console.log('\n' + '='.repeat(70));
console.log('【人物关系表修复检查】');
console.log('='.repeat(70));

let invalidRelations = [];
let validRelations = [];

personRelations.forEach((row, index) => {
    const startPerson = row['起点人物'];
    const endPerson = row['终点人物'];
    const issues = [];
    
    if (!validPersonNames.has(startPerson)) {
        issues.push(`起点"${startPerson}"不存在`);
    }
    if (!validPersonNames.has(endPerson)) {
        issues.push(`终点"${endPerson}"不存在`);
    }
    
    if (issues.length > 0) {
        invalidRelations.push({
            index: index + 2, // Excel行号（从1开始，加表头）
            relationId: row['RelationID'],
            start: startPerson,
            end: endPerson,
            type: row['关系类型'],
            issues: issues
        });
    } else {
        validRelations.push(row);
    }
});

console.log('\n无效关系记录:');
invalidRelations.forEach(rel => {
    console.log(`  行${rel.index}: ${rel.relationId} | ${rel.start} → ${rel.end} (${rel.type})`);
    rel.issues.forEach(issue => console.log(`    ⚠️ ${issue}`));
});

console.log('\n【处理建议】');
console.log('以下人物不存在于人物表中，涉及他们的关系记录应删除：');

// 统计不存在的人物
const nonExistPersons = new Set();
invalidRelations.forEach(rel => {
    if (!validPersonNames.has(rel.start)) nonExistPersons.add(rel.start);
    if (!validPersonNames.has(rel.end)) nonExistPersons.add(rel.end);
});

nonExistPersons.forEach(name => {
    const count = invalidRelations.filter(r => r.start === name || r.end === name).length;
    console.log(`  "${name}": 涉及${count}条关系 → 应删除`);
});

// ========== 检查人事关系表 ==========
console.log('\n' + '='.repeat(70));
console.log('【人事关系表检查】');
console.log('='.repeat(70));

let invalidEventRelations = [];
let validEventRelations = [];

eventRelations.forEach((row, index) => {
    const person = row['人物'];
    const event = row['事件'];
    const issues = [];
    
    if (!validPersonNames.has(person)) {
        issues.push(`人物"${person}"不存在`);
    }
    if (!validEventNames.has(event)) {
        issues.push(`事件"${event}"不存在`);
    }
    
    if (issues.length > 0) {
        invalidEventRelations.push({
            index: index + 2,
            relationId: row['RelationID'],
            event: event,
            person: person,
            type: row['人事关系类型'],
            issues: issues
        });
    } else {
        validEventRelations.push(row);
    }
});

console.log(`\n人事关系表总记录数: ${eventRelations.length}`);
console.log(`有效记录: ${validEventRelations.length}`);
console.log(`无效记录: ${invalidEventRelations.length}`);

if (invalidEventRelations.length > 0) {
    console.log('\n无效人事关系记录:');
    invalidEventRelations.forEach(rel => {
        console.log(`  行${rel.index}: ${rel.relationId} | ${rel.event} → ${rel.person} (${rel.type})`);
        rel.issues.forEach(issue => console.log(`    ⚠️ ${issue}`));
    });
} else {
    console.log('✅ 人事关系表全部有效！');
}

// ========== 最终检查报告 ==========
console.log('\n' + '='.repeat(70));
console.log('【最终检查报告】');
console.log('='.repeat(70));

console.log(`
① 人物关系表最终剩余: ${validRelations.length} 条
   - 原始记录: ${personRelations.length} 条
   - 需删除的无效记录: ${invalidRelations.length} 条
`);

console.log(`② 无法匹配的人物: ${invalidRelations.length > 0 ? '已识别（见上方列表）' : '无'}`);

console.log(`③ 同名人物检查:`);
// 检查同名人物
const nameCount = {};
persons1.forEach(r => {
    const name = r['姓名'];
    if (name) {
        if (!nameCount[name]) nameCount[name] = [];
        nameCount[name].push({ id: r['PersonID'], dynasty: r['朝代'], type: '一级' });
    }
});
persons2.forEach(r => {
    const name = r['姓名'];
    if (name) {
        if (!nameCount[name]) nameCount[name] = [];
        nameCount[name].push({ id: r['SupportPersonID'], dynasty: r['朝代'], type: '二级' });
    }
});

let hasDuplicates = false;
Object.entries(nameCount).forEach(([name, entries]) => {
    if (entries.length > 1) {
        hasDuplicates = true;
        console.log(`   ⚠️ "${name}":`);
        entries.forEach(e => console.log(`      - ${e.id} (${e.dynasty}, ${e.type})`));
    }
});

if (!hasDuplicates) {
    console.log('   ✅ 无同名人物');
}

console.log(`
④ 人事关系表无法匹配记录: ${invalidEventRelations.length} 条
`);

// 完整性检查
console.log(`⑤ 数据完整性检查:`);
let issues = [];

// 检查一级人物
let missingPersonId = 0;
let missingPersonName = 0;
persons1.forEach(r => {
    if (!r['PersonID']) missingPersonId++;
    if (!r['姓名']) missingPersonName++;
});

// 检查二级人物
let missingSPersonId = 0;
let missingSPersonName = 0;
persons2.forEach(r => {
    if (!r['SupportPersonID']) missingSPersonId++;
    if (!r['姓名']) missingSPersonName++;
});

// 检查事件
let missingEventId = 0;
let missingEventName = 0;
events.forEach(r => {
    if (!r['EventID']) missingEventId++;
    if (!r['事件名称']) missingEventName++;
});

if (missingPersonId > 0) issues.push(`一级人物ID缺失: ${missingPersonId}`);
if (missingPersonName > 0) issues.push(`一级人物姓名缺失: ${missingPersonName}`);
if (missingSPersonId > 0) issues.push(`二级人物ID缺失: ${missingSPersonId}`);
if (missingSPersonName > 0) issues.push(`二级人物姓名缺失: ${missingSPersonName}`);
if (missingEventId > 0) issues.push(`事件ID缺失: ${missingEventId}`);
if (missingEventName > 0) issues.push(`事件名称缺失: ${missingEventName}`);

if (issues.length > 0) {
    issues.forEach(i => console.log(`   ⚠️ ${i}`));
} else {
    console.log('   ✅ 无ID/姓名/名称缺失');
}

console.log('\n' + '='.repeat(70));
console.log('【检查完成】');
console.log('='.repeat(70));
