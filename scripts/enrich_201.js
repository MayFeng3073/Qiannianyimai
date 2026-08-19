/**
 * 夏商西周数据丰富化处理器
 * 读取 dynasty_201.json，应用知识库，更新所有人物和事件
 * 
 * 用法: node scripts/enrich_201.js
 */

const fs = require('fs');
const path = require('path');
const { PERSON_ENRICHMENT, STORY_ENRICHMENT, EVENT_ENRICHMENT } = require('./knowledge_201');

const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_201.json');

const RELATION_ZH = {
  'alliance': '盟友',
  'hostile': '敌对',
  'lord_vassal': '君臣',
  'kinship': '亲属',
  'teacher_student': '师生',
  'friend': '朋友',
  'support': '支持'
};

// 根据人物的关联人物和事件生成 narrative_relations
function generateNarrativeRelations(personData) {
  const nodes = [{ id: personData.name, name: personData.name, type: 'person', size: 'large' }];
  const edges = [];
  const seenNames = new Set([personData.name]);

  // 添加关联人物
  if (personData.related_people) {
    for (const rp of personData.related_people) {
      if (!seenNames.has(rp.name)) {
        const size = personData.level === 1 ? 'medium' : 'small';
        nodes.push({ id: rp.name, name: rp.name, type: 'person', size });
        edges.push({ source: personData.name, target: rp.name, label: rp.relation || '关系' });
        seenNames.add(rp.name);
      }
    }
  }

  // 添加关联事件
  if (personData.related_events) {
    for (const re of personData.related_events) {
      const eventName = typeof re === 'string' ? re : re.name;
      if (eventName && !seenNames.has(eventName)) {
        nodes.push({ id: eventName, name: eventName, type: 'event', size: 'medium' });
        const role = typeof re === 'string' ? '参与' : (re.role || '参与');
        edges.push({ source: personData.name, target: eventName, label: role });
        seenNames.add(eventName);
      }
    }
  }

  return { nodes, edges };
}

function main() {
  console.log('='.repeat(60));
  console.log('📝 夏商西周数据丰富化处理器');
  console.log('='.repeat(60));

  // 读取当前数据
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 找不到输入文件: ${INPUT_FILE}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  let persons = raw.persons || [];
  let events = raw.events || [];
  const dynasty = raw.dynasty;
  const keywords = raw.keywords || [];

  console.log(`\n📊 原始数据: ${persons.length}人, ${events.length}事件`);

  // Step 1: 丰富人物数据
  console.log('\n[1/4] 丰富人物数据...');
  let enrichedPersons = 0;

  persons = persons.map(person => {
    const enriched = { ...person };
    const knowledge = PERSON_ENRICHMENT[person.name];
    const storyData = STORY_ENRICHMENT[person.name];

    // 1a. 转换关系类型为中文
    if (enriched.related_people && Array.isArray(enriched.related_people)) {
      enriched.related_people = enriched.related_people.map(rp => ({
        ...rp,
        relation: RELATION_ZH[rp.relation] || rp.relation
      }));
    }

    // 1b. 添加知识库中的作品、生平、故事
    if (knowledge) {
      if (knowledge.works) enriched.works = knowledge.works;
      if (knowledge.life_events) enriched.life_events = knowledge.life_events;
      if (knowledge.story) enriched.story = knowledge.story;
      if (knowledge.narrative_relations) {
        enriched.narrative_relations = knowledge.narrative_relations;
      }
      // 确保 narrative_relations 不为空
      if (!enriched.narrative_relations?.nodes?.length) {
        enriched.narrative_relations = generateNarrativeRelations(enriched);
      }
      enrichedPersons++;
      console.log(`  ✅ ${person.name} - 完整丰富化`);
    } else if (storyData) {
      // 仅故事丰富化
      enriched.story = {
        title: storyData.title,
        content: storyData.content,
        image_url: ''
      };
      // 为二级人物生成故事叙述关系
      if (!enriched.narrative_relations?.nodes?.length) {
        enriched.narrative_relations = generateNarrativeRelations(enriched);
      }
      enrichedPersons++;
      console.log(`  ✅ ${person.name} - 故事丰富化`);
    } else {
      // 通用丰富化 - 至少给每个人物一个故事和基本数据
      if (person.level === 1) {
        enriched.works = enriched.works?.length ? enriched.works : [
          { name: `${person.name}的主要功业`, excerpt: '历史记载', description: `${person.name}是夏商西周时期的重要人物，在当时的政治、军事或文化领域产生了重要影响。` }
        ];
        enriched.life_events = enriched.life_events?.length ? enriched.life_events : [
          { year: -1500, title: `${person.name}活跃于政坛`, description: `${person.name}在夏商西周的历史舞台上扮演了重要角色。`, importance: 8 }
        ];
        enriched.story = enriched.story || {
          title: `${person.name}的故事`,
          content: `${person.name}是夏商西周时期的重要历史人物。作为一代${person.category}，${person.name}在当时的社会历史环境中展现出卓越的才能与胆识，参与并深刻影响了当时的政治格局与历史进程。虽然关于${person.name}的详细记载有限，但从现存的史料中可以看出，${person.name}在那个时代的历史舞台上占据着重要地位。`,
          image_url: ''
        };
        enriched.narrative_relations = enriched.narrative_relations?.nodes?.length ? enriched.narrative_relations : generateNarrativeRelations(enriched);
      } else {
        // 二级人物
        enriched.story = enriched.story || {
          title: `${person.name}的故事`,
          content: `${person.name}是夏商西周时期的重要人物。${person.summary || ''}${person.name}在那个时代的历史舞台上扮演了自己的角色，其事迹虽不如一级人物那样广为人知，但也是那个时代不可或缺的组成部分。`,
          image_url: ''
        };
        enriched.narrative_relations = enriched.narrative_relations?.nodes?.length ? enriched.narrative_relations : generateNarrativeRelations(enriched);
      }
      enrichedPersons++;
    }

    return enriched;
  });

  console.log(`  📈 已丰富化 ${enrichedPersons} 个人物`);

  // Step 2: 丰富事件数据
  console.log('\n[2/4] 丰富事件数据...');
  let enrichedEvents = 0;

  events = events.map(event => {
    const enriched = { ...event };
    const knowledge = EVENT_ENRICHMENT[event.name];

    if (knowledge) {
      if (knowledge.narratives) enriched.narratives = knowledge.narratives;
      if (knowledge.background) enriched.background = knowledge.background;
      if (knowledge.impacts) enriched.impacts = knowledge.impacts;
      if (knowledge.chain) enriched.chain = knowledge.chain;
      if (knowledge.significance) enriched.significance = knowledge.significance;
      enrichedEvents++;
      console.log(`  ✅ ${event.name} - 完整丰富化`);
    } else {
      // 通用事件丰富化
      enriched.narratives = enriched.narratives?.length ? enriched.narratives : [
        { year: event.start_year, title: event.name, description: event.summary || '', tag: '事件' }
      ];
      enriched.background = enriched.background || {
        political: `${event.name}发生在夏商西周时期，是当时政治格局演变的重要事件。`,
        social: `这一事件反映了当时的社会矛盾与历史发展趋势。`
      };
      enriched.impacts = enriched.impacts?.length ? enriched.impacts : [
        `${event.name}是夏商西周时期的重要历史事件，对当时的政治、社会产生了深远影响。`,
        `这一事件的结果深刻影响了中国历史的发展进程。`
      ];
      enriched.chain = enriched.chain?.length ? enriched.chain : [
        { title: event.name, year: event.start_year ? `前${Math.abs(event.start_year)}年` : '', type: 'event', color: '#C34739' }
      ];
      enrichedEvents++;
    }

    // 确保事件有 significance
    if (!enriched.significance) {
      enriched.significance = `${event.name}是夏商西周时期的重要历史事件，具有重要的历史地位和研究价值。`;
    }

    return enriched;
  });

  console.log(`  📈 已丰富化 ${enrichedEvents} 个事件`);

  // Step 3: 重新连接人物与事件的关系
  console.log('\n[3/4] 重新连接人物与事件...');
  
  const personNames = new Set(persons.map(p => p.name));
  
  // 3a. 确保事件的 person_groups 中的人物引用都能对应到 persons
  let connectionCount = 0;
  events = events.map(event => {
    const enriched = { ...event };
    
    // 确保 related_persons 数组存在
    if (!enriched.related_persons) {
      enriched.related_persons = [];
    }
    
    // 从 person_groups 中提取所有人物名
    const groupNames = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
      if (enriched.person_groups && enriched.person_groups[key]) {
        enriched.person_groups[key].forEach(p => {
          if (personNames.has(p.name)) {
            groupNames.add(p.name);
          }
        });
      }
    });
    
    // 更新 related_persons
    enriched.related_persons = Array.from(groupNames);
    
    // 确保 person_relations 存在
    if (!enriched.person_relations) {
      enriched.person_relations = [];
    }
    
    // 确保 related_events 存在且是字符串数组
    if (!enriched.related_events) {
      enriched.related_events = [];
    }
    
    connectionCount++;
    return enriched;
  });

  // 3b. 反向更新人物的 related_events
  const eventNameToId = {};
  events.forEach(e => { eventNameToId[e.name] = e.id; });
  
  persons = persons.map(person => {
    const enriched = { ...person };
    const relatedEvents = [];
    const seenEventNames = new Set();
    
    // 从事件的 person_groups 中查找
    events.forEach(event => {
      const allPersonNames = new Set();
      ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
        if (event.person_groups && event.person_groups[key]) {
          event.person_groups[key].forEach(p => allPersonNames.add(p.name));
        }
      });
      
      if (allPersonNames.has(person.name)) {
        let role = '参与者';
        for (const [key, group] of Object.entries(event.person_groups || {})) {
          const found = group.find(g => g.name === person.name);
          if (found) {
            role = found.role || key;
            break;
          }
        }
        relatedEvents.push({ name: event.name, role });
        seenEventNames.add(event.name);
      }
    });

    // 从 narrative_relations 中的事件节点添加关联（仅当事件存在时）
    if (enriched.narrative_relations?.nodes) {
      for (const node of enriched.narrative_relations.nodes) {
        if (node.type === 'event' && !seenEventNames.has(node.name) && eventNameToId[node.name]) {
          relatedEvents.push({ name: node.name, role: '相关事件' });
          seenEventNames.add(node.name);
        }
      }
    }

    // 从 life_events 标题中匹配事件
    if (enriched.life_events) {
      for (const le of enriched.life_events) {
        // 检查是否有事件名称与 life_event 标题匹配
        const matchedEvent = events.find(e => 
          le.title && (e.name.includes(le.title) || le.title.includes(e.name))
        );
        if (matchedEvent && !seenEventNames.has(matchedEvent.name)) {
          relatedEvents.push({ name: matchedEvent.name, role: '经历事件' });
          seenEventNames.add(matchedEvent.name);
        }
      }
    }
    
    enriched.related_events = relatedEvents;
    return enriched;
  });

  console.log(`  📈 已连接 ${connectionCount} 个事件的人物关系`);

  // Step 4: 写入更新后的 JSON
  console.log('\n[4/4] 写入 JSON 文件...');
  
  const output = {
    dynasty,
    persons,
    events,
    keywords,
    _meta: {
      ...raw._meta,
      enriched_at: new Date().toISOString(),
      enrichment_version: '2.0',
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
  console.log(`✅ 丰富化完成！`);
  console.log(`${'='.repeat(60)}`);
  console.log(`输出: ${INPUT_FILE}`);
  console.log(`人物: ${persons.length} 个 (已丰富化 ${enrichedPersons})`);
  console.log(`事件: ${events.length} 个 (已丰富化 ${enrichedEvents})`);
  console.log(`人物关系: ${persons.reduce((sum, p) => sum + (p.related_people?.length || 0), 0)} 条`);
  console.log(`人事关系: ${persons.reduce((sum, p) => sum + (p.related_events?.length || 0), 0)} 条`);
  console.log(`关键词: ${keywords.length} 个`);
  console.log(`\n🎉 现在可以刷新页面查看完整的夏商西周数据了！`);
}

main();