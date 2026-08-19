// Excel → 前端数据 JSON 导入管线
// 用法: node scripts/import-dynasty.js --dynasty=夏商西周
// 安全机制: 只创建新文件，不修改任何已有文件

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ==================== 安全检查 ====================
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');

// ==================== 配置 ====================
const DYNASTY_CONFIGS = {
  '夏商西周': {
    id: 201,
    prefix: 20,
    english_name: 'Xia-Shang-Western Zhou',
    start_year: -2070,
    end_year: -771,
    summary: '中国历史上的青铜时代，夏朝建立了中国第一个王朝，商朝创造了灿烂的青铜文明，西周实行分封制和宗法制，奠定了中国古代政治制度的基础。',
    capital: '阳城/亳/殷/镐京',
    population: '约数百万',
    duration: '约1300年',
    representative_buildings: ['二里头遗址', '殷墟', '周原遗址', '丰镐遗址'],
    characteristics: { politics: 80, culture: 85, military: 75, technology: 82, openness: 70 }
  }
};

const FILES = {
  level1: '1级人物数据.xlsx',
  level2: '2级人物数据.xlsx',
  events: '事件数据.xlsx',
  relations: '人物关系表.xlsx',
  personEvent: '人事关系表.xlsx',
  keywords: '朝代热力图.xlsx'
};

const CATEGORY_MAP = {
  '统治者': '统治者', '军事人物': '军事人物', '政治人物': '政治人物',
  '文化人物': '文化人物', '思想人物': '思想家', '科技人物': '科技人物',
  '外交人物': '外交人物', '民族领袖': '民族领袖'
};

const RELATION_TYPE_MAP = {
  '对手': 'hostile', '敌对': 'hostile', '敌人': 'hostile',
  '盟友': 'alliance', '同盟': 'alliance',
  '君臣': 'lord_vassal',
  '父子': 'kinship', '兄弟': 'kinship', '夫妻': 'kinship',
  '宗族': 'kinship', '叔侄': 'kinship', '祖孙': 'kinship',
  '同僚': 'friend', '朋友': 'friend',
  '师徒': 'teacher_student', '师生': 'teacher_student',
  '下属': 'support', '支持': 'support'
};

const EVENT_TYPE_MAP = {
  '战争军事': '战争军事', '政治事件': '政治事件', '政治复兴': '政治事件',
  '盛世发展': '盛世发展', '制度文化': '制度文化', '制度建设': '制度建设',
  '王朝灭亡': '王朝灭亡', '文化艺术': '文化艺术', '科技发明': '科技发明',
  '宗教信仰': '宗教信仰', '外交': '外交'
};

const PERSON_GROUP_MAP = {
  'leaders': ['胜利方', '主导者', '统治者', '中兴者', '制度建立者', '政权掌握者', '改革者'],
  'participants': ['参与者', '支持者', '谋臣', '辅政者', '重要将领', '军事人物', '军事将领', '制度推动者', '进谏者', '执行者', '功臣'],
  'opponents': ['失败方', '对立者', '叛乱者', '被驱逐者', '失势者', '末代君主'],
  'affected': ['受影响方', '王室人物', '宗室成员', '相关诸侯', '王后', '宫廷人物', '受封者', '政治参与者', '民众', '百姓']
};

const KW_CATEGORY_MAP = {
  '时代印象': 'era', '朝代特征': 'era',
  '人物': 'person',
  '历史事件': 'event', '事件': 'event',
  '制度': 'civilization', '制度文化': 'civilization',
  '文明': 'civilization', '文明起源': 'civilization',
  '思想文化': 'civilization', '哲学思想': 'civilization',
  '地理': 'geo', '地名': 'geo'
};

// ==================== 工具函数 ====================
function genId(level, index, prefix) {
  return prefix * 10000 + level * 1000 + index;
}

function parseYear(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim();
  const match1 = s.match(/约?前?(\d+)(?:年|世纪)?/);
  if (match1) {
    let year = parseInt(match1[1]);
    if (s.includes('世纪')) year = -(year * 100);
    else year = -year;
    return year;
  }
  const match2 = s.match(/^(\d{3,4})年?/);
  if (match2) return parseInt(match2[1]);
  return null;
}

function parseBirthDeath(birth, death) {
  const result = { birth: null, death: null };
  if (birth && birth !== '不详') result.birth = parseYear(birth);
  if (death && death !== '不详') result.death = parseYear(death);
  return result;
}

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

// ==================== 主逻辑 ====================
async function main() {
  // 解析参数
  const args = process.argv.slice(2);
  const dynastyArg = args.find(a => a.startsWith('--dynasty='))?.split('=')[1];
  
  if (!dynastyArg) {
    console.error('❌ 请指定朝代: node scripts/import-dynasty.js --dynasty=夏商西周');
    console.error('   可用朝代:', Object.keys(DYNASTY_CONFIGS).join(', '));
    process.exit(1);
  }

  const config = DYNASTY_CONFIGS[dynastyArg];
  if (!config) {
    console.error(`❌ 未知朝代: ${dynastyArg}`);
    console.error('   可用朝代:', Object.keys(DYNASTY_CONFIGS).join(', '));
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log(`📥 开始导入: ${dynastyArg} (ID: ${config.id})`);
  console.log('='.repeat(60));

  // 安全检查：目标文件是否已存在
  const targetFile = path.join(OUTPUT_DIR, `dynasty_${config.id}.json`);
  if (fs.existsSync(targetFile)) {
    console.error(`\n⚠️  安全保护: 目标文件已存在！`);
    console.error(`   ${targetFile}`);
    console.error(`   如需重新生成，请先手动删除该文件。`);
    console.error(`   这是为了防止误覆盖已有朝代数据。`);
    process.exit(1);
  }

  // Step 1: 读取 Excel
  console.log('\n[1/7] 读取 Excel 文件...');
  const excelDir = path.join(__dirname, '..');
  let level1Data = [], level2Data = [], eventsData = [], relationsData = [], personEventData = [], keywordsData = [];

  try { level1Data = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(excelDir, FILES.level1)).Sheets[XLSX.readFile(path.join(excelDir, FILES.level1)).SheetNames[0]]); } catch (e) { console.log('  ⚠️  跳过 1级人物:', e.message); }
  try { level2Data = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(excelDir, FILES.level2)).Sheets[XLSX.readFile(path.join(excelDir, FILES.level2)).SheetNames[0]]); } catch (e) { console.log('  ⚠️  跳过 2级人物:', e.message); }
  try { eventsData = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(excelDir, FILES.events)).Sheets[XLSX.readFile(path.join(excelDir, FILES.events)).SheetNames[0]]); } catch (e) { console.log('  ⚠️  跳过 事件:', e.message); }
  try { relationsData = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(excelDir, FILES.relations)).Sheets[XLSX.readFile(path.join(excelDir, FILES.relations)).SheetNames[0]]); } catch (e) { console.log('  ⚠️  跳过 人物关系:', e.message); }
  try { personEventData = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(excelDir, FILES.personEvent)).Sheets[XLSX.readFile(path.join(excelDir, FILES.personEvent)).SheetNames[0]]); } catch (e) { console.log('  ⚠️  跳过 人事关系:', e.message); }
  try { keywordsData = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(excelDir, FILES.keywords)).Sheets[XLSX.readFile(path.join(excelDir, FILES.keywords)).SheetNames[0]]); } catch (e) { console.log('  ⚠️  跳过 关键词:', e.message); }

  console.log(`  原始数据: 1级${level1Data.length}条, 2级${level2Data.length}条, 事件${eventsData.length}条`);

  // Step 2: 过滤当前朝代
  console.log('\n[2/7] 过滤朝代数据...');
  const dynastyValues = [dynastyArg];
  if (dynastyArg === '夏商西周') {
    dynastyValues.push('夏', '商', '西周', '夏→商', '商→西周', '商末周初');
  }
  
  const filteredLevel1 = level1Data.filter(r => dynastyValues.includes(r['朝代']));
  const filteredLevel2 = level2Data.filter(r => dynastyValues.includes(r['朝代']));
  const filteredEvents = eventsData.filter(r => dynastyValues.includes(r['朝代']));
  const filteredPersonEvent = personEventData.filter(r => {
    if (!r['朝代']) return true;
    return dynastyValues.includes(r['朝代']) || r['朝代'] === dynastyArg;
  });

  console.log(`  过滤后: 1级${filteredLevel1.length}条, 2级${filteredLevel2.length}条, 事件${filteredEvents.length}条`);

  // Step 3: 生成人物
  console.log('\n[3/7] 生成人物数据...');
  const persons = [];
  let idIndex = 1;

  for (const row of filteredLevel1) {
    const numericId = genId(1, idIndex, config.prefix);
    const { birth, death } = parseBirthDeath(row['生年'], row['卒年']);
    const category = CATEGORY_MAP[row['人物类型']] || '其他';
    const influence = row['历史影响力'] || 80;
    
    persons.push({
      id: numericId,
      name: row['姓名'],
      dynasty: dynastyArg,
      summary: row['人物简介'] || row['历史地位'] || '',
      image_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20historical%20figure%20${encodeURIComponent(row['姓名'])}%20traditional%20ink%20painting%20style%20portrait&image_size=square`,
      birth_year: birth,
      death_year: death,
      category,
      level: 1,
      birth_place: row['出生地'] || null,
      occupations: row['身份'] ? [row['身份']] : [],
      works: [],
      related_people: [],
      life_events: [],
      related_events: [],
      influence,
      dimension_scores: genDimensionScores(category, influence),
      narrative_relations: { nodes: [], edges: [] }
    });
    idIndex++;
  }

  for (const row of filteredLevel2) {
    const numericId = genId(2, idIndex, config.prefix);
    const category = CATEGORY_MAP[row['人物类型']] || '其他';
    
    persons.push({
      id: numericId,
      name: row['姓名'],
      dynasty: dynastyArg,
      summary: row['人物简介'] || '',
      image_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20historical%20figure%20${encodeURIComponent(row['姓名'])}%20traditional%20ink%20painting%20style%20portrait&image_size=square`,
      birth_year: null,
      death_year: null,
      category,
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
        content: `${row['姓名']}，是${dynastyArg}时期重要的历史人物。${row['人物简介'] || ''}`,
        image_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20historical%20figure%20${encodeURIComponent(row['姓名'])}%20story%20scene%20traditional%20chinese%20painting&image_size=landscape_16_9`
      },
      narrative_relations: { nodes: [], edges: [] }
    });
    idIndex++;
  }

  console.log(`  ✅ 生成 ${persons.length} 个人物`);

  // 建立索引
  const personNameToId = {};
  for (const p of persons) personNameToId[p.name] = p.id;

  // Step 4: 生成事件
  console.log('\n[4/7] 生成事件数据...');
  const events = [];
  let eventIdIndex = 1;

  for (const row of filteredEvents) {
    const numericId = genId(4, eventIdIndex, config.prefix);
    const eventType = EVENT_TYPE_MAP[row['类型']] || '其他';
    const year = parseYear(row['发生时间']) || -1000;
    
    events.push({
      id: numericId,
      name: row['事件名称'],
      dynasty: dynastyArg,
      start_year: year,
      end_year: year,
      summary: row['简介'] || '',
      event_type: eventType,
      related_persons: [],
      significance: row['历史影响'] || '',
      image_url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ancient%20chinese%20historical%20event%20${encodeURIComponent(row['事件名称'])}%20traditional%20ink%20painting%20style&image_size=landscape_16_9`,
      one_sentence: (row['简介'] || '').slice(0, 50) + ((row['简介'] || '').length > 50 ? '...' : ''),
      person_groups: { leaders: [], participants: [], opponents: [], affected: [] },
      narratives: [],
      background: {},
      impacts: [],
      chain: [],
      related_events: [],
      person_relations: []
    });
    eventIdIndex++;
  }

  console.log(`  ✅ 生成 ${events.length} 个事件`);

  const eventNameToId = {};
  for (const e of events) eventNameToId[e.name] = e.id;

  // Step 5: 聚合关系
  console.log('\n[5/7] 聚合关系数据...');
  let relCount = 0;
  for (const rel of relationsData) {
    const fromName = rel['起点人物'];
    const toName = rel['终点人物'];
    const mappedType = RELATION_TYPE_MAP[rel['关系类型']] || 'support';
    
    const fromPerson = persons.find(p => p.name === fromName);
    const toPerson = persons.find(p => p.name === toName);
    if (!fromPerson || !toPerson) continue;

    fromPerson.related_people = fromPerson.related_people || [];
    toPerson.related_people = toPerson.related_people || [];
    
    if (!fromPerson.related_people.find(r => r.name === toName)) {
      fromPerson.related_people.push({ name: toName, relation: mappedType, influence: 75 });
    }
    if (!toPerson.related_people.find(r => r.name === fromName)) {
      toPerson.related_people.push({ name: fromName, relation: mappedType, influence: 75 });
    }
    relCount++;
  }

  let peCount = 0;
  for (const pe of filteredPersonEvent) {
    const eventName = pe['事件'];
    const personName = pe['人物'];
    const relType = pe['人事关系类型'];
    
    const event = events.find(e => e.name === eventName);
    const person = persons.find(p => p.name === personName);
    if (!event || !person) continue;

    let groupKey = null;
    for (const [key, types] of Object.entries(PERSON_GROUP_MAP)) {
      if (types.includes(relType)) { groupKey = key; break; }
    }
    if (!groupKey) groupKey = 'participants';

    const group = event.person_groups[groupKey];
    if (!group.find(p => p.name === personName)) {
      group.push({ name: personName, role: relType });
    }
    if (!event.related_persons.includes(personName)) {
      event.related_persons.push(personName);
    }
    person.related_events = person.related_events || [];
    if (!person.related_events.find(re => typeof re === 'string' ? re === eventName : re.name === eventName)) {
      person.related_events.push({ name: eventName, role: relType });
    }
    peCount++;
  }

  // 为事件添加 person_relations
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
    event.person_relations = rels.slice(0, 5);
  }

  console.log(`  ✅ 人物关系 ${relCount} 条, 人事关系 ${peCount} 条`);

  // Step 6: 处理关键词
  console.log('\n[6/7] 处理关键词...');
  const filteredKeywords = keywordsData.filter(r => r['朝代'] === dynastyArg);
  const keywords = filteredKeywords.map(kw => ({
    name: kw['关键词'],
    value: kw['权重（100）'] || 50,
    category: KW_CATEGORY_MAP[kw['类别']] || 'era',
    desc: `${kw['关键词']}是${dynastyArg}时期的重要概念。`
  }));
  console.log(`  ✅ 生成 ${keywords.length} 个关键词`);

  // Step 7: 生成 JSON 并写入
  console.log('\n[7/7] 生成 JSON 文件...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const output = {
    dynasty: {
      id: config.id,
      name: dynastyArg,
      english_name: config.english_name,
      start_year: config.start_year,
      end_year: config.end_year,
      summary: config.summary,
      capital: config.capital,
      population: config.population,
      duration: config.duration,
      representative_buildings: config.representative_buildings,
      characteristics: config.characteristics
    },
    persons,
    events,
    keywords,
    _meta: {
      imported_at: new Date().toISOString(),
      source_files: [FILES.level1, FILES.level2, FILES.events, FILES.relations, FILES.personEvent, FILES.keywords],
      stats: {
        persons: persons.length,
        events: events.length,
        person_relations: relCount,
        person_event_relations: peCount,
        keywords: keywords.length
      }
    }
  };

  fs.writeFileSync(targetFile, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 导入完成！`);
  console.log(`${'='.repeat(60)}`);
  console.log(`朝代: ${dynastyArg}`);
  console.log(`输出: ${targetFile}`);
  console.log(`人物: ${persons.length} 个`);
  console.log(`事件: ${events.length} 个`);
  console.log(`关系: ${relCount + peCount} 条`);
  console.log(`关键词: ${keywords.length} 个`);
  console.log(`\n🎉 现在可以解锁 Timeline 按钮来预览效果了！`);
}

main().catch(err => {
  console.error('❌ 导入失败:', err);
  process.exit(1);
});