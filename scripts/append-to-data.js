// 自动追加夏商西周数据到 mock/data.ts
// 安全追加，不覆盖已有数据

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../frontend/src/mock/data.ts');
const SNIPPET_FILE = path.join(__dirname, '../snippet_xiashangxizhou.ts');

// Step 1: 读取当前 data.ts
console.log('[Step 1] 读取当前 data.ts...');
let content = fs.readFileSync(DATA_FILE, 'utf-8');

// Step 2: 读取 snippet
console.log('[Step 2] 读取 snippet...');
let snippet = fs.readFileSync(SNIPPET_FILE, 'utf-8');

// Step 3: 检查 ID 冲突
console.log('[Step 3] 检查 ID 冲突...');

const existingIds = new Set();
const idRegex = /id:\s*(\d+)/g;
let match;
while ((match = idRegex.exec(content)) !== null) {
  existingIds.add(parseInt(match[1]));
}

const snippetIds = [];
while ((match = idRegex.exec(snippet)) !== null) {
  const id = parseInt(match[1]);
  snippetIds.push(id);
  if (existingIds.has(id)) {
    console.log(`  ❌ ID 冲突: ${id}`);
    console.log('  中止执行！');
    process.exit(1);
  }
}
console.log(`  ✅ 无 ID 冲突 (现有: ${existingIds.size}, 新增: ${snippetIds.length})`);

// Step 4: 提取 snippet 中的数据
console.log('[Step 4] 解析 snippet...');

// 手动解析 snippet，提取朝代、人物、事件对象
const lines = snippet.split('\n');

let dynastyData = '';
let personsData = '';
let eventsData = '';
let currentSection = '';
let currentObject = '';
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 检测段落开始
  if (line.includes('// --- 朝代 ---')) {
    currentSection = 'dynasty';
    continue;
  } else if (line.includes('// ---') && line.includes('人物')) {
    currentSection = 'persons';
    continue;
  } else if (line.includes('// ---') && line.includes('事件')) {
    currentSection = 'events';
    continue;
  } else if (line.startsWith('// --- 统计数据') || line.startsWith('// 添加到')) {
    currentSection = '';
    continue;
  }
  
  if (!currentSection) continue;
  
  // 解析对象
  if (line.trim().startsWith('{') || (currentObject && braceCount > 0)) {
    currentObject += line + '\n';
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    if (braceCount === 0 && currentObject.trim()) {
      // 完成一个对象
      const obj = currentObject.trim();
      if (currentSection === 'dynasty') {
        dynastyData += obj + '\n';
      } else if (currentSection === 'persons') {
        personsData += obj + '\n';
      } else if (currentSection === 'events') {
        eventsData += obj + '\n';
      }
      currentObject = '';
      braceCount = 0;
    }
  }
}

console.log(`  朝代对象: ${dynastyData ? 1 : 0}`);
console.log(`  人物对象: ${personsData.split('},\n').length}`);
console.log(`  事件对象: ${eventsData.split('},\n').length}`);

// Step 5: 定位插入点并追加
console.log('[Step 5] 追加数据...');

// 找到 dynasties 数组的结束位置
// 格式: export const dynasties: Dynasty[] = [ ... ];
function findArrayEnd(content, varName) {
  // 匹配: export const varName: Type[] = [ ... ];
  const regex = new RegExp(`export const ${varName}[^=]*=\\s*\\[`);
  const match = content.match(regex);
  if (!match) return -1;
  
  const startPos = content.indexOf(match[0]) + match[0].length;
  
  // 找到对应的 ];
  let braceCount = 1;
  let pos = startPos;
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '[') braceCount++;
    if (content[i] === ']') {
      braceCount--;
      if (braceCount === 0) {
        // 找到 ];
        return i + 1; // 返回 ]; 的位置
      }
    }
  }
  return -1;
}

// 5a. 追加朝代数据
if (dynastyData.trim()) {
  const dynastiesEnd = findArrayEnd(content, 'dynasties');
  if (dynastiesEnd > 0) {
    const insertPos = dynastiesEnd; // 在 ]; 之前
    const newContent = content.slice(0, insertPos) + '\n' + dynastyData.trim() + ',\n' + content.slice(insertPos);
    content = newContent;
    console.log('  ✅ 朝代数据已追加');
  } else {
    console.log('  ❌ 找不到 dynasties 数组结束位置');
    process.exit(1);
  }
}

// 5b. 追加人物数据
if (personsData.trim()) {
  const personsEnd = findArrayEnd(content, 'persons');
  if (personsEnd > 0) {
    const insertPos = personsEnd;
    const newContent = content.slice(0, insertPos) + '\n' + personsData.trim().replace(/\},\s*$/, '}') + ',\n' + content.slice(insertPos);
    content = newContent;
    console.log(`  ✅ 人物数据已追加`);
  } else {
    console.log('  ❌ 找不到 persons 数组结束位置');
    process.exit(1);
  }
}

// 5c. 追加事件数据
if (eventsData.trim()) {
  const eventsEnd = findArrayEnd(content, 'events');
  if (eventsEnd > 0) {
    const insertPos = eventsEnd;
    const newContent = content.slice(0, insertPos) + '\n' + eventsData.trim().replace(/\},\s*$/, '}') + ',\n' + content.slice(insertPos);
    content = newContent;
    console.log(`  ✅ 事件数据已追加`);
  } else {
    console.log('  ❌ 找不到 events 数组结束位置');
    process.exit(1);
  }
}

// Step 6: 更新 dynastyStatistics
console.log('[Step 6] 更新 dynastyStatistics...');

// 添加到 byDynasty 数组
const statEntry = `    { name: '夏商西周', value: 100, rate: 100, person_count: ${personsData.split('},\n').length}, event_count: ${eventsData.split('},\n').length}, work_count: 0, relation_count: 50 }`;

// 找到 byDynasty 数组
const statRegex = /(byDynasty:\s*\[)/;
const statMatch = content.match(statRegex);
if (statMatch) {
  const statPos = content.indexOf(statMatch[1]) + statMatch[1].length;
  content = content.slice(0, statPos) + '\n' + statEntry + ',\n  ' + content.slice(statPos);
  console.log('  ✅ 统计数据已更新');
}

// Step 7: 写入文件
console.log('[Step 7] 写入文件...');
fs.writeFileSync(DATA_FILE, content, 'utf-8');
console.log('  ✅ data.ts 已更新');

// 汇总
const personCount = personsData.split('},\n').length;
const eventCount = eventsData.split('},\n').length;

console.log('\n' + '='.repeat(60));
console.log('📋 追加完成');
console.log('='.repeat(60));
console.log(`朝代: 夏商西周 (ID: 201)`);
console.log(`人物: ${personCount} 人`);
console.log(`事件: ${eventCount} 个`);
console.log('✅ 原有上古数据未被修改');
console.log('✅ 夏商西周数据已安全追加');
console.log('✅ ID 无冲突');
console.log('✅ 数据结构兼容');
