/**
 * 春秋数据丰富化处理器
 * 应用 knowledge_202.js 手工精选数据：
 *  1. 一级人物主要贡献(works) 精简为 {name, excerpt, description}
 *  2. 一级人物人生轨迹(life_events) 修正为准确描述
 *  3. 后人评价(later_quotes) 限制为2条
 *  4. 事件经过(narratives)、背景、影响、脉络 采用分阶段叙述(去除重复)
 * 用法: node scripts/enrich_202.js
 */
const fs = require('fs');
const path = require('path');
const { PERSON_ENRICHMENT, EVENT_ENRICHMENT } = require('./knowledge_202');

const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_202.json');

function main() {
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  let persons = raw.persons || [];
  const events = raw.events || [];
  const dynasty = raw.dynasty;
  const keywords = raw.keywords || [];

  let personHit = 0, eventHit = 0;

  // ---- 一级人物丰富化 ----
  persons = persons.map(person => {
    const enriched = { ...person, later_quotes: [...(person.later_quotes || [])] };
    // 后人评价限制为2条
    if (enriched.later_quotes && enriched.later_quotes.length > 2) {
      enriched.later_quotes = enriched.later_quotes.slice(0, 2);
    }
    const k = PERSON_ENRICHMENT[person.name];
    if (k) {
      if (person.level === 1) {
        if (k.works) enriched.works = k.works;
        if (k.life_events) enriched.life_events = k.life_events;
        personHit++;
      }
    }
    return enriched;
  });

  // ---- 事件丰富化 ----
  events.forEach(event => {
    const k = EVENT_ENRICHMENT[event.name];
    if (k) {
      if (k.narratives) event.narratives = k.narratives;
      if (k.background) event.background = k.background;
      if (k.impacts) event.impacts = k.impacts;
      if (k.chain) event.chain = k.chain;
      eventHit++;
    }
  });

  const out = {
    dynasty, persons, events, keywords,
    _meta: { ...(raw._meta || {}), enriched_at: new Date().toISOString(), enrichment_202: 'v2' }
  };
  fs.writeFileSync(INPUT_FILE, JSON.stringify(out, null, 2), 'utf-8');

  const noNarr = events.filter(e => EVENT_ENRICHMENT[e.name]).filter(e => e.narratives.some(n => n.tag === '经过')).length;
  console.log(`完成！一级人物丰富: ${personHit}, 事件丰富: ${eventHit}`);
  console.log(`后人评价<=2条人数: ${persons.filter(p => (p.later_quotes||[]).length <= 2).length}/${persons.length}`);
  console.log(`残留'经过'tag的事件: ${noNarr}`);
}

main();