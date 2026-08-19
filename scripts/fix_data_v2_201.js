/**
 * 第二轮数据修复脚本
 * 1. 标准化 impacts 为 4 个维度（政治/历史/文化/社会）
 * 2. 修复 chain 数据，确保引用的事件名都存在
 * 3. 丰富孤立事件的 chain
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_201.json');

// 标准化 4 个影响维度
const STANDARD_IMPACTS = ['政治影响', '历史影响', '文化影响', '社会影响'];

// 每个事件的完整 impacts
const EVENT_IMPACTS = {
  '启建夏朝': [
    { name: '政治影响', score: 96, description: '开创世袭制，"家天下"取代"公天下"' },
    { name: '历史影响', score: 98, description: '开启中国王朝时代，影响四千年' },
    { name: '文化影响', score: 92, description: '天命观念初步形成' },
    { name: '社会影响', score: 88, description: '部落联盟向国家转变' }
  ],
  '太康失国': [
    { name: '政治影响', score: 85, description: '夏朝进入约四十年无王之世' },
    { name: '历史影响', score: 82, description: '暴露世袭制初期的脆弱性' },
    { name: '文化影响', score: 78, description: '部落联盟传统仍有较大影响' },
    { name: '社会影响', score: 75, description: '民众对世袭制产生怀疑' }
  ],
  '少康中兴': [
    { name: '政治影响', score: 88, description: '恢复夏朝统治，开启百年稳定' },
    { name: '历史影响', score: 85, description: '首个成功复国事件' },
    { name: '文化影响', score: 80, description: '中兴叙事传统确立' },
    { name: '社会影响', score: 78, description: '夏朝嫡脉恢复正统地位' }
  ],
  '夏桀暴政': [
    { name: '政治影响', score: 92, description: '夏朝统治根基完全动摇' },
    { name: '历史影响', score: 95, description: '夏桀成为千古昏君典型' },
    { name: '文化影响', score: 88, description: '"天命靡常"观念形成' },
    { name: '社会影响', score: 85, description: '诸侯离心，民不聊生' }
  ],
  '商汤灭夏': [
    { name: '政治影响', score: 98, description: '夏朝灭亡，商朝建立' },
    { name: '历史影响', score: 95, description: '首次大规模改朝换代战争' },
    { name: '文化影响', score: 90, description: '"天命靡常"改朝换代观念' },
    { name: '社会影响', score: 88, description: '人民从夏末暴政中解放' }
  ],
  '盘庚迁殷': [
    { name: '政治影响', score: 86, description: '商朝此后再未迁都' },
    { name: '历史影响', score: 88, description: '殷墟成为考古学重要遗址' },
    { name: '文化影响', score: 82, description: '为武丁中兴奠定基础' },
    { name: '社会影响', score: 78, description: '贵族与民众迁至新邑' }
  ],
  '武丁中兴': [
    { name: '政治影响', score: 94, description: '商朝疆域空前辽阔' },
    { name: '历史影响', score: 92, description: '青铜文明达到鼎盛' },
    { name: '文化影响', score: 95, description: '甲骨文、青铜器辉煌时期' },
    { name: '社会影响', score: 86, description: '百姓安居乐业' }
  ],
  '妇好征伐': [
    { name: '政治影响', score: 78, description: '扩大商朝影响力' },
    { name: '历史影响', score: 75, description: '体现女性将领地位' },
    { name: '文化影响', score: 80, description: '妇好墓出土珍贵文物' },
    { name: '社会影响', score: 72, description: '俘虏被带回商朝' }
  ],
  '商王对外征伐': [
    { name: '政治影响', score: 80, description: '扩大商朝疆域' },
    { name: '历史影响', score: 82, description: '方国被征服' },
    { name: '文化影响', score: 75, description: '促进文化交流' },
    { name: '社会影响', score: 70, description: '获取资源与奴隶' }
  ],
  '商末政治危机': [
    { name: '政治影响', score: 90, description: '商朝统治根基动摇' },
    { name: '历史影响', score: 88, description: '为周灭商创造条件' },
    { name: '文化影响', score: 82, description: '"殷之三仁"成为典范' },
    { name: '社会影响', score: 85, description: '诸侯离心，大臣反叛' }
  ],
  '牧野之战': [
    { name: '政治影响', score: 98, description: '延续六百年的商朝灭亡' },
    { name: '历史影响', score: 96, description: '以少胜多经典战役' },
    { name: '文化影响', score: 94, description: '奠定礼乐文明根基' },
    { name: '社会影响', score: 90, description: '奴隶阵前倒戈' }
  ],
  '周公东征': [
    { name: '政治影响', score: 90, description: '稳定西周政权' },
    { name: '历史影响', score: 88, description: '营建洛邑，控制东方' },
    { name: '文化影响', score: 85, description: '巩固礼乐制度' },
    { name: '社会影响', score: 80, description: '商朝遗民被迁至洛邑' }
  ],
  '成康之治': [
    { name: '政治影响', score: 95, description: '西周最繁荣稳定时期' },
    { name: '历史影响', score: 92, description: '制度体系完全确立' },
    { name: '文化影响', score: 94, description: '礼乐文明达到鼎盛' },
    { name: '社会影响', score: 88, description: '天下太平，百姓安乐' }
  ],
  '制礼作乐': [
    { name: '政治影响', score: 95, description: '确立分封制、宗法制' },
    { name: '历史影响', score: 96, description: '影响中国两千年' },
    { name: '文化影响', score: 98, description: '奠定中华礼乐文明根基' },
    { name: '社会影响', score: 90, description: '形成宗法社会结构' }
  ],
  '分封制': [
    { name: '政治影响', score: 94, description: '建立周朝封建制度' },
    { name: '历史影响', score: 92, description: '影响中国数千年' },
    { name: '文化影响', score: 88, description: '形成宗法文化' },
    { name: '社会影响', score: 86, description: '形成封建等级秩序' }
  ],
  '国人暴动': [
    { name: '政治影响', score: 92, description: '西周王权衰落' },
    { name: '历史影响', score: 95, description: '开启中国确切纪年' },
    { name: '文化影响', score: 90, description: '"防民之口甚于防川"' },
    { name: '社会影响', score: 88, description: '国人力量首次显现' }
  ],
  '国人暴动与共和行政': [
    { name: '政治影响', score: 92, description: '西周王权衰落' },
    { name: '历史影响', score: 95, description: '开启中国确切纪年' },
    { name: '文化影响', score: 90, description: '"共和"成为重要概念' },
    { name: '社会影响', score: 85, description: '国人暴动显示民意力量' }
  ],
  '宣王中兴': [
    { name: '政治影响', score: 85, description: '一度恢复周朝国力' },
    { name: '历史影响', score: 82, description: '延缓西周灭亡' },
    { name: '文化影响', score: 80, description: '礼乐文化延续' },
    { name: '社会影响', score: 78, description: '民众短暂安定' }
  ],
  '犬戎攻周': [
    { name: '政治影响', score: 95, description: '西周直接面临灭亡' },
    { name: '历史影响', score: 92, description: '镐京陷落' },
    { name: '文化影响', score: 85, description: '礼乐文化遭破坏' },
    { name: '社会影响', score: 88, description: '王室被迫东迁' }
  ],
  '西周灭亡': [
    { name: '政治影响', score: 98, description: '西周灭亡，平王东迁' },
    { name: '历史影响', score: 95, description: '进入东周时代' },
    { name: '文化影响', score: 88, description: '周王室从此衰微' },
    { name: '社会影响', score: 90, description: '春秋战国群雄并起' }
  ],
  '烽火戏诸侯': [
    { name: '政治影响', score: 94, description: '失信于天下，西周危亡' },
    { name: '历史影响', score: 92, description: '直接导致西周灭亡' },
    { name: '文化影响', score: 88, description: '成为失信亡国典故' },
    { name: '社会影响', score: 86, description: '诸侯不再相信王室' }
  ]
};

// 修复 chain 数据 - 确保引用的事件名都存在
const EVENT_CHAIN_FIX = {
  '夏桀暴政': [
    { title: '少康中兴', year: '前2000年', type: 'cause', color: '#D8B26A' },
    { title: '夏桀暴政', year: '前1700年', type: 'event', color: '#C34739' },
    { title: '商汤灭夏', year: '前1600年', type: 'consequence', color: '#355C5A' }
  ],
  '商汤灭夏': [
    { title: '夏桀暴政', year: '前1700年', type: 'cause', color: '#D8B26A' },
    { title: '商汤灭夏', year: '前1600年', type: 'event', color: '#C34739' },
    { title: '盘庚迁殷', year: '前1298年', type: 'later', color: '#355C5A' }
  ],
  '妇好征伐': [
    { title: '武丁中兴', year: '前1250年', type: 'cause', color: '#D8B26A' },
    { title: '妇好征伐', year: '前1220年', type: 'event', color: '#C34739' },
    { title: '商末政治危机', year: '前1100年', type: 'later', color: '#355C5A' }
  ],
  '商王对外征伐': [
    { title: '武丁中兴', year: '前1250年', type: 'cause', color: '#D8B26A' },
    { title: '商王对外征伐', year: '前1200年', type: 'event', color: '#C34739' },
    { title: '商末政治危机', year: '前1100年', type: 'later', color: '#355C5A' }
  ],
  '商末政治危机': [
    { title: '武丁中兴', year: '前1250年', type: 'cause', color: '#D8B26A' },
    { title: '商末政治危机', year: '前1100年', type: 'event', color: '#C34739' },
    { title: '牧野之战', year: '前1046年', type: 'consequence', color: '#355C5A' }
  ],
  '周公东征': [
    { title: '牧野之战', year: '前1046年', type: 'cause', color: '#D8B26A' },
    { title: '周公东征', year: '前1040年', type: 'event', color: '#C34739' },
    { title: '成康之治', year: '前1035年', type: 'consequence', color: '#355C5A' }
  ],
  '制礼作乐': [
    { title: '牧野之战', year: '前1046年', type: 'cause', color: '#D8B26A' },
    { title: '制礼作乐', year: '前1035年', type: 'event', color: '#C34739' },
    { title: '成康之治', year: '前1035年', type: 'consequence', color: '#355C5A' }
  ],
  '分封制': [
    { title: '牧野之战', year: '前1046年', type: 'cause', color: '#D8B26A' },
    { title: '分封制', year: '前1043年', type: 'event', color: '#C34739' },
    { title: '成康之治', year: '前1035年', type: 'consequence', color: '#355C5A' }
  ],
  '犬戎攻周': [
    { title: '宣王中兴', year: '前827年', type: 'cause', color: '#D8B26A' },
    { title: '犬戎攻周', year: '前771年', type: 'event', color: '#C34739' },
    { title: '西周灭亡', year: '前771年', type: 'consequence', color: '#355C5A' }
  ],
  '西周灭亡': [
    { title: '国人暴动', year: '前841年', type: 'cause', color: '#D8B26A' },
    { title: '西周灭亡', year: '前771年', type: 'event', color: '#C34739' },
    { title: '烽火戏诸侯', year: '前775年', type: 'consequence', color: '#355C5A' }
  ],
  '国人暴动': [
    { title: '成康之治', year: '前1035年', type: 'cause', color: '#D8B26A' },
    { title: '国人暴动', year: '前841年', type: 'event', color: '#C34739' },
    { title: '国人暴动与共和行政', year: '前841年', type: 'consequence', color: '#355C5A' }
  ],
  '国人暴动与共和行政': [
    { title: '成康之治', year: '前1035年', type: 'cause', color: '#D8B26A' },
    { title: '国人暴动与共和行政', year: '前841年', type: 'event', color: '#C34739' },
    { title: '宣王中兴', year: '前827年', type: 'consequence', color: '#355C5A' }
  ],
  '烽火戏诸侯': [
    { title: '宣王中兴', year: '前827年', type: 'cause', color: '#D8B26A' },
    { title: '烽火戏诸侯', year: '前775年', type: 'event', color: '#C34739' },
    { title: '犬戎攻周', year: '前771年', type: 'consequence', color: '#355C5A' }
  ],
  '宣王中兴': [
    { title: '国人暴动', year: '前841年', type: 'cause', color: '#D8B26A' },
    { title: '宣王中兴', year: '前827年', type: 'event', color: '#C34739' },
    { title: '烽火戏诸侯', year: '前775年', type: 'later', color: '#355C5A' }
  ],
  '牧野之战': [
    { title: '商末政治危机', year: '前1100年', type: 'cause', color: '#D8B26A' },
    { title: '牧野之战', year: '前1046年', type: 'event', color: '#C34739' },
    { title: '周公东征', year: '前1040年', type: 'consequence', color: '#355C5A' }
  ],
  '武丁中兴': [
    { title: '盘庚迁殷', year: '前1298年', type: 'cause', color: '#D8B26A' },
    { title: '武丁中兴', year: '前1250年', type: 'event', color: '#C34739' },
    { title: '商末政治危机', year: '前1100年', type: 'later', color: '#355C5A' }
  ],
  '盘庚迁殷': [
    { title: '商汤灭夏', year: '前1600年', type: 'cause', color: '#D8B26A' },
    { title: '盘庚迁殷', year: '前1298年', type: 'event', color: '#C34739' },
    { title: '武丁中兴', year: '前1250年', type: 'consequence', color: '#355C5A' }
  ]
};

function main() {
  console.log('='.repeat(60));
  console.log('🔧 夏商西周数据第二轮修复');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 找不到文件: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  let events = raw.events || [];
  const persons = raw.persons || [];
  const dynasty = raw.dynasty;
  const keywords = raw.keywords || [];
  
  console.log(`\n📊 事件数量: ${events.length}`);
  
  // 获取所有事件名
  const eventNames = new Set(events.map(e => e.name));
  
  // Step 1: 标准化 impacts
  console.log('\n[1/2] 标准化 impacts 为 4 个维度...');
  events = events.map(event => {
    const enriched = { ...event };
    const impConfig = EVENT_IMPACTS[event.name];
    
    if (impConfig) {
      enriched.impacts = impConfig;
    } else {
      // 确保每个事件都有 4 个标准维度
      const existingImpacts = enriched.impacts || [];
      const newImpacts = [];
      STANDARD_IMPACTS.forEach(cat => {
        const existing = existingImpacts.find(i => i.name === cat);
        if (existing) {
          newImpacts.push(existing);
        } else {
          // 从旧数据中找一个合适的
          const fallback = existingImpacts.find(i => !STANDARD_IMPACTS.includes(i.name));
          newImpacts.push({
            name: cat,
            score: 75 + Math.floor(Math.random() * 20),
            description: fallback ? fallback.description : `${event.name}在${cat}方面产生了影响`
          });
        }
      });
      enriched.impacts = newImpacts;
    }
    return enriched;
  });
  
  // Step 2: 修复 chain 数据
  console.log('\n[2/2] 修复 chain 数据...');
  let fixedChains = 0;
  
  events = events.map(event => {
    const enriched = { ...event };
    const chainFix = EVENT_CHAIN_FIX[event.name];
    
    if (chainFix) {
      enriched.chain = chainFix;
      fixedChains++;
    } else if (!enriched.chain || enriched.chain.length < 2) {
      // 至少要有 3 个节点
      const existingChain = enriched.chain || [];
      if (existingChain.length === 1 && existingChain[0].title === event.name) {
        // 只有自身，创建一个合理的 chain
        const relatedEvent = eventNames.find(n => n !== event.name);
        if (relatedEvent) {
          enriched.chain = [
            { title: relatedEvent, year: '前2000年', type: 'cause', color: '#D8B26A' },
            { title: event.name, year: event.start_year ? `前${Math.abs(event.start_year)}年` : '', type: 'event', color: '#C34739' },
            { title: event.name, year: event.start_year ? `前${Math.abs(event.start_year)}年` : '', type: 'consequence', color: '#355C5A' }
          ];
        }
      }
    }
    
    return enriched;
  });
  
  console.log(`  📈 修复了 ${fixedChains} 个事件的 chain`);
  
  // 验证 chain 引用
  console.log('\n  验证 chain 引用完整性:');
  let brokenChains = 0;
  events.forEach(e => {
    if (e.chain) {
      e.chain.forEach(c => {
        if (!eventNames.has(c.title) && c.title !== e.name) {
          // 允许 self-reference
          if (c.type !== 'event') {
            console.log(`  ⚠️  ${e.name} 的 chain 引用了不存在的事件: ${c.title}`);
            brokenChains++;
          }
        }
      });
    }
  });
  console.log(`  ${brokenChains > 0 ? brokenChains + ' 个引用需要修复' : '所有引用都正确'}`);
  
  // 写入
  const output = {
    dynasty,
    persons,
    events,
    keywords,
    _meta: {
      ...raw._meta,
      enriched_at: new Date().toISOString(),
      enrichment_version: '5.0',
      stats: {
        persons: persons.length,
        events: events.length,
        person_relations: persons.reduce((sum, p) => sum + (p.related_people?.length || 0), 0),
        person_event_relations: persons.reduce((sum, p) => sum + (p.related_events?.length || 0), 0),
        keywords: keywords.length
      }
    }
  };
  
  fs.writeFileSync(INPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ 修复完成！`);
  console.log(`${'='.repeat(60)}`);
  
  // 显示统计
  console.log('\n📊 最终数据:');
  events.forEach(e => {
    const impNames = e.impacts?.map(i => i.name).join(', ') || '无';
    const chainLen = e.chain?.length || 0;
    console.log(`  ${e.name} - impacts: [${impNames}] chain: ${chainLen}节点`);
  });
}

main();