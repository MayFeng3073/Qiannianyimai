// 读取Excel数据并生成检测报告
const XLSX = require('xlsx');
const fs = require('fs');
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
console.log('【Excel 数据检测报告】');
console.log('='.repeat(70));

// ========== 1. 一级人物 ==========
console.log('\n' + '='.repeat(70));
console.log('一、1级人物数据.xlsx');
console.log('='.repeat(70));

const person1 = readExcel('1级人物数据.xlsx');
console.log(`列名: ${JSON.stringify(person1.headers)}`);
console.log(`总行数: ${person1.data.length}`);

// 查找朝代字段
const dynastyField1 = person1.headers.find(h => h.includes('朝代'));
const idField1 = person1.headers.find(h => h.includes('PersonID') || h === 'ID');
const nameField1 = person1.headers.find(h => h.includes('姓名') || h.toLowerCase() === 'name');

console.log(`\n朝代字段: [${dynastyField1}]`);
console.log(`ID字段: [${idField1}]`);
console.log(`姓名字段: [${nameField1}]`);

// 统计朝代分布
if (dynastyField1) {
    const dynastyCount = {};
    person1.data.forEach(row => {
        const d = row[dynastyField1] || '(空)';
        dynastyCount[d] = (dynastyCount[d] || 0) + 1;
    });
    console.log('\n朝代值分布:');
    Object.entries(dynastyCount).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}人`);
    });
}

// 夏商西周筛选
const SHANG_ZHOU_DYNASTIES = ['夏', '商', '西周'];
const xiaShangZhouPersons1 = person1.data.filter(row => 
    SHANG_ZHOU_DYNASTIES.includes(row[dynastyField1])
);

console.log(`\n【夏商西周一级人物统计】`);
SHANG_ZHOU_DYNASTIES.forEach(dy => {
    const count = person1.data.filter(row => row[dynastyField1] === dy).length;
    console.log(`  ${dy}: ${count}人`);
});
console.log(`  总计: ${xiaShangZhouPersons1.length}人`);

// ========== 2. 二级人物 ==========
console.log('\n' + '='.repeat(70));
console.log('二、2级人物数据.xlsx');
console.log('='.repeat(70));

const person2 = readExcel('2级人物数据.xlsx');
console.log(`列名: ${JSON.stringify(person2.headers)}`);
console.log(`总行数: ${person2.data.length}`);

const dynastyField2 = person2.headers.find(h => h.includes('朝代'));
const idField2 = person2.headers.find(h => h.includes('SupportPersonID') || h === 'ID');
const nameField2 = person2.headers.find(h => h.includes('姓名') || h.toLowerCase() === 'name');

console.log(`\n朝代字段: [${dynastyField2}]`);
console.log(`ID字段: [${idField2}]`);
console.log(`姓名字段: [${nameField2}]`);

if (dynastyField2) {
    const dynastyCount = {};
    person2.data.forEach(row => {
        const d = row[dynastyField2] || '(空)';
        dynastyCount[d] = (dynastyCount[d] || 0) + 1;
    });
    console.log('\n朝代值分布:');
    Object.entries(dynastyCount).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}人`);
    });
}

const xiaShangZhouPersons2 = person2.data.filter(row => 
    SHANG_ZHOU_DYNASTIES.includes(row[dynastyField2])
);

console.log(`\n【夏商西周二级人物统计】`);
SHANG_ZHOU_DYNASTIES.forEach(dy => {
    const count = person2.data.filter(row => row[dynastyField2] === dy).length;
    console.log(`  ${dy}: ${count}人`);
});
console.log(`  总计: ${xiaShangZhouPersons2.length}人`);

// ========== 3. 事件数据 ==========
console.log('\n' + '='.repeat(70));
console.log('三、事件数据.xlsx');
console.log('='.repeat(70));

const events = readExcel('事件数据.xlsx');
console.log(`列名: ${JSON.stringify(events.headers)}`);
console.log(`总行数: ${events.data.length}`);

const dynastyField3 = events.headers.find(h => h.includes('朝代'));
const idField3 = events.headers.find(h => h.includes('EventID') || h.includes('事件ID'));
const nameField3 = events.headers.find(h => h.includes('事件名称') || h.includes('名称'));

console.log(`\n朝代字段: [${dynastyField3}]`);
console.log(`ID字段: [${idField3}]`);
console.log(`名称字段: [${nameField3}]`);

if (dynastyField3) {
    const dynastyCount = {};
    events.data.forEach(row => {
        const d = row[dynastyField3] || '(空)';
        dynastyCount[d] = (dynastyCount[d] || 0) + 1;
    });
    console.log('\n朝代值分布:');
    Object.entries(dynastyCount).forEach(([k, v]) => {
        console.log(`  ${k}: ${v}个`);
    });
}

const xiaShangZhouEvents = events.data.filter(row => 
    SHANG_ZHOU_DYNASTIES.includes(row[dynastyField3])
);

console.log(`\n【夏商西周事件统计】`);
SHANG_ZHOU_DYNASTIES.forEach(dy => {
    const count = events.data.filter(row => row[dynastyField3] === dy).length;
    console.log(`  ${dy}: ${count}个`);
});
console.log(`  总计: ${xiaShangZhouEvents.length}个`);

// ========== 4. 人物关系 ==========
console.log('\n' + '='.repeat(70));
console.log('四、人物关系表.xlsx');
console.log('='.repeat(70));

const relations = readExcel('人物关系表.xlsx');
console.log(`列名: ${JSON.stringify(relations.headers)}`);
console.log(`总行数: ${relations.data.length}`);

const startField = relations.headers.find(h => h.includes('起点') || h.includes('源') || h.toLowerCase().includes('source'));
const endField = relations.headers.find(h => h.includes('终点') || h.includes('目标') || h.toLowerCase().includes('target'));

console.log(`\n起点字段: [${startField}]`);
console.log(`终点字段: [${endField}]`);

// 构建人物姓名集合
const allPersonNames1 = new Set(person1.data.map(r => r[nameField1]).filter(Boolean));
const allPersonNames2 = new Set(person2.data.map(r => r[nameField2]).filter(Boolean));
const allPersonNames = new Set([...allPersonNames1, ...allPersonNames2]);

// 夏商西周人物姓名集合
const xiaShangZhouNames1 = new Set(xiaShangZhouPersons1.map(r => r[nameField1]).filter(Boolean));
const xiaShangZhouNames2 = new Set(xiaShangZhouPersons2.map(r => r[nameField2]).filter(Boolean));
const xiaShangZhouNames = new Set([...xiaShangZhouNames1, ...xiaShangZhouNames2]);

let internalRelations = 0; // 夏商西周内部关系
let crossRelations = 0; // 跨时代关系
let unmatchedRelations = 0; // 无法匹配人物

const unmatchedRelList = [];

relations.data.forEach(row => {
    const startPerson = row[startField] || '';
    const endPerson = row[endField] || '';
    
    const startInAll = allPersonNames.has(startPerson);
    const endInAll = allPersonNames.has(endPerson);
    
    if (!startInAll || !endInAll) {
        unmatchedRelations++;
        if (!startInAll) unmatchedRelList.push(`起点 "${startPerson}" 找不到对应人物`);
        if (!endInAll) unmatchedRelList.push(`终点 "${endPerson}" 找不到对应人物`);
    } else if (xiaShangZhouNames.has(startPerson) && xiaShangZhouNames.has(endPerson)) {
        internalRelations++;
    } else if (xiaShangZhouNames.has(startPerson) || xiaShangZhouNames.has(endPerson)) {
        crossRelations++;
    }
});

console.log(`\n【人物关系统计】`);
console.log(`总关系: ${relations.data.length}条`);
console.log(`夏商西周内部关系: ${internalRelations}条`);
console.log(`跨时代关系: ${crossRelations}条`);
console.log(`无法匹配人物: ${unmatchedRelations}条`);

if (unmatchedRelList.length > 0) {
    console.log('\n无法匹配的人物:');
    unmatchedRelList.slice(0, 20).forEach(msg => console.log(`  ⚠️ ${msg}`));
    if (unmatchedRelList.length > 20) {
        console.log(`  ... 还有 ${unmatchedRelList.length - 20} 条`);
    }
}

// ========== 5. 人事关系 ==========
console.log('\n' + '='.repeat(70));
console.log('五、人事关系表.xlsx');
console.log('='.repeat(70));

const personEventRelations = readExcel('人事关系表.xlsx');
console.log(`列名: ${JSON.stringify(personEventRelations.headers)}`);
console.log(`总行数: ${personEventRelations.data.length}`);

const eventField5 = personEventRelations.headers.find(h => h.includes('事件'));
const personField5 = personEventRelations.headers.find(h => h.includes('人物') && !h.includes('关系'));

console.log(`\n事件字段: [${eventField5}]`);
console.log(`人物字段: [${personField5}]`);

// 构建事件名称集合
const allEventNames = new Set(events.data.map(r => r[nameField3]).filter(Boolean));
const xiaShangZhouEventNames = new Set(xiaShangZhouEvents.map(r => r[nameField3]).filter(Boolean));

let unmatchedPersonEventPerson = 0;
let unmatchedPersonEventEvent = 0;
const unmatchedPEList = [];

personEventRelations.data.forEach(row => {
    const eventName = row[eventField5] || '';
    const personName = row[personField5] || '';
    
    if (personName && !allPersonNames.has(personName)) {
        unmatchedPersonEventPerson++;
        unmatchedPEList.push(`人物 "${personName}" 找不到对应人物`);
    }
    if (eventName && !allEventNames.has(eventName)) {
        unmatchedPersonEventEvent++;
        unmatchedPEList.push(`事件 "${eventName}" 找不到对应事件`);
    }
});

console.log(`\n【人物—事件关系统计】`);
console.log(`总关系: ${personEventRelations.data.length}条`);
console.log(`无法匹配人物: ${unmatchedPersonEventPerson}条`);
console.log(`无法匹配事件: ${unmatchedPersonEventEvent}条`);

if (unmatchedPEList.length > 0) {
    console.log('\n无法匹配的引用:');
    unmatchedPEList.slice(0, 20).forEach(msg => console.log(`  ⚠️ ${msg}`));
    if (unmatchedPEList.length > 20) {
        console.log(`  ... 还有 ${unmatchedPEList.length - 20} 条`);
    }
}

// ========== 6. 数据完整性检查 ==========
console.log('\n' + '='.repeat(70));
console.log('六、数据完整性检查');
console.log('='.repeat(70));

// 一级人物
let missingPersonId = 0;
let missingPersonName = 0;
let missingPersonDynasty = 0;
xiaShangZhouPersons1.forEach(row => {
    if (!row[idField1]) missingPersonId++;
    if (!row[nameField1]) missingPersonName++;
    if (!row[dynastyField1]) missingPersonDynasty++;
});

// 事件
let missingEventId = 0;
let missingEventName = 0;
xiaShangZhouEvents.forEach(row => {
    if (!row[idField3]) missingEventId++;
    if (!row[nameField3]) missingEventName++;
});

console.log(`\n【数据完整性】`);
console.log(`一级人物 ID缺失: ${missingPersonId}`);
console.log(`一级人物 姓名缺失: ${missingPersonName}`);
console.log(`一级人物 朝代缺失: ${missingPersonDynasty}`);
console.log(`事件 ID缺失: ${missingEventId}`);
console.log(`事件 名称缺失: ${missingEventName}`);

// 检查关键字段为空的情况
const importantFields = ['人物简介', '人物标签', '代表成果', '代表事件', '历史地位', '图片', 'image', '图片URL'];
const fieldEmptyCount = {};
person1.headers.forEach(h => {
    if (importantFields.some(f => h.includes(f))) {
        const emptyCount = person1.data.filter(r => !r[h]).length;
        if (emptyCount > 0) {
            fieldEmptyCount[h] = emptyCount;
        }
    }
});

console.log('\n【关键字段为空统计】(全量)');
if (Object.keys(fieldEmptyCount).length > 0) {
    Object.entries(fieldEmptyCount).forEach(([field, count]) => {
        console.log(`  ${field}: ${count}条为空`);
    });
} else {
    console.log('  无空值字段');
}

// 图片URL检查
console.log('\n【图片检查】');
const imgFields = person1.headers.filter(h => h.includes('图片') || h.toLowerCase().includes('image') || h.toLowerCase().includes('img'));
if (imgFields.length > 0) {
    const imgField = imgFields[0];
    const totalWithImg = person1.data.filter(r => r[imgField]).length;
    const emptyImg = person1.data.filter(r => !r[imgField]).length;
    const invalidImg = person1.data.filter(r => r[imgField] && !r[imgField].startsWith('http') && !r[imgField].endsWith(('.jpg', '.png', '.jpeg', '.webp'))).length;
    
    console.log(`图片字段: [${imgField}]`);
    console.log(`图片URL总数: ${totalWithImg}`);
    console.log(`为空: ${emptyImg}`);
    console.log(`格式异常: ${invalidImg}`);
} else {
    console.log('未找到图片字段');
}

// ========== 7. 输出夏商西周具体数据样本 ==========
console.log('\n' + '='.repeat(70));
console.log('七、夏商西周数据样本预览');
console.log('='.repeat(70));

console.log('\n【夏 - 一级人物】');
const xiaPersons = xiaShangZhouPersons1.filter(r => r[dynastyField1] === '夏');
xiaPersons.forEach(r => console.log(`  ${r[idField1] || '(无ID)'} | ${r[nameField1]} | ${r[dynastyField1]}`));

console.log('\n【商 - 一级人物】');
const shangPersons = xiaShangZhouPersons1.filter(r => r[dynastyField1] === '商');
shangPersons.forEach(r => console.log(`  ${r[idField1] || '(无ID)'} | ${r[nameField1]} | ${r[dynastyField1]}`));

console.log('\n【西周 - 一级人物】');
const xizhouPersons = xiaShangZhouPersons1.filter(r => r[dynastyField1] === '西周');
xizhouPersons.forEach(r => console.log(`  ${r[idField1] || '(无ID)'} | ${r[nameField1]} | ${r[dynastyField1]}`));

console.log('\n【夏商西周 - 事件列表】');
xiaShangZhouEvents.forEach(r => console.log(`  ${r[idField3] || '(无ID)'} | ${r[dynastyField3]} | ${r[nameField3]}`));

// ========== 最终结论 ==========
console.log('\n' + '='.repeat(70));
console.log('【最终结论】');
console.log('='.repeat(70));

const hasIssues = unmatchedRelations > 0 || unmatchedPersonEventPerson > 0 || unmatchedPersonEventEvent > 0;
const hasMissingData = missingPersonId > 0 || missingPersonName > 0 || missingEventId > 0 || missingEventName > 0;

if (!hasIssues && !hasMissingData && xiaShangZhouPersons1.length > 0) {
    console.log('\n✅ 夏商西周数据已经成功读取，可以进入下一阶段页面接入。');
} else {
    console.log('\n⚠️ 暂时不能进入下一阶段，存在以下问题：');
    if (unmatchedRelations > 0) console.log(`  - 人物关系中有 ${unmatchedRelations} 条无法匹配`);
    if (unmatchedPersonEventPerson > 0) console.log(`  - 人事关系中有 ${unmatchedPersonEventPerson} 条人物无法匹配`);
    if (unmatchedPersonEventEvent > 0) console.log(`  - 人事关系中有 ${unmatchedPersonEventEvent} 条事件无法匹配`);
    if (hasMissingData) console.log(`  - 存在核心字段缺失`);
    if (xiaShangZhouPersons1.length === 0) console.log(`  - 夏商西周一级人物数量为 0`);
}

console.log('\n' + '='.repeat(70));
console.log('【检测完成】');
console.log('='.repeat(70));
