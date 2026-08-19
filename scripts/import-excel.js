// Excel → 项目数据 导入工具
// 用法：node scripts/import-excel.js
// 配置在下面的 CONFIG 区域

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ==================== CONFIG 区域 ====================
// 修改这里的配置即可导入不同朝代
const CONFIG = {
  // 朝代信息
  dynastyId: 201,           // 朝代唯一 ID（不能与现有朝代冲突）
  dynastyName: '夏商西周',   // 朝代名称（用于数据过滤）
  dynastySlug: 'xiashangxizhou', // 英文名（用于生成 ID 前缀等）
  dynastyPrefix: 20,        // ID 前缀（2位数字，10=上古, 20=夏商西周, 30=汉, ...）
  
  // Excel 文件路径（相对于项目根目录）
  excelDir: 'd:/SHUMEI/GraduationProject',  // Excel 所在目录
  
  // 输出路径
  outputDir: 'd:/SHUMEI/GraduationProject',  // 输出目录
  outputSnippet: 'snippet_xiashangxizhou.ts', // 生成的代码片段文件名
  outputReport: 'import_report_xiashangxizhou.json', // 检查报告文件名
  
  // 朝代基础信息（这些字段 Excel 里没有，需要手动配置）
  dynastyInfo: {
    english_name: 'Xia-Shang-Western Zhou',
    start_year: -2070,
    end_year: -771,
    summary: '中国历史上的青铜时代，夏朝建立了中国第一个王朝，商朝创造了灿烂的青铜文明，西周实行分封制和宗法制，奠定了中国古代政治制度的基础。',
    capital: '阳城/亳/殷/镐京',
    population: '约数百万',
    duration: '约1300年',
    representative_buildings: ['二里头遗址', '殷墟', '周原遗址', '丰镐遗址'],
    characteristics: {
      politics: 80,
      culture: 85,
      military: 75,
      technology: 82,
      openness: 70
    }
  }
};
// ===================================================

// Excel 文件名
const FILES = {
  level1: '1级人物数据.xlsx',
  level2: '2级人物数据.xlsx',
  events: '事件数据.xlsx',
  relations: '人物关系表.xlsx',
  personEvent: '人事关系表.xlsx',
  keywords: '朝代热力图.xlsx'
};

// 类别映射
const CATEGORY_MAP = {
  '统治者': '统治者',
  '军事人物': '军事人物',
  '政治人物': '政治人物',
  '文化人物': '文化人物',
  '思想人物': '思想家',
  '科技人物': '科技人物',
  '外交人物': '外交人物',
  '民族领袖': '民族领袖'
};

// 关系类型映射
const RELATION_TYPE_MAP = {
  '对手': 'hostile',
  '敌对': 'hostile',
  '敌人': 'hostile',
  '盟友': 'alliance',
  '同盟': 'alliance',
  '君臣': 'lord_vassal',
  '父子': 'kinship',
  '兄弟': 'kinship',
  '夫妻': 'kinship',
  '宗族': 'kinship',
  '叔侄': 'kinship',
  '祖孙': 'kinship',
  '同僚': 'friend',
  '朋友': 'friend',
  '师徒': 'teacher_student',
  '师生': 'teacher_student',
  '下属': 'support',
  '支持': 'support'
};

// 事件类型映射
const EVENT_TYPE_MAP = {
  '战争军事': '战争军事',
  '政治事件': '政治事件',
  '政治复兴': '政治事件',
  '盛世发展': '盛世发展',
  '制度文化': '制度文化',
  '制度建设': '制度建设',
  '王朝灭亡': '王朝灭亡',
  '文化艺术': '文化艺术',
  '科技发明': '科技发明',
  '宗教信仰': '宗教信仰',
  '外交': '外交'
};

// 人事关系 → person_groups 分组映射
const PERSON_GROUP_MAP = {
  'leaders': ['胜利方', '主导者', '统治者', '中兴者', '制度建立者', '政权掌握者', '改革者'],
  'participants': ['参与者', '支持者', '谋臣', '辅政者', '重要将领', '军事人物', '军事将领', '制度推动者', '进谏者', '执行者', '功臣'],
  'opponents': ['失败方', '对立者', '叛乱者', '被驱逐者', '失势者', '末代君主'],
  'affected': ['受影响方', '王室人物', '宗室成员', '相关诸侯', '王后', '宫廷人物', '受封者', '政治参与者', '民众', '百姓']
};

// 关键词类别映射
const KW_CATEGORY_MAP = {
  '时代印象': 'era',
  '朝代特征': 'era',
  '人物': 'person',
  '历史事件': 'event',
  '事件': 'event',
  '制度': 'civilization',
  '制度文化': 'civilization',
  '文明': 'civilization',
  '文明起源': 'civilization',
  '思想文化': 'civilization',
  '哲学思想': 'civilization',
  '地理': 'geo',
  '地名': 'geo'
};

// 辅助函数：生成 ID
function genId(level, index) {
  // level: 1=1级人物, 2=2级人物, 4=事件
  return CONFIG.dynastyPrefix * 10000 + level * 1000 + index;
}

// 辅助函数：生成 image_url
function genImageUrl(name, id, type = 'person') {
  const prompt = type === 'person' 
    ? `ancient chinese historical figure ${name} traditional ink painting style portrait`
    : `ancient chinese historical event ${name} traditional ink painting style`;
  const size = type === 'person' ? 'portrait_3_4' : 'landscape_16_9';
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

// 辅助函数：解析年份字符串
function parseYear(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  
  // 处理 "约前XXXX" / "约前XX世纪" / "前XXXX"
  const match1 = s.match(/约?前?(\d+)(?:年|世纪)?/);
  if (match1) {
    let year = parseInt(match1[1]);
    if (s.includes('世纪')) {
      year = -(year * 100);
    } else {
      year = -year;
    }
    return year;
  }
  
  // 处理 "XXXX" (公元后)
  const match2 = s.match(/^(\d{3,4})年?/);
  if (match2) return parseInt(match2[1]);
  
  return null;
}

// 辅助函数：解析生卒年
function parseBirthDeath(birth, death) {
  const result = { birth: null, death: null };
  
  if (birth && birth !== '不详') {
    result.birth = parseYear(birth);
  }
  if (death && death !== '不详') {
    result.death = parseYear(death);
  }
  
  return result;
}

// 辅助函数：生成 dimension_scores
function genDimensionScores(category, influence) {
  const defaults = {
    '统治者': { historical: 95, relation: 88, prof1: 92, prof2: 85, prof3: 90 },
    '军事人物': { historical: 88, relation: 82, prof1: 90, prof2: 85, prof3: 80 },
    '政治人物': { historical: 88, relation: 85, prof1: 85, prof2: 90, prof3: 82 },
    '文化人物': { historical: 82, relation: 78, prof1: 80, prof2: 92, prof3: 88 },
    '思想家': { historical: 80, relation: 75, prof1: 85, prof2: 90, prof3: 95 },
    '科技人物': { historical: 85, relation: 72, prof1: 90, prof2: 85, prof3: 88 },
    '外交人物': { historical: 82, relation: 90, prof1: 88, prof2: 80, prof3: 78 },
    '民族领袖': { historical: 90, relation: 85, prof1: 88, prof2: 82, prof3: 85 }
  };
  
  const d = defaults[category] || { historical: 75, relation: 70, prof1: 80, prof2: 80, prof3: 80 };
  
  return {
    historical_influence: influence || d.historical,
    relation_activity: d.relation,
    professional_1: d.prof1,
    professional_2: d.prof2,
    professional_3: d.prof3
  };
}

// ===================================================
// 主导入逻辑
// ===================================================

const report = {
  dynasty: CONFIG.dynastyName,
  warnings: [],
  errors: [],
  stats: {
    level1Persons: 0,
    level2Persons: 0,
    events: 0,
    personRelations: 0,
    personEventRelations: 0,
    keywords: 0
  },
  idMapping: {
    persons: {},
    events: {}
  }
};

console.log('='.repeat(60));
console.log(`开始导入朝代数据: ${CONFIG.dynastyName}`);
console.log(`ID 前缀: ${CONFIG.dynastyPrefix}`);
console.log('='.repeat(60));

// Step 1: 读取 Excel 文件
console.log('\n[Step 1] 读取 Excel 文件...');

let level1Data = [], level2Data = [], eventsData = [], relationsData = [], personEventData = [], keywordsData = [];

try {
  const wb1 = XLSX.readFile(path.join(CONFIG.excelDir, FILES.level1));
  level1Data = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]]);
  console.log(`  ✅ 1级人物: ${level1Data.length} 条`);
} catch (e) {
  console.log(`  ❌ 读取 1级人物数据.xlsx 失败: ${e.message}`);
  report.errors.push('无法读取 1级人物数据.xlsx');
}

try {
  const wb2 = XLSX.readFile(path.join(CONFIG.excelDir, FILES.level2));
  level2Data = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]]);
  console.log(`  ✅ 2级人物: ${level2Data.length} 条`);
} catch (e) {
  console.log(`  ❌ 读取 2级人物数据.xlsx 失败: ${e.message}`);
  report.errors.push('无法读取 2级人物数据.xlsx');
}

try {
  const wb3 = XLSX.readFile(path.join(CONFIG.excelDir, FILES.events));
  eventsData = XLSX.utils.sheet_to_json(wb3.Sheets[wb3.SheetNames[0]]);
  console.log(`  ✅ 事件: ${eventsData.length} 条`);
} catch (e) {
  console.log(`  ❌ 读取 事件数据.xlsx 失败: ${e.message}`);
  report.errors.push('无法读取 事件数据.xlsx');
}

try {
  const wb4 = XLSX.readFile(path.join(CONFIG.excelDir, FILES.relations));
  relationsData = XLSX.utils.sheet_to_json(wb4.Sheets[wb4.SheetNames[0]]);
  console.log(`  ✅ 人物关系: ${relationsData.length} 条`);
} catch (e) {
  console.log(`  ❌ 读取 人物关系表.xlsx 失败: ${e.message}`);
  report.errors.push('无法读取 人物关系表.xlsx');
}

try {
  const wb5 = XLSX.readFile(path.join(CONFIG.excelDir, FILES.personEvent));
  personEventData = XLSX.utils.sheet_to_json(wb5.Sheets[wb5.SheetNames[0]]);
  console.log(`  ✅ 人事关系: ${personEventData.length} 条`);
} catch (e) {
  console.log(`  ❌ 读取 人事关系表.xlsx 失败: ${e.message}`);
  report.errors.push('无法读取 人事关系表.xlsx');
}

try {
  const wb6 = XLSX.readFile(path.join(CONFIG.excelDir, FILES.keywords));
  keywordsData = XLSX.utils.sheet_to_json(wb6.Sheets[wb6.SheetNames[0]]);
  console.log(`  ✅ 热力图关键词: ${keywordsData.length} 条`);
} catch (e) {
  console.log(`  ❌ 读取 朝代热力图.xlsx 失败: ${e.message}`);
  report.errors.push('无法读取 朝代热力图.xlsx');
}

// Step 2: 过滤当前朝代的数据
console.log('\n[Step 2] 过滤当前朝代数据...');

// 定义需要匹配的朝代值
const dynastyValues = [CONFIG.dynastyName];
if (CONFIG.dynastyName === '夏商西周') {
  dynastyValues.push('夏', '商', '西周', '夏→商', '商→西周');
}

const filteredLevel1 = level1Data.filter(r => dynastyValues.includes(r['朝代']));
const filteredLevel2 = level2Data.filter(r => dynastyValues.includes(r['朝代']));
const filteredEvents = eventsData.filter(r => dynastyValues.includes(r['朝代']));

console.log(`  1级人物: ${filteredLevel1.length} 条`);
console.log(`  2级人物: ${filteredLevel2.length} 条`);
console.log(`  事件: ${filteredEvents.length} 条`);

// Step 3: 生成人物数据
console.log('\n[Step 3] 生成人物数据...');

const persons = [];
let personIdIndex = 1;

// 处理 1级人物
for (const row of filteredLevel1) {
  const excelId = row['PersonID'];
  const numericId = genId(1, personIdIndex);
  
  // 记录 ID 映射
  report.idMapping.persons[excelId] = numericId;
  
  const { birth, death } = parseBirthDeath(row['生年'], row['卒年']);
  const category = CATEGORY_MAP[row['人物类型']] || '其他';
  const influence = row['历史影响力'] || 80;
  
  const person = {
    id: numericId,
    name: row['姓名'],
    dynasty: CONFIG.dynastyName,
    summary: row['人物简介'] || row['历史地位'] || '',
    image_url: genImageUrl(row['姓名'], numericId),
    birth_year: birth,
    death_year: death,
    category: category,
    level: 1,
    birth_place: row['出生地'] || null,
    occupations: row['身份'] ? [row['身份']] : [],
    works: [],
    related_people: [],
    life_events: [],
    related_events: [],
    influence: influence,
    dimension_scores: genDimensionScores(category, influence),
    story: undefined,
    narrative_relations: { nodes: [], edges: [] }
  };
  
  persons.push(person);
  report.stats.level1Persons++;
  personIdIndex++;
}

// 处理 2级人物
for (const row of filteredLevel2) {
  const excelId = row['SupportPersonID'];
  const numericId = genId(2, personIdIndex);
  
  report.idMapping.persons[excelId] = numericId;
  
  const category = CATEGORY_MAP[row['人物类型']] || '其他';
  
  const person = {
    id: numericId,
    name: row['姓名'],
    dynasty: CONFIG.dynastyName,
    summary: row['人物简介'] || '',
    image_url: genImageUrl(row['姓名'], numericId),
    birth_year: null,
    death_year: null,
    category: category,
    level: 2,
    birth_place: null,
    occupations: row['身份'] ? [row['身份']] : [],
    works: [],
    related_people: [],
    life_events: [],
    related_events: [],
    influence: 80,
    dimension_scores: genDimensionScores(category, 80),
    story: {
      title: `${row['姓名']}的故事`,
      content: `${row['姓名']}，是中国历史上重要的历史人物。${row['人物简介'] || ''}`,
      image_url: genImageUrl(row['姓名'], numericId)
    },
    narrative_relations: { nodes: [], edges: [] }
  };
  
  persons.push(person);
  report.stats.level2Persons++;
  personIdIndex++;
}

console.log(`  ✅ 生成 ${persons.length} 个人物 (${report.stats.level1Persons} 一级 + ${report.stats.level2Persons} 二级)`);

// 创建人物名→ID映射表
const personNameToId = {};
for (const p of persons) {
  personNameToId[p.name] = p.id;
}

// Step 4: 生成事件数据
console.log('\n[Step 4] 生成事件数据...');

const events = [];
let eventIdIndex = 1;

for (const row of filteredEvents) {
  const excelId = row['EventID'];
  const numericId = genId(4, eventIdIndex);
  
  report.idMapping.events[excelId] = numericId;
  
  const eventType = EVENT_TYPE_MAP[row['类型']] || '其他';
  const year = parseYear(row['发生时间']);
  
  const event = {
    id: numericId,
    name: row['事件名称'],
    dynasty: CONFIG.dynastyName,
    start_year: year || -1000,
    end_year: year || -1000,
    summary: row['简介'] || '',
    event_type: eventType,
    related_persons: [],
    significance: row['历史影响'] || '',
    image_url: genImageUrl(row['事件名称'], numericId, 'event'),
    one_sentence: (row['简介'] || '').slice(0, 50) + ((row['简介'] || '').length > 50 ? '...' : ''),
    person_groups: {
      leaders: [],
      participants: [],
      opponents: [],
      affected: []
    },
    narratives: [],
    background: {},
    impacts: [],
    chain: [],
    related_events: [],
    person_relations: []
  };
  
  events.push(event);
  report.stats.events++;
  eventIdIndex++;
}

console.log(`  ✅ 生成 ${events.length} 个事件`);

// 创建事件名→ID映射表
const eventNameToId = {};
for (const e of events) {
  eventNameToId[e.name] = e.id;
}

// Step 5: 聚合关系数据
console.log('\n[Step 5] 聚合关系数据...');

// 5a. 处理人物关系表 → Person.related_people
let relCount = 0;
for (const rel of relationsData) {
  const fromName = rel['起点人物'];
  const toName = rel['终点人物'];
  const relType = rel['关系类型'];
  
  const fromPerson = persons.find(p => p.name === fromName);
  const toPerson = persons.find(p => p.name === toName);
  
  if (!fromPerson) {
    report.warnings.push(`人物关系表: 起点人物 "${fromName}" 未在当前朝代中找到`);
    continue;
  }
  if (!toPerson) {
    report.warnings.push(`人物关系表: 终点人物 "${toName}" 未在当前朝代中找到`);
    continue;
  }
  
  const mappedType = RELATION_TYPE_MAP[relType] || 'support';
  
  // 双向添加
  if (!fromPerson.related_people) fromPerson.related_people = [];
  if (!toPerson.related_people) toPerson.related_people = [];
  
  // 检查是否已存在
  const exists1 = fromPerson.related_people.find(r => r.name === toName);
  if (!exists1) {
    fromPerson.related_people.push({
      name: toName,
      relation: mappedType,
      influence: 75
    });
  }
  
  const exists2 = toPerson.related_people.find(r => r.name === fromName);
  if (!exists2) {
    toPerson.related_people.push({
      name: fromName,
      relation: mappedType,
      influence: 75
    });
  }
  
  relCount++;
}
report.stats.personRelations = relCount;
console.log(`  ✅ 处理 ${relCount} 条人物关系`);

// 5b. 处理人事关系表 → Event.person_groups + Person.related_events
let peCount = 0;
for (const pe of personEventData) {
  const eventName = pe['事件'];
  const personName = pe['人物'];
  const relType = pe['人事关系类型'];
  
  const event = events.find(e => e.name === eventName);
  const person = persons.find(p => p.name === personName);
  
  if (!event) {
    report.warnings.push(`人事关系表: 事件 "${eventName}" 未在当前朝代中找到`);
    continue;
  }
  if (!person) {
    report.warnings.push(`人事关系表: 人物 "${personName}" 未在当前朝代中找到`);
    continue;
  }
  
  // 确定分组
  let groupKey = null;
  for (const [key, types] of Object.entries(PERSON_GROUP_MAP)) {
    if (types.includes(relType)) {
      groupKey = key;
      break;
    }
  }
  if (!groupKey) groupKey = 'participants';
  
  // 添加到 event.person_groups
  const group = event.person_groups[groupKey];
  const existing = group.find(p => p.name === personName);
  if (!existing) {
    group.push({ name: personName, role: relType });
  }
  
  // 添加到 event.related_persons
  if (!event.related_persons.includes(personName)) {
    event.related_persons.push(personName);
  }
  
  // 添加到 person.related_events
  if (!person.related_events) person.related_events = [];
  const hasEvent = person.related_events.find(re => 
    typeof re === 'string' ? re === eventName : re.name === eventName
  );
  if (!hasEvent) {
    person.related_events.push({ name: eventName, role: relType });
  }
  
  peCount++;
}
report.stats.personEventRelations = peCount;
console.log(`  ✅ 处理 ${peCount} 条人事关系`);

// 5c. 为事件添加 person_relations（事件中人物间的关系）
for (const event of events) {
  const allPersonNames = new Set();
  ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
    event.person_groups[key].forEach(p => allPersonNames.add(p.name));
  });
  
  const rels = [];
  for (const rel of relationsData) {
    const from = rel['起点人物'];
    const to = rel['终点人物'];
    if (allPersonNames.has(from) && allPersonNames.has(to)) {
      rels.push({
        source: from,
        target: to,
        type: RELATION_TYPE_MAP[rel['关系类型']] || 'support',
        desc: rel['关系说明'] || ''
      });
    }
  }
  event.person_relations = rels.slice(0, 5); // 最多5条
}

// Step 6: 处理关键词
console.log('\n[Step 6] 处理关键词...');

const filteredKeywords = keywordsData.filter(r => r['朝代'] === CONFIG.dynastyName);
const keywords = [];

for (const kw of filteredKeywords) {
  const name = kw['关键词'];
  const value = kw['权重（100）'] || 50;
  const category = KW_CATEGORY_MAP[kw['类别']] || 'era';
  
  keywords.push({
    name: name,
    value: value,
    category: category,
    desc: `${name}是${CONFIG.dynastyName}时期的重要概念。`
  });
}

report.stats.keywords = keywords.length;
console.log(`  ✅ 生成 ${keywords.length} 个关键词`);

// Step 7: 校验
console.log('\n[Step 7] 校验数据...');

// 检查重复 ID
const allIds = persons.map(p => p.id).concat(events.map(e => e.id));
const seenIds = new Set();
const dupIds = [];
for (const id of allIds) {
  if (seenIds.has(id)) {
    dupIds.push(id);
    report.errors.push(`重复 ID: ${id}`);
  }
  seenIds.add(id);
}

if (dupIds.length === 0) {
  console.log('  ✅ 无重复 ID');
} else {
  console.log(`  ❌ 发现 ${dupIds.length} 个重复 ID`);
}

// 检查缺失关键字段
for (const p of persons) {
  if (!p.name) {
    report.errors.push(`人物缺少姓名: id=${p.id}`);
  }
  if (!p.dynasty) {
    report.errors.push(`人物缺少朝代: id=${p.id}`);
  }
}

for (const e of events) {
  if (!e.name) {
    report.errors.push(`事件缺少名称: id=${e.id}`);
  }
  if (!e.dynasty) {
    report.errors.push(`事件缺少朝代: id=${e.id}`);
  }
}

console.log(`  ✅ 校验完成 (${report.errors.length} 错误, ${report.warnings.length} 警告)`);

// Step 8: 生成代码片段
console.log('\n[Step 8] 生成代码片段...');

let code = '';

// 朝代数据
code += `\n// =====================================================\n`;
code += `// ${CONFIG.dynastyName} 数据 (自动生成)\n`;
code += `// =====================================================\n\n`;

code += `// --- 朝代 ---\n`;
code += `{\n`;
code += `  id: ${CONFIG.dynastyId},\n`;
code += `  name: '${CONFIG.dynastyName}',\n`;
code += `  english_name: '${CONFIG.dynastyInfo.english_name}',\n`;
code += `  start_year: ${CONFIG.dynastyInfo.start_year},\n`;
code += `  end_year: ${CONFIG.dynastyInfo.end_year},\n`;
code += `  summary: '${CONFIG.dynastyInfo.summary.replace(/'/g, "\\'")}',\n`;
code += `  capital: '${CONFIG.dynastyInfo.capital}',\n`;
code += `  population: '${CONFIG.dynastyInfo.population}',\n`;
code += `  duration: '${CONFIG.dynastyInfo.duration}',\n`;
code += `  representative_buildings: ${JSON.stringify(CONFIG.dynastyInfo.representative_buildings)},\n`;
code += `  characteristics: ${JSON.stringify(CONFIG.dynastyInfo.characteristics)}\n`;
code += `},\n\n`;

// 人物数据
code += `// --- ${CONFIG.dynastyName}人物 (${persons.length}人) ---\n`;
for (const p of persons) {
  code += formatPerson(p) + ',\n';
}

// 事件数据
code += `\n// --- ${CONFIG.dynastyName}事件 (${events.length}个) ---\n`;
for (const e of events) {
  code += formatEvent(e) + ',\n';
}

// 关键词数据
code += `\n// --- ${CONFIG.dynastyName}关键词 (${keywords.length}个) ---\n`;
code += `// 添加到 Dynasty.vue 的 dynastyKeywords computed 中:\n`;
code += `// '${CONFIG.dynastyName}': ${JSON.stringify(keywords, null, 2)},\n\n`;

// 统计数据更新
code += `// --- 统计数据更新 ---\n`;
code += `// 在 dynastyStatistics.byDynasty 中添加:\n`;
code += `// { name: '${CONFIG.dynastyName}', value: 100, rate: 100, person_count: ${persons.length}, event_count: ${events.length}, work_count: 0, relation_count: ${report.stats.personRelations} },\n\n`;

fs.writeFileSync(path.join(CONFIG.outputDir, CONFIG.outputSnippet), code, 'utf-8');
console.log(`  ✅ 代码片段已保存: ${CONFIG.outputSnippet}`);

// Step 9: 生成检查报告
console.log('\n[Step 9] 生成检查报告...');

fs.writeFileSync(
  path.join(CONFIG.outputDir, CONFIG.outputReport),
  JSON.stringify(report, null, 2),
  'utf-8'
);
console.log(`  ✅ 检查报告已保存: ${CONFIG.outputReport}`);

// 最终汇总
console.log('\n' + '='.repeat(60));
console.log('📋 导入汇总');
console.log('='.repeat(60));
console.log(`朝代: ${CONFIG.dynastyName} (ID: ${CONFIG.dynastyId})`);
console.log(`1级人物: ${report.stats.level1Persons} 人`);
console.log(`2级人物: ${report.stats.level2Persons} 人`);
console.log(`事件: ${report.stats.events} 个`);
console.log(`人物关系: ${report.stats.personRelations} 条`);
console.log(`人事关系: ${report.stats.personEventRelations} 条`);
console.log(`关键词: ${report.stats.keywords} 个`);
console.log('='.repeat(60));

if (report.errors.length > 0) {
  console.log('\n❌ 发现错误:');
  report.errors.forEach(e => console.log(`  - ${e}`));
}
if (report.warnings.length > 0) {
  console.log('\n⚠️  警告:');
  report.warnings.forEach(w => console.log(`  - ${w}`));
}

console.log('\n✅ 导入完成！');
console.log('\n下一步操作：');
console.log(`1. 检查 ${CONFIG.outputReport} 中的报告`);
console.log(`2. 将 ${CONFIG.outputSnippet} 的内容追加到 mock/data.ts 末尾`);
console.log(`3. 在 Dynasty.vue 的 dynastyKeywords 中添加关键词配置`);
console.log(`4. 在 Dynasty.vue 的 chinaMapData 中添加地图配置`);
console.log(`5. 在 Timeline.vue 中启用该朝代节点`);

// ===================================================
// 格式化函数
// ===================================================

function formatPerson(p) {
  let s = '{\n';
  s += `    id: ${p.id},\n`;
  s += `    name: '${p.name.replace(/'/g, "\\'")}',\n`;
  s += `    dynasty: '${p.dynasty}',\n`;
  s += `    summary: '${(p.summary || '').replace(/'/g, "\\'")}',\n`;
  s += `    image_url: '${p.image_url}',\n`;
  s += `    birth_year: ${p.birth_year === null ? 'null' : p.birth_year},\n`;
  s += `    death_year: ${p.death_year === null ? 'null' : p.death_year},\n`;
  s += `    category: '${p.category}',\n`;
  s += `    level: ${p.level},\n`;
  if (p.birth_place) {
    s += `    birth_place: '${p.birth_place.replace(/'/g, "\\'")}',\n`;
  }
  if (p.occupations && p.occupations.length > 0) {
    s += `    occupations: ${JSON.stringify(p.occupations)},\n`;
  }
  if (p.works && p.works.length > 0) {
    s += `    works: ${JSON.stringify(p.works)},\n`;
  }
  if (p.related_people && p.related_people.length > 0) {
    s += `    related_people: ${JSON.stringify(p.related_people)},\n`;
  }
  if (p.related_events && p.related_events.length > 0) {
    s += `    related_events: ${JSON.stringify(p.related_events)},\n`;
  }
  s += `    influence: ${p.influence},\n`;
  s += `    dimension_scores: ${JSON.stringify(p.dimension_scores)},\n`;
  if (p.story) {
    s += `    story: ${JSON.stringify(p.story)},\n`;
  }
  s += `    narrative_relations: ${JSON.stringify(p.narrative_relations)}\n`;
  s += `  }`;
  return s;
}

function formatEvent(e) {
  let s = '{\n';
  s += `    id: ${e.id},\n`;
  s += `    name: '${e.name.replace(/'/g, "\\'")}',\n`;
  s += `    dynasty: '${e.dynasty}',\n`;
  s += `    start_year: ${e.start_year},\n`;
  s += `    end_year: ${e.end_year},\n`;
  s += `    summary: '${(e.summary || '').replace(/'/g, "\\'")}',\n`;
  s += `    event_type: '${e.event_type}',\n`;
  if (e.related_persons && e.related_persons.length > 0) {
    s += `    related_persons: ${JSON.stringify(e.related_persons)},\n`;
  }
  if (e.significance) {
    s += `    significance: '${e.significance.replace(/'/g, "\\'")}',\n`;
  }
  s += `    image_url: '${e.image_url}',\n`;
  if (e.one_sentence) {
    s += `    one_sentence: '${e.one_sentence.replace(/'/g, "\\'")}',\n`;
  }
  s += `    person_groups: ${JSON.stringify(e.person_groups)},\n`;
  s += `    narratives: ${JSON.stringify(e.narratives)},\n`;
  s += `    background: ${JSON.stringify(e.background)},\n`;
  s += `    impacts: ${JSON.stringify(e.impacts)},\n`;
  s += `    chain: ${JSON.stringify(e.chain)},\n`;
  s += `    related_events: ${JSON.stringify(e.related_events)},\n`;
  s += `    person_relations: ${JSON.stringify(e.person_relations)}\n`;
  s += `  }`;
  return s;
}
