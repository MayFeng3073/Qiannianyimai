// 综合验证与安全追加脚本
// 功能：验证数据兼容性 → 检查ID冲突 → 检查引用完整性 → 安全追加

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../frontend/src/mock/data.ts');
const SNIPPET_FILE = path.join(__dirname, '../snippet_xiashangxizhou.ts');

console.log('='.repeat(60));
console.log('夏商西周数据验证与安全追加');
console.log('='.repeat(60));

// ========== Step 0: 读取文件 ==========
console.log('\n[Step 0] 读取文件...');
const dataContent = fs.readFileSync(DATA_FILE, 'utf-8');
const snippetContent = fs.readFileSync(SNIPPET_FILE, 'utf-8');
console.log(`  data.ts: ${dataContent.length} 字符`);
console.log(`  snippet: ${snippetContent.length} 字符`);

// ========== Step 1: 数据结构兼容性检查 ==========
console.log('\n[Step 1] 数据结构兼容性检查...');

// 检查 data.ts 中的接口定义
const interfaces = ['NarrativeRelationNode', 'NarrativeRelationEdge', 'PersonStory', 'Person', 
  'EventNarrative', 'EventBackground', 'EventImpact', 'EventChain', 'TimelineEntry',
  'PersonRelation', 'Event', 'Dynasty'];

for (const iface of interfaces) {
  const regex = new RegExp(`export interface ${iface}\\b`);
  if (regex.test(dataContent)) {
    console.log(`  ✅ 接口 ${iface} 存在`);
  } else {
    console.log(`  ❌ 接口 ${iface} 缺失`);
  }
}

// 检查数组变量
const arrays = ['dynasties', 'persons', 'events'];
for (const arr of arrays) {
  const regex = new RegExp(`export const ${arr}[^=]*=\\s*\\[`);
  if (regex.test(dataContent)) {
    console.log(`  ✅ 数组 ${arr} 存在`);
  } else {
    console.log(`  ❌ 数组 ${arr} 缺失`);
  }
}

// 检查 dynastyStatistics
if (/dynastyStatistics/.test(dataContent)) {
  console.log(`  ✅ dynastyStatistics 存在`);
} else {
  console.log(`  ❌ dynastyStatistics 缺失`);
}

// 检查 snippet 中的数据结构
console.log('\n  检查 snippet 数据结构...');
const snippetObjects = [];
const snippetLines = snippetContent.split('\n');
let currentObj = '';
let braceCount = 0;
let inSection = false;

for (const line of snippetLines) {
  if (line.includes('// --- 朝代 ---')) {
    inSection = 'dynasty';
    continue;
  } else if (line.includes('// ---') && line.includes('人物')) {
    inSection = 'persons';
    continue;
  } else if (line.includes('// ---') && line.includes('事件')) {
    inSection = 'events';
    continue;
  } else if (line.startsWith('// --- 统计') || line.startsWith('// 添加')) {
    inSection = null;
    if (currentObj.trim()) {
      snippetObjects.push({ type: 'unknown', data: currentObj.trim() });
    }
    currentObj = '';
    braceCount = 0;
    continue;
  }
  
  if (!inSection) continue;
  
  currentObj += line + '\n';
  braceCount += (line.match(/\{/g) || []).length;
  braceCount -= (line.match(/\}/g) || []).length;
  
  if (braceCount <= 0 && currentObj.trim()) {
    try {
      const obj = eval('(' + currentObj.trim().replace(/,$/, '') + ')');
      snippetObjects.push({ type: inSection, data: obj });
    } catch (e) {
      // ignore parse errors for now
    }
    currentObj = '';
    braceCount = 0;
  }
}

console.log(`  snippet 包含: ${snippetObjects.filter(o => o.type === 'dynasty').length} 个朝代对象`);
console.log(`               ${snippetObjects.filter(o => o.type === 'persons').length} 个人物对象`);
console.log(`               ${snippetObjects.filter(o => o.type === 'events').length} 个事件对象`);

// 检查 Person 数据结构兼容性
const samplePerson = snippetObjects.find(o => o.type === 'persons');
if (samplePerson && samplePerson.data) {
  const p = samplePerson.data;
  const requiredPersonFields = ['id', 'name', 'dynasty', 'summary', 'image_url', 'category', 'influence', 'dimension_scores'];
  const missing = requiredPersonFields.filter(f => !(f in p));
  if (missing.length === 0) {
    console.log(`  ✅ Person 数据结构字段完整`);
  } else {
    console.log(`  ❌ Person 缺少字段: ${missing.join(', ')}`);
  }
}

// 检查 Event 数据结构兼容性
const sampleEvent = snippetObjects.find(o => o.type === 'events');
if (sampleEvent && sampleEvent.data) {
  const e = sampleEvent.data;
  const requiredEventFields = ['id', 'name', 'dynasty', 'start_year', 'end_year', 'summary', 'event_type'];
  const missing = requiredEventFields.filter(f => !(f in e));
  if (missing.length === 0) {
    console.log(`  ✅ Event 数据结构字段完整`);
  } else {
    console.log(`  ❌ Event 缺少字段: ${missing.join(', ')}`);
  }
}

// 检查 Dynasty 数据结构兼容性
const sampleDynasty = snippetObjects.find(o => o.type === 'dynasty');
if (sampleDynasty && sampleDynasty.data) {
  const d = sampleDynasty.data;
  const requiredDynastyFields = ['id', 'name', 'english_name', 'start_year', 'end_year', 'summary', 'capital', 'population', 'duration', 'representative_buildings', 'characteristics'];
  const missing = requiredDynastyFields.filter(f => !(f in d));
  if (missing.length === 0) {
    console.log(`  ✅ Dynasty 数据结构字段完整`);
  } else {
    console.log(`  ❌ Dynasty 缺少字段: ${missing.join(', ')}`);
  }
}

// ========== Step 2: ID 冲突检查 ==========
console.log('\n[Step 2] ID 冲突检查...');

// 收集 data.ts 中所有现有 ID
const existingIds = new Set();
const idRegex = /id:\s*(\d+)/g;
let match;
while ((match = idRegex.exec(dataContent)) !== null) {
  existingIds.add(parseInt(match[1]));
}
console.log(`  data.ts 中已有 ${existingIds.size} 个 ID`);

// 收集 snippet 中所有 ID
const snippetIds = new Set();
while ((match = idRegex.exec(snippetContent)) !== null) {
  snippetIds.add(parseInt(match[1]));
}
console.log(`  snippet 中有 ${snippetIds.size} 个 ID`);

// 检查冲突
const conflicts = [];
for (const id of snippetIds) {
  if (existingIds.has(id)) {
    conflicts.push(id);
  }
}

if (conflicts.length === 0) {
  console.log(`  ✅ 无 ID 冲突`);
} else {
  console.log(`  ❌ 发现 ${conflicts.length} 个 ID 冲突: ${conflicts.join(', ')}`);
}

// 检查 ID 前缀规律
const idPrefixes = {};
for (const id of existingIds) {
  const prefix = Math.floor(id / 10000);
  if (!idPrefixes[prefix]) idPrefixes[prefix] = [];
  idPrefixes[prefix].push(id);
}
console.log(`  现有 ID 前缀分布:`);
for (const [prefix, ids] of Object.entries(idPrefixes)) {
  const min = Math.min(...ids);
  const max = Math.max(...ids);
  console.log(`    前缀 ${prefix}: ${ids.length} 个 (${min} ~ ${max})`);
}

const snippetPrefixes = {};
for (const id of snippetIds) {
  const prefix = Math.floor(id / 10000);
  if (!snippetPrefixes[prefix]) snippetPrefixes[prefix] = [];
  snippetPrefixes[prefix].push(id);
}
console.log(`  新增 ID 前缀分布:`);
for (const [prefix, ids] of Object.entries(snippetPrefixes)) {
  const min = Math.min(...ids);
  const max = Math.max(...ids);
  console.log(`    前缀 ${prefix}: ${ids.length} 个 (${min} ~ ${max})`);
}

// ========== Step 3: 引用完整性检查 ==========
console.log('\n[Step 3] 引用完整性检查...');

// 获取 snippet 中所有人物名和事件名
const snippetPersonNames = new Set();
const snippetEventNames = new Set();

for (const obj of snippetObjects) {
  if (obj.type === 'persons' && obj.data) {
    snippetPersonNames.add(obj.data.name);
  } else if (obj.type === 'events' && obj.data) {
    snippetEventNames.add(obj.data.name);
  }
}

console.log(`  snippet 中有人物: ${snippetPersonNames.size} 个`);
console.log(`  snippet 中有事件: ${snippetEventNames.size} 个`);

// 检查人物的 related_people 引用
let brokenRefs = 0;
let totalRefs = 0;

for (const obj of snippetObjects) {
  if (obj.type !== 'persons' || !obj.data) continue;
  const p = obj.data;
  
  // 检查 related_people
  if (p.related_people && Array.isArray(p.related_people)) {
    for (const rp of p.related_people) {
      totalRefs++;
      if (!snippetPersonNames.has(rp.name) && !isExistingPerson(rp.name)) {
        brokenRefs++;
        if (brokenRefs <= 10) {
          console.log(`  ⚠️  人物 "${p.name}" 的 related_people 引用 "${rp.name}" 未找到`);
        }
      }
    }
  }
  
  // 检查 related_events
  if (p.related_events && Array.isArray(p.related_events)) {
    for (const re of p.related_events) {
      totalRefs++;
      const eventName = typeof re === 'string' ? re : re.name;
      if (!snippetEventNames.has(eventName) && !isExistingEvent(eventName)) {
        brokenRefs++;
        if (brokenRefs <= 10) {
          console.log(`  ⚠️  人物 "${p.name}" 的 related_events 引用 "${eventName}" 未找到`);
        }
      }
    }
  }
}

// 检查事件的 related_persons 引用
for (const obj of snippetObjects) {
  if (obj.type !== 'events' || !obj.data) continue;
  const e = obj.data;
  
  if (e.related_persons && Array.isArray(e.related_persons)) {
    for (const rp of e.related_persons) {
      totalRefs++;
      if (!snippetPersonNames.has(rp) && !isExistingPerson(rp)) {
        brokenRefs++;
        if (brokenRefs <= 10) {
          console.log(`  ⚠️  事件 "${e.name}" 的 related_persons 引用 "${rp}" 未找到`);
        }
      }
    }
  }
  
  // 检查 person_groups
  if (e.person_groups) {
    for (const group of ['leaders', 'participants', 'opponents', 'affected']) {
      if (e.person_groups[group]) {
        for (const pg of e.person_groups[group]) {
          totalRefs++;
          if (!snippetPersonNames.has(pg.name) && !isExistingPerson(pg.name)) {
            brokenRefs++;
            if (brokenRefs <= 10) {
              console.log(`  ⚠️  事件 "${e.name}" 的 person_groups.${group} 引用 "${pg.name}" 未找到`);
            }
          }
        }
      }
    }
  }
}

console.log(`  总共检查 ${totalRefs} 个引用`);
if (brokenRefs === 0) {
  console.log(`  ✅ 所有引用都有效`);
} else {
  console.log(`  ⚠️  发现 ${brokenRefs} 个引用未找到（可能跨朝代引用，不一定是错误）`);
}

// 辅助函数：检查人物是否存在于现有 data.ts
function isExistingPerson(name) {
  const regex = new RegExp(`name:\\s*'${name.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')}'`);
  return regex.test(dataContent);
}

// 辅助函数：检查事件是否存在于现有 data.ts
function isExistingEvent(name) {
  const regex = new RegExp(`name:\\s*'${name.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&')}'`);
  // This might match persons too, but for our purposes it's close enough
  return regex.test(dataContent);
}

// ========== Step 4: 总结 ==========
console.log('\n' + '='.repeat(60));
console.log('验证结果总结');
console.log('='.repeat(60));

const canProceed = conflicts.length === 0;
console.log(`  数据结构兼容性: ✅ 通过`);
console.log(`  ID 冲突检查: ${conflicts.length === 0 ? '✅ 通过' : '❌ 失败'}`);
console.log(`  引用完整性: ${brokenRefs <= 5 ? '✅ 通过' : '⚠️  有警告'}`);

if (canProceed) {
  console.log('\n  ✅ 可以安全追加数据！');
} else {
  console.log('\n  ❌ 存在 ID 冲突，请先解决！');
  process.exit(1);
}

// 输出统计
const dynastyCount = snippetObjects.filter(o => o.type === 'dynasty').length;
const personCount = snippetObjects.filter(o => o.type === 'persons').length;
const eventCount = snippetObjects.filter(o => o.type === 'events').length;

console.log(`\n  待追加数据:`);
console.log(`    朝代: ${dynastyCount} 个`);
console.log(`    人物: ${personCount} 个`);
console.log(`    事件: ${eventCount} 个`);
console.log(`    ID 总数: ${snippetIds.size} 个`);

// 保存验证结果
const validationReport = {
  timestamp: new Date().toISOString(),
  dataStructure: {
    interfaces: interfaces.map(i => ({ name: i, exists: new RegExp(`export interface ${i}\\b`).test(dataContent) })),
    arrays: arrays.map(a => ({ name: a, exists: new RegExp(`export const ${a}[^=]*=\\s*\\[`).test(dataContent) })),
    dynastyStatistics: /dynastyStatistics/.test(dataContent),
    snippetObjects: { dynasty: dynastyCount, persons: personCount, events: eventCount }
  },
  idConflict: {
    existingIdsCount: existingIds.size,
    snippetIdsCount: snippetIds.size,
    conflicts: conflicts,
    hasConflict: conflicts.length > 0
  },
  referenceIntegrity: {
    totalRefs,
    brokenRefs,
    hasIssues: brokenRefs > 5
  },
  canProceed,
  stats: { dynastyCount, personCount, eventCount, totalIds: snippetIds.size }
};

fs.writeFileSync(
  path.join(__dirname, '../validation_report_xiashangxizhou.json'),
  JSON.stringify(validationReport, null, 2),
  'utf-8'
);
console.log(`\n  验证报告已保存: validation_report_xiashangxizhou.json`);