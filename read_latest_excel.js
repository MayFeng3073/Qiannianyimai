// 重新读取当前最新Excel数据
const XLSX = require('xlsx');
const path = require('path');

const BASE_DIR = 'd:\\SHUMEI\\GraduationProject';

function readExcel(filename) {
    const filepath = path.join(BASE_DIR, filename);
    const workbook = XLSX.readFile(filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return { data, sheetName, headers: Object.keys(data[0] || {}) };
}

console.log('='.repeat(70));
console.log('【Excel 数据读取报告 - 最新】');
console.log('='.repeat(70));

// ========== 1. 一级人物 ==========
console.log('\n【1. 一级人物数据表】');
const person1 = readExcel('1级人物数据.xlsx');
console.log(`文件名: 1级人物数据.xlsx`);
console.log(`Sheet: ${person1.sheetName}`);
console.log(`字段: ${JSON.stringify(person1.headers)}`);
console.log(`总行数: ${person1.data.length}`);

// 按朝代统计
const dynastyCount1 = {};
person1.data.forEach(row => {
    const d = row['朝代'] || '(空)';
    if (!dynastyCount1[d]) dynastyCount1[d] = [];
    dynastyCount1[d].push(row['姓名']);
});

console.log('\n按朝代分布:');
Object.entries(dynastyCount1).forEach(([d, names]) => {
    console.log(`  ${d}: ${names.length}人 - ${names.join('、')}`);
});

// ========== 2. 二级人物 ==========
console.log('\n【2. 二级人物数据表】');
const person2 = readExcel('2级人物数据.xlsx');
console.log(`文件名: 2级人物数据.xlsx`);
console.log(`Sheet: ${person2.sheetName}`);
console.log(`字段: ${JSON.stringify(person2.headers)}`);
console.log(`总行数: ${person2.data.length}`);

const dynastyCount2 = {};
person2.data.forEach(row => {
    const d = row['朝代'] || '(空)';
    if (!dynastyCount2[d]) dynastyCount2[d] = [];
    dynastyCount2[d].push(row['姓名']);
});

console.log('\n按朝代分布:');
Object.entries(dynastyCount2).forEach(([d, names]) => {
    console.log(`  ${d}: ${names.length}人`);
});

// 检查同名人物
console.log('\n同名人物检查:');
const nameCount2 = {};
person2.data.forEach(row => {
    const name = row['姓名'];
    if (name) {
        if (!nameCount2[name]) nameCount2[name] = [];
        nameCount2[name].push(`${row['SupportPersonID']}(${row['朝代']})`);
    }
});
Object.entries(nameCount2).forEach(([name, entries]) => {
    if (entries.length > 1) {
        console.log(`  ⚠️ "${name}" 出现${entries.length}次: ${entries.join(', ')}`);
    }
});

// ========== 3. 事件 ==========
console.log('\n【3. 事件数据表】');
const events = readExcel('事件数据.xlsx');
console.log(`文件名: 事件数据.xlsx`);
console.log(`Sheet: ${events.sheetName}`);
console.log(`字段: ${JSON.stringify(events.headers)}`);
console.log(`总行数: ${events.data.length}`);

const dynastyCount3 = {};
events.data.forEach(row => {
    const d = row['朝代'] || '(空)';
    if (!dynastyCount3[d]) dynastyCount3[d] = [];
    dynastyCount3[d].push(row['事件名称']);
});

console.log('\n按朝代分布:');
Object.entries(dynastyCount3).forEach(([d, names]) => {
    console.log(`  ${d}: ${names.length}个`);
    names.forEach(n => console.log(`    - ${n}`));
});

// ========== 4. 人物关系表 ==========
console.log('\n【4. 人物关系数据表】');
const personRel = readExcel('人物关系表.xlsx');
console.log(`文件名: 人物关系表.xlsx`);
console.log(`Sheet: ${personRel.sheetName}`);
console.log(`字段: ${JSON.stringify(personRel.headers)}`);
console.log(`总行数: ${personRel.data.length}`);

// 构建所有人物名称索引（带朝代）
const personIndex = new Map(); // name -> [{id, dynasty, type}]
person1.data.forEach(r => {
    const name = r['姓名'];
    if (name) {
        if (!personIndex.has(name)) personIndex.set(name, []);
        personIndex.get(name).push({ id: r['PersonID'], dynasty: r['朝代'], type: '一级' });
    }
});
person2.data.forEach(r => {
    const name = r['姓名'];
    if (name) {
        if (!personIndex.has(name)) personIndex.set(name, []);
        personIndex.get(name).push({ id: r['SupportPersonID'], dynasty: r['朝代'], type: '二级' });
    }
});

// 检查人物关系中的匹配
let unmatchedRel = 0;
const unmatchedRelDetails = [];
personRel.data.forEach(row => {
    const start = row['起点人物'];
    const end = row['终点人物'];
    
    const startMatches = personIndex.get(start);
    const endMatches = personIndex.get(end);
    
    if (!startMatches || !endMatches) {
        unmatchedRel++;
        if (!startMatches) unmatchedRelDetails.push(`起点 "${start}" 无法匹配`);
        if (!endMatches) unmatchedRelDetails.push(`终点 "${end}" 无法匹配`);
    }
});

console.log(`\n无法匹配的关系: ${unmatchedRel}条`);
if (unmatchedRelDetails.length > 0) {
    const unique = [...new Set(unmatchedRelDetails)];
    console.log('问题详情（去重）:');
    unique.forEach(msg => console.log(`  ⚠️ ${msg}`));
}

// ========== 5. 人事关系表 ==========
console.log('\n【5. 人物—事件关系数据表】');
const eventRel = readExcel('人事关系表.xlsx');
console.log(`文件名: 人事关系表.xlsx`);
console.log(`Sheet: ${eventRel.sheetName}`);
console.log(`字段: ${JSON.stringify(eventRel.headers)}`);
console.log(`总行数: ${eventRel.data.length}`);

// 构建事件名称索引
const eventIndex = new Map();
events.data.forEach(r => {
    const name = r['事件名称'];
    if (name) eventIndex.set(name, { id: r['EventID'], dynasty: r['朝代'] });
});

// 检查人事关系匹配
let unmatchedPerson = 0;
let unmatchedEvent = 0;
const unmatchedPEDetails = [];

eventRel.data.forEach(row => {
    const person = row['人物'];
    const event = row['事件'];
    
    const personMatches = personIndex.get(person);
    const eventMatches = eventIndex.get(event);
    
    if (!personMatches) {
        unmatchedPerson++;
        unmatchedPEDetails.push(`人物 "${person}" 无法匹配`);
    }
    if (!eventMatches) {
        unmatchedEvent++;
        unmatchedPEDetails.push(`事件 "${event}" 无法匹配`);
    }
});

console.log(`\n无法匹配的人物: ${unmatchedPerson}条`);
console.log(`无法匹配的事件: ${unmatchedEvent}条`);
if (unmatchedPEDetails.length > 0) {
    const unique = [...new Set(unmatchedPEDetails)];
    console.log('问题详情（去重）:');
    unique.forEach(msg => console.log(`  ⚠️ ${msg}`));
}

// ========== 6. 朝代热力图 ==========
console.log('\n【6. 朝代热力图数据表】');
const heatmap = readExcel('朝代热力图.xlsx');
console.log(`文件名: 朝代热力图.xlsx`);
console.log(`Sheet: ${heatmap.sheetName}`);
console.log(`字段: ${JSON.stringify(heatmap.headers)}`);
console.log(`总行数: ${heatmap.data.length}`);

// 按朝代统计热力图
const heatmapByDynasty = {};
heatmap.data.forEach(row => {
    const d = row['朝代'] || '(空)';
    if (!heatmapByDynasty[d]) heatmapByDynasty[d] = [];
    
    const keyword = row['关键词'] || row['keyword'] || '';
    const category = row['类别'] || row['category'] || '';
    const weight = row['权重'] || row['weight'] || '';
    const fontSize = row['推荐字号'] || row['fontSize'] || '';
    
    heatmapByDynasty[d].push({ keyword, category, weight, fontSize });
});

console.log('\n各朝代热力图关键词统计:');
Object.entries(heatmapByDynasty).forEach(([d, items]) => {
    console.log(`  ${d}: ${items.length}个关键词`);
    // 显示前5个作为样本
    items.slice(0, 5).forEach(item => {
        console.log(`    - "${item.keyword}" [${item.category}] 权重:${item.weight} 字号:${item.fontSize}`);
    });
    if (items.length > 5) {
        console.log(`    ... 还有${items.length - 5}个`);
    }
});

// ========== 7. 综合检查 ==========
console.log('\n' + '='.repeat(70));
console.log('【数据完整性检查】');
console.log('='.repeat(70));

// 检查空值
let missingPersonId = 0;
let missingPersonName = 0;
person1.data.forEach(r => {
    if (!r['PersonID']) missingPersonId++;
    if (!r['姓名']) missingPersonName++;
});

let missingEventId = 0;
let missingEventName = 0;
events.data.forEach(r => {
    if (!r['EventID']) missingEventId++;
    if (!r['事件名称']) missingEventName++;
});

console.log(`\n一级人物: ID缺失=${missingPersonId}, 姓名缺失=${missingPersonName}`);
console.log(`事件: ID缺失=${missingEventId}, 名称缺失=${missingEventName}`);

// 检查群体概念
console.log('\n【群体概念识别】（不作为普通人物处理）');
const groupConcepts = ['商王', '周王室', '犬戎', '商王室', '夏王室', '诸侯', '百姓', '国人'];
const foundGroupConcepts = new Set();

personRel.data.forEach(r => {
    if (groupConcepts.includes(r['起点人物'])) foundGroupConcepts.add(r['起点人物']);
    if (groupConcepts.includes(r['终点人物'])) foundGroupConcepts.add(r['终点人物']);
});
eventRel.data.forEach(r => {
    if (groupConcepts.includes(r['人物'])) foundGroupConcepts.add(r['人物']);
});

if (foundGroupConcepts.size > 0) {
    console.log('在关系表中发现的群体概念:');
    foundGroupConcepts.forEach(g => console.log(`  - ${g}`));
}

console.log('\n' + '='.repeat(70));
console.log('【读取完成】');
console.log('='.repeat(70));
