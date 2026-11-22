/**
 * 战国(dynasty_203)二级人物故事精修：补齐 170-210 字（按去空白字符计）
 * 用法: node scripts/fix_203_stories.js
 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_203.json');

function len(s) { return String(s || '').replace(/\s/g, '').length; }

const STORY_FIX = {
  '乐羊子': '乐羊子即战国魏将乐羊，魏文侯时受命率军攻取中山国。其时其子正在中山，中山君烹杀其子并送羹以示威胁，乐羊为表决绝而食之，终克中山。战后魏文侯虽录其功，却因其残忍而心生疑忌，未予重用。后世多以乐羊为「以功名易亲情」的典型，《战国策》《淮南子》对其事有评说。乐羊的经历反映出战国时期各国争相招揽人才、士人跨国效力、军功决定政治地位的世风。关于「乐羊子」的称谓与事迹细节，古籍记载互有出入，今人多据《战国策》与《说苑》加以辨析。',
  '齐桓侯': '齐桓侯通常指田齐桓公田午，战国时齐国君主，约在前375年至前357年间在位。田氏代齐之后，田午承继君位，面对诸侯环伺与内部整合压力，注重招揽士人，并在临淄稷门附近扩置学宫、优礼学者，为后来稷下学宫的兴盛奠定基础。其在位期间齐国与魏、赵等国时有战事，国势起伏。有关「齐桓侯」的称谓在不同文献中存在指代分歧，学界多据世系与年代加以区分。田午的经历反映出战国初期卿族代国之后，新兴君主借助学术与人才重塑政治合法性的努力。'
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
