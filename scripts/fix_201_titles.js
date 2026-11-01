// 统一「夏商西周」二级人物故事标题：去掉「X的故事」与「人名——副标题」，
// 改为与唐宋元明清一致的 4-8 字短语式标题（如「两朝拥立」「开国第一功臣」）
// 用法：node scripts/fix_201_titles.js
const fs = require('fs');
const file = 'd:/SHUMEI/GraduationProject/frontend/public/data/dynasty_201.json';

const TITLES = {
  后羿: '代夏而兴',
  寒浞: '寒浞篡夏',
  女艾: '女艾行间',
  伯靡: '助少康复国',
  关龙逢: '直谏夏桀',
  妺喜: '夏亡宠妃',
  费昌: '弃夏归商',
  昆吾: '夏末方伯',
  皋陶: '司法之祖',
  伯益: '佐禹开秦',
  伊尹: '千古贤相',
  仲虺: '商初诰命',
  葛伯: '汤征葛伯',
  巫咸: '商代大巫',
  甘盘: '武丁之师',
  傅说: '版筑贤相',
  祖己: '训王正事',
  微子启: '宋国始封',
  比干: '剖心直谏',
  箕子: '佯狂存祀',
  妲己: '商亡宠妃',
  飞廉: '商末勇将',
  太姒: '文王贤后',
  伯邑考: '早逝世子',
  姜子牙: '太公辅周',
  召公奭: '甘棠遗爱',
  毕公高: '毕公辅周',
  管叔鲜: '三监之首',
  蔡叔度: '蔡国始封',
  霍叔处: '霍叔监殷',
  武庚: '殷遗起事',
  康叔封: '卫国之祖',
  伯禽: '鲁国始封',
  尹吉甫: '采诗佐周',
  方叔: '南征荆蛮',
  召虎: '江汉之师',
  荣夷公: '专利媚王',
  召穆公: '共和行政',
  褒姒: '幽王宠后',
  申侯: '引戎破周',
  // —— 一级人物（夏商周君主）——
  启: '家天下之始',
  仲康: '仲康继统',
  少康: '少康中兴',
  夏桀: '夏桀亡国',
  商汤: '商汤灭夏',
  太甲: '太甲改过',
  太戊: '太戊中兴',
  盘庚: '盘庚迁殷',
  武丁: '武丁中兴',
  妇好: '妇好征伐',
  祖甲: '祖甲改制',
  帝乙: '帝乙归妹',
  帝辛: '商纣亡国',
  周太王: '太王迁岐',
  王季: '王季奠基',
  周文王: '文王奠基',
  周武王: '牧野兴周',
  周成王: '成王守成',
  周康王: '康王守成',
  周穆王: '穆王西征',
  周厉王: '厉王弭谤',
  周宣王: '宣王中兴',
  周幽王: '幽王亡周',
  周公旦: '制礼作乐'
};

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let changed = 0, skipped = [];
for (const p of data.persons || []) {
  if (!p.story) continue;
  const name = String(p.name || '').trim();
  const title = TITLES[name];
  if (!title) { skipped.push(name); continue; }
  if (p.story.title !== title) { p.story.title = title; changed++; }
}
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('人物故事标题已更新', changed, '条');
if (skipped.length) console.log('未匹配（未改动）:', skipped.join('、'));
