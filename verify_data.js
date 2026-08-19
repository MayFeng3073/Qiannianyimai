// 重新读取最新Excel数据进行校验
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
console.log('【数据校验报告 - 最新】');
console.log('='.repeat(70));

// 读取所有数据
const persons1 = readExcel('1级人物数据.xlsx');
const persons2 = readExcel('2级人物数据.xlsx');
const events = readExcel('事件数据.xlsx');
const personRelations = readExcel('人物关系表.xlsx');
const eventRelations = readExcel('人事关系表.xlsx');

console.log('\n【1. 人物关系表记录数】');
console.log(`当前记录数: ${personRelations.length} 条`);
console.log(`期望记录数: 111 条`);
console.log(personRelations.length === 111 ? '✅ 数量正确' : '⚠️ 数量不匹配');

// 构建有效人物名称集合
const validPersonNames = new Set();
const personDetails = new Map(); // name -> [{id, dynasty, type}]

persons1.forEach(r => {
    const name = r['姓名'];
    if (name) {
        validPersonNames.add(name);
        if (!personDetails.has(name)) personDetails.set(name, []);
        personDetails.get(name).push({ id: r['PersonID'], dynasty: r['朝代'], type: '一级' });
    }
});
persons2.forEach(r => {
    const name = r['姓名'];
    if (name) {
        validPersonNames.add(name);
        if (!personDetails.has(name)) personDetails.set(name, []);
        personDetails.get(name).push({ id: r['SupportPersonID'], dynasty: r['朝代'], type: '二级' });
    }
});

// 构建有效事件名称集合
const validEventNames = new Set();
events.forEach(r => {
    if (r['事件名称']) validEventNames.add(r['事件名称']);
});

console.log(`\n有效人物名称数: ${validPersonNames.size}`);
console.log(`有效事件名称数: ${validEventNames.size}`);

// ========== 检查人物关系表 ==========
console.log('\n【2. 人物关系表匹配检查】');

let invalidRelations = [];
let validRelations = [];

personRelations.forEach((row, index) => {
    const startPerson = row['起点人物'];
    const endPerson = row['终点人物'];
    
    if (!validPersonNames.has(startPerson) || !validPersonNames.has(endPerson)) {
        invalidRelations.push({
            index: index + 2,
            relationId: row['RelationID'],
            start: startPerson,
            end: endPerson,
            issues: []
        });
        if (!validPersonNames.has(startPerson)) {
            invalidRelations[invalidRelations.length - 1].issues.push(`起点"${startPerson}"不存在`);
        }
        if (!validPersonNames.has(endPerson)) {
            invalidRelations[invalidRelations.length - 1].issues.push(`终点"${endPerson}"不存在`);
        }
    } else {
        validRelations.push(row);
    }
});

console.log(`有效关系: ${validRelations.length} 条`);
console.log(`无效关系: ${invalidRelations.length} 条`);

if (invalidRelations.length > 0) {
    console.log('\n⚠️ 仍然存在无法匹配的关系:');
    invalidRelations.forEach(rel => {
        console.log(`  行${rel.index}: ${rel.relationId} | ${rel.start} → ${rel.end}`);
        rel.issues.forEach(issue => console.log(`    - ${issue}`));
    });
} else {
    console.log('✅ 所有人物关系均有效！');
}

// ========== 检查人事关系表 ==========
console.log('\n【3. 人事关系表匹配检查】');

let invalidEventRel = [];
let validEventRel = [];

eventRelations.forEach((row, index) => {
    const person = row['人物'];
    const event = row['事件'];
    
    if (!validPersonNames.has(person) || !validEventNames.has(event)) {
        invalidEventRel.push({
            index: index + 2,
            relationId: row['RelationID'],
            event: event,
            person: person,
            issues: []
        });
        if (!validPersonNames.has(person)) {
            invalidEventRel[invalidEventRel.length - 1].issues.push(`人物"${person}"不存在`);
        }
        if (!validEventNames.has(event)) {
            invalidEventRel[invalidEventRel.length - 1].issues.push(`事件"${event}"不存在`);
        }
    } else {
        validEventRel.push(row);
    }
});

console.log(`当前记录数: ${eventRelations.length} 条`);
console.log(`有效记录: ${validEventRel.length} 条`);
console.log(`无效记录: ${invalidEventRel.length} 条`);

if (invalidEventRel.length === 0) {
    console.log('✅ 人事关系表全部有效！');
} else {
    console.log('\n⚠️ 存在无法匹配的人事关系:');
    invalidEventRel.forEach(rel => {
        console.log(`  行${rel.index}: ${rel.relationId} | ${rel.event} → ${rel.person}`);
        rel.issues.forEach(issue => console.log(`    - ${issue}`));
    });
}

// ========== 同名人物检查 ==========
console.log('\n【4. 同名人物检查】');

const duplicateNames = [];
personDetails.forEach((entries, name) => {
    if (entries.length > 1) {
        duplicateNames.push({ name, entries });
    }
});

if (duplicateNames.length > 0) {
    console.log(`发现 ${duplicateNames.length} 组同名人物：\n`);
    duplicateNames.forEach(({ name, entries }) => {
        console.log(`"${name}":`);
        entries.forEach(e => {
            console.log(`  - ${e.id} (${e.dynasty}, ${e.type})`);
        });
        console.log('');
    });
    console.log('✅ 可通过 PersonID + 朝代 正确区分');
} else {
    console.log('✅ 无同名人物');
}

// ========== 数据完整性检查 ==========
console.log('\n【5. 数据完整性检查】');

let missingIssues = [];

// 一级人物
let missingP1Id = persons1.filter(r => !r['PersonID']).length;
let missingP1Name = persons1.filter(r => !r['姓名']).length;
if (missingP1Id > 0) missingIssues.push(`一级人物ID缺失: ${missingP1Id}`);
if (missingP1Name > 0) missingIssues.push(`一级人物姓名缺失: ${missingP1Name}`);

// 二级人物
let missingP2Id = persons2.filter(r => !r['SupportPersonID']).length;
let missingP2Name = persons2.filter(r => !r['姓名']).length;
if (missingP2Id > 0) missingIssues.push(`二级人物ID缺失: ${missingP2Id}`);
if (missingP2Name > 0) missingIssues.push(`二级人物姓名缺失: ${missingP2Name}`);

// 事件
let missingEventId = events.filter(r => !r['EventID']).length;
let missingEventName = events.filter(r => !r['事件名称']).length;
if (missingEventId > 0) missingIssues.push(`事件ID缺失: ${missingEventId}`);
if (missingEventName > 0) missingIssues.push(`事件名称缺失: ${missingEventName}`);

if (missingIssues.length === 0) {
    console.log('✅ 所有ID、姓名、名称字段完整！');
} else {
    console.log('⚠️ 存在以下缺失:');
    missingIssues.forEach(i => console.log(`  - ${i}`));
}

// ========== 最终结论 ==========
console.log('\n' + '='.repeat(70));
console.log('【最终校验结果】');
console.log('='.repeat(70));

const allPass = 
    personRelations.length === 111 && 
    invalidRelations.length === 0 && 
    invalidEventRel.length === 0 && 
    missingIssues.length === 0;

if (allPass) {
    console.log('\n✅ 数据关联检查通过，可以进入页面填充阶段。');
} else {
    console.log('\n❌ 校验未通过，存在以下问题:');
    if (personRelations.length !== 111) console.log(`  - 人物关系表记录数不匹配 (期望111，实际${personRelations.length})`);
    if (invalidRelations.length > 0) console.log(`  - 人物关系表仍有${invalidRelations.length}条无法匹配`);
    if (invalidEventRel.length > 0) console.log(`  - 人事关系表有${invalidEventRel.length}条无法匹配`);
    if (missingIssues.length > 0) console.log(`  - 存在字段缺失问题`);
}

console.log('\n' + '='.repeat(70));
