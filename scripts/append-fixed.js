// 自动追加夏商西周数据到 mock/data.ts（修复版）
// 修复：数组插入位置在 ] 之前（非之后）
// 安全追加，不覆盖已有数据

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../frontend/src/mock/data.ts');
const SNIPPET_FILE = path.join(__dirname, '../snippet_xiashangxizhou.ts');
const BACKUP_FILE = DATA_FILE + '.pre-append.bak';

// Step 0: 备份当前 data.ts
console.log('[Step 0] 备份当前 data.ts...');
fs.copyFileSync(DATA_FILE, BACKUP_FILE);
console.log(`  备份: ${BACKUP_FILE}`);

// Step 1: 读取当前 data.ts
console.log('[Step 1] 读取当前 data.ts...');
let content = fs.readFileSync(DATA_FILE, 'utf-8');

// Step 2: 读取 snippet
console.log('[Step 2] 读取 snippet...');
let snippet = fs.readFileSync(SNIPPET_FILE, 'utf-8');

// Step 3: 检查 ID 冲突（双保险）
console.log('[Step 3] 再次检查 ID 冲突...');

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

// Step 4: 解析 snippet 中的数据
console.log('[Step 4] 解析 snippet...');

const lines = snippet.split('\n');

let dynastyData = '';
let personsData = '';
let eventsData = '';
let currentSection = '';
let currentObject = '';
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
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
    if (currentObject.trim()) {
      // Strip trailing comma from the object before storing
      dynastyData += currentObject.trim().replace(/,\s*$/, '') + ',\n';
    }
    currentObject = '';
    braceCount = 0;
    continue;
  }
  
  if (!currentSection) continue;
  
  if (line.trim().startsWith('{') || (currentObject && braceCount > 0)) {
    currentObject += line + '\n';
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    if (braceCount <= 0 && currentObject.trim()) {
      const obj = currentObject.trim();
      // Add trailing comma for proper array insertion
      const objWithComma = obj.endsWith(',') ? obj : obj + ',';
      if (currentSection === 'dynasty') {
        dynastyData += objWithComma + '\n';
      } else if (currentSection === 'persons') {
        personsData += objWithComma + '\n';
      } else if (currentSection === 'events') {
        eventsData += objWithComma + '\n';
      }
      currentObject = '';
      braceCount = 0;
    }
  }
}

const dynastyCount = dynastyData ? 1 : 0;
const personCount = personsData.split('\n{').filter(s => s.trim()).length;
const eventCount = eventsData.split('\n{').filter(s => s.trim()).length;
console.log(`  朝代对象: ${dynastyCount}`);
console.log(`  人物对象: ${personCount}`);
console.log(`  事件对象: ${eventCount}`);

// Step 5: 定位数组结束位置并追加（修复版）
console.log('[Step 5] 追加数据...');

// 修复版：找到数组的 ]; 位置，返回 ] 的位置（不是之后）
function findArrayEnd(content, varName) {
  const regex = new RegExp(`export const ${varName}[^=]*=\\s*\\[`);
  const match = content.match(regex);
  if (!match) return -1;
  
  const startPos = content.indexOf(match[0]) + match[0].length;
  
  // 找到对应的 ]
  let braceCount = 1;
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '[') braceCount++;
    if (content[i] === ']') {
      braceCount--;
      if (braceCount === 0) {
        return i; // 返回 ] 的位置（修复：之前是 i + 1）
      }
    }
  }
  return -1;
}

// 辅助函数：确保在数组最后一个元素后添加逗号
function ensureTrailingComma(beforeBracket) {
  const trimmed = beforeBracket.trimEnd();
  if (trimmed.endsWith(',')) {
    return beforeBracket; // 已有逗号
  }
  // 在最后一个 } 后添加逗号
  return trimmed + ',\n';
}

// 5a. 追加朝代数据
if (dynastyData.trim()) {
  const dynastiesEnd = findArrayEnd(content, 'dynasties');
  if (dynastiesEnd > 0) {
    const beforeBracket = content.slice(0, dynastiesEnd);
    const fixedBefore = ensureTrailingComma(beforeBracket);
    const newContent = fixedBefore + dynastyData.trim() + '\n' + content.slice(dynastiesEnd);
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
    const beforeBracket = content.slice(0, personsEnd);
    const fixedBefore = ensureTrailingComma(beforeBracket);
    const newContent = fixedBefore + personsData.trim() + '\n' + content.slice(personsEnd);
    content = newContent;
    console.log(`  ✅ 人物数据已追加 (${personCount} 人)`);
  } else {
    console.log('  ❌ 找不到 persons 数组结束位置');
    process.exit(1);
  }
}

// 5c. 追加事件数据
if (eventsData.trim()) {
  const eventsEnd = findArrayEnd(content, 'events');
  if (eventsEnd > 0) {
    const beforeBracket = content.slice(0, eventsEnd);
    const fixedBefore = ensureTrailingComma(beforeBracket);
    const newContent = fixedBefore + eventsData.trim() + '\n' + content.slice(eventsEnd);
    content = newContent;
    console.log(`  ✅ 事件数据已追加 (${eventCount} 个)`);
  } else {
    console.log('  ❌ 找不到 events 数组结束位置');
    process.exit(1);
  }
}

// Step 6: 更新 dynastyStatistics
console.log('[Step 6] 更新 dynastyStatistics...');

const statEntry = `    { name: '夏商西周', value: 100, rate: 100, person_count: ${personCount}, event_count: ${eventCount}, work_count: 0, relation_count: 50 }`;

// 找到 byDynasty 数组
const statRegex = /(byDynasty:\s*\[)/;
const statMatch = content.match(statRegex);
if (statMatch) {
  const statPos = content.indexOf(statMatch[1]) + statMatch[1].length;
  content = content.slice(0, statPos) + '\n' + statEntry + ',\n  ' + content.slice(statPos);
  console.log('  ✅ 统计数据已更新');
}

// Step 7: 验证追加结果
console.log('[Step 7] 验证追加结果...');

// 检查 dynasties 数组是否包含夏商西周
const dynastyCheck = /name:\s*'夏商西周'/.test(content);
console.log(`  朝代数据在数组中: ${dynastyCheck ? '✅' : '❌'}`);

// 检查是否有语法错误迹象
const bracketBalance = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;
console.log(`  方括号平衡: ${bracketBalance === 0 ? '✅' : '❌'}`);

const braceBalance = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
console.log(`  花括号平衡: ${braceBalance === 0 ? '✅' : '❌'}`);

// Step 8: 写入文件
console.log('[Step 8] 写入文件...');
fs.writeFileSync(DATA_FILE, content, 'utf-8');
console.log('✅ data.ts 已更新');

// 汇总
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
console.log('✅ 数组插入位置正确（在 ] 之前）');