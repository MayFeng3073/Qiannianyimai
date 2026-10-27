/**
 * 三国(dynasty_109)二级人物故事精修：补齐 170-210 字（按去空白字符计）
 * 用法: node scripts/fix_109_stories.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_109.json');

function len(s) { return String(s || '').replace(/\s/g, '').length; }

const STORY_FIX = {
  '朱桓': '朱桓字休穆，吴郡吴县人，东吴重要将领，长期负责濡须、牛渚等长江沿线防务。曹魏与东吴在长江中下游长期对峙，朱桓多次参与防御。黄武年间曹仁率军进攻濡须，朱桓以少量兵力据守，利用地形与部署反击，击退魏军，声名由此大振。此后他又参与东吴对魏的多次战事，官至奋武将军，封嘉兴侯。朱桓用兵果断，善待士卒，然性情刚烈，与同僚时有摩擦。其军事生涯集中于长江防线，体现了东吴依托江河、城防与水军抵御北方强敌的战略特点。'
};

const d = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
let applied = 0;
const missed = [];
Object.entries(STORY_FIX).forEach(([name, content]) => {
  const p = d.persons.find(x => x.name === name && x.level === 2);
  if (!p) { missed.push(name); return; }
  p.story.content = content;
  applied++;
});
fs.writeFileSync(FILE, JSON.stringify(d, null, 2), 'utf-8');

const l2 = d.persons.filter(p => p.level === 2);
const out = l2.map(p => ({ name: p.name, len: len(p.story.content) })).filter(x => x.len < 170 || x.len > 210);
const dist = {};
l2.forEach(p => {
  const n = len(p.story.content);
  const k = n < 160 ? '<160' : n < 170 ? '160-169' : n < 180 ? '170-179' : n < 190 ? '180-189' : n < 200 ? '190-199' : n <= 210 ? '200-210' : '>210';
  dist[k] = (dist[k] || 0) + 1;
});
console.log('应用条数：' + applied + '/' + Object.keys(STORY_FIX).length);
if (missed.length) console.log('未找到人物：' + missed.join('、'));
console.log('超出 170-210：' + (out.length ? out.map(x => x.name + '(' + x.len + ')').join('、') : '无'));
console.log('字数分布：' + JSON.stringify(dist));
