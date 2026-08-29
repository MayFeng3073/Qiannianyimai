/**
 * 战国(dynasty_203)数据丰富脚本（对齐 enrich_202_relations.js 春秋流程）：
 *   #1 历史脉络宏观时间线(timelines) + 每条事件打 timeline_id
 *   #2 事件填充 related_persons / related_events（修复"推荐人物/推荐事件"）
 *   #3 二级人物"身份摘要+一句话定位"引语
 *   #4 一级 related_people 扩充 + 二级 narrative_relations（因缘际会）
 * 用法: node scripts/enrich_203_relations.js
 */
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'frontend', 'public', 'data');
const f203 = path.join(DIR, 'dynasty_203.json');

function load(f) { return JSON.parse(fs.readFileSync(f, 'utf-8')); }
function save(f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2), 'utf-8'); }

/* ---------- #1 战国历史脉络宏观时间线（14节点骨干） ---------- */
const ZHANGUO_TIMELINE_KEY = '战国霸业兴衰';
const ZHANGUO_TIMELINE = [
  { title: '晋阳之战', year: '前455年', desc: '智氏覆灭', event_id: 203301 },
  { title: '三家分晋', year: '前403年', desc: '战国肇始', event_id: 203303 },
  { title: '魏文侯变法', year: '前445年', desc: '魏国崛起', event_id: 203305 },
  { title: '商鞅变法', year: '前356年', desc: '秦国强盛', event_id: 203310 },
  { title: '桂陵之战', year: '前354年', desc: '孙庞斗智', event_id: 203313 },
  { title: '马陵之战', year: '前341年', desc: '魏国衰落', event_id: 203314 },
  { title: '徐州相王', year: '前334年', desc: '齐魏并王', event_id: 203315 },
  { title: '胡服骑射', year: '前307年', desc: '赵武灵王', event_id: 203317 },
  { title: '乐毅伐齐', year: '前284年', desc: '燕国复仇', event_id: 203320 },
  { title: '长平之战', year: '前260年', desc: '白起坑赵', event_id: 203323 },
  { title: '邯郸之战', year: '前257年', desc: '合纵救赵', event_id: 203324 },
  { title: '荆轲刺秦', year: '前227年', desc: '垂死一搏', event_id: 203332 },
  { title: '秦灭六国', year: '前221年', desc: '天下归一', event_id: 203334 },
];

/* ---------- #3 二级人物引语（身份摘要+一句话定位）按 name 索引 ---------- */
const LEVEL2_QUOTES_203 = {
  '秦孝公': '战国秦国君主，任用商鞅推行变法，使积贫积弱的秦国走向富强，奠定日后统一六国的基础。',
  '秦惠文王': '战国秦国君主，车裂商鞅而不废其法，任用张仪连横破纵，灭巴蜀、取汉中，为秦国扩张奠定基业。',
  '甘龙': '秦国旧贵族代表，商鞅变法时强烈反对，是变法推行过程中守旧势力的重要人物。',
  '杜挚': '秦国旧臣，与甘龙一同反对商鞅变法，主张"法古无过，循礼无邪"。',
  '赵良': '秦国学者，曾直言劝谏商鞅收敛锋芒，是商鞅与旧势力矛盾激化的见证者。',
  '魏文侯': '战国魏国开国君主，礼贤下士，任用李悝、吴起、西门豹等改革人才，使魏国率先富强，雄踞中原。',
  '李克': '即李悝，战国初期魏国重臣，主持变法，著《法经》，是中国法治思想的先驱。',
  '段干木': '战国魏国名士，贤而有德，魏文侯对其礼遇有加，是"礼贤下士"的典范。',
  '西门豹': '战国魏国贤臣，任邺令时破除"河伯娶妇"迷信，兴修水利，造福一方。',
  '魏武侯': '魏文侯之子，继承父业，在位时魏国仍保持强势，与赵、韩、楚多有征战。',
  '楚悼王': '战国楚国君主，任用吴起变法图强，一度使楚国强盛，后因旧贵族反扑而功败垂成。',
  '楚肃王': '楚悼王之子，吴起变法失败后即位，镇压了旧贵族叛乱，稳固了楚国政局。',
  '邹忌': '战国齐国相国，以"讽齐王纳谏"闻名，辅佐齐威王改革图强，使齐国大治。',
  '淳于髡': '战国齐国稷下学者，机智善辩，以隐语谏齐威王，是稷下学宫的标志性人物。',
  '田婴': '战国齐国宗室大臣，孟尝君之父，长期执掌齐政，是齐国田氏的重要政治力量。',
  '齐宣王': '战国齐国君主，在位时齐国稷下学宫极盛，人才济济，与魏国争雄中原。',
  '赵成侯': '战国赵国君主，在位时赵国内政外交多有建树，是赵国崛起的关键君主。',
  '公子成': '赵国宗室重臣，曾反对赵武灵王胡服骑射，是赵国保守势力的代表。',
  '赵惠文王': '战国赵国君主，在位时赵国有蔺相如、廉颇、赵奢等名臣名将，成为东方强国。',
  '赵豹': '战国赵国宗室大臣，在赵国政治中有重要地位。',
  '田和': '战国齐国田氏首领，最终取代姜氏齐国立为诸侯，史称"田氏代齐"。',
  '乐羊': '战国魏国将领，率军攻灭中山国，是魏文侯时期的名将。',
  '公叔痤': '战国魏国相国，临终向魏惠王推荐商鞅而未被采纳，是魏国错失人才的关键事件。',
  '李兑': '战国赵国权臣，参与赵武灵王后期的权力斗争，主导了"沙丘之乱"。',
  '韩王安': '战国韩国末代君主，韩国被秦国所灭时在位，国亡被俘。',
  '庞涓': '战国魏国名将，与孙膑同师于鬼谷子，因嫉妒残害孙膑，终在马陵之战中兵败自刎。',
  '田忌': '战国齐国名将，与孙膑配合，在桂陵、马陵之战中大败魏军，是齐国强盛的功臣。',
  '魏惠王': '战国魏国君主，早期魏国极盛，后因桂陵、马陵两败于齐而国力大衰，魏国霸业就此终结。',
  '赵奢': '战国赵国名将，以"阏与之战"大败秦军闻名，也是纸上谈兵的赵括之父。',
  '赵括': '战国赵国将领，长平之战中代替廉颇，因空谈兵法、轻敌冒进而致四十万赵军被坑杀。',
  '赵孝成王': '战国赵国君主，长平之战时在位，误用赵括致赵国元气大伤。',
  '蔺相如': '战国赵国名臣，以"完璧归赵""渑池之会"维护赵国尊严，与廉颇"将相和"传为佳话。',
  '郭开': '战国赵国末代权臣，受秦国贿赂陷害李牧、廉颇，直接导致赵国灭亡。',
  '赵王迁': '战国赵国末代君主，听信郭开谗言杀害名将李牧，最终赵国为秦所灭。',
  '赵葱': '战国赵国将领，李牧被罢后领兵拒秦，战败被杀。',
  '乐乘': '战国燕赵之间将领，曾在燕、赵两国为将，随乐毅伐齐立有战功。',
  '王贲': '战国秦国名将王翦之子，随父灭楚、灭魏，是秦统一六国的重要将领。',
  '蒙骜': '战国秦国将领，蒙恬之祖，长期征战，为秦国东出立下赫赫战功。',
  '蒙武': '战国秦国将领，蒙骜之子、蒙恬之父，参与灭楚之战。',
  '蒙恬': '战国末秦国名将，率军北击匈奴、修筑长城，后为赵高所害，是秦朝名将。',
  '项燕': '战国楚国名将，在秦灭楚战争中顽强抵抗，最终战败，楚国灭亡后自杀殉国。',
  '项梁': '战国末楚国贵族，项燕之子，秦末起兵反秦，是项羽的叔父。',
  '信陵君': '即魏无忌，战国四公子之一，窃符救赵、合纵抗秦，礼贤下士，是战国后期最负盛名的魏国公子。',
  '晋鄙': '战国魏国大将，领兵救赵而观望不前，被信陵君窃符夺兵而杀。',
  '朱亥': '战国魏国勇士，随信陵君窃符救赵时锤杀晋鄙，是"窃符救赵"的关键人物。',
  '乐间': '战国燕国将领，乐毅之子，参与燕国军事活动。',
  '田横': '战国末齐国宗室，齐国灭亡后率众坚守海岛，宁死不降，是气节的象征。',
  '公孙喜': '战国魏国将领，在伊阙之战中被秦将白起大败。',
  '司马错': '战国秦国名将，主张"得蜀则得楚"，率军平定巴蜀，为秦国扩张奠定基础。',
  '甘茂': '战国秦国名将，曾任秦相，为秦攻取韩国宜阳。',
  '樗里疾': '战国秦国宗室名将，秦惠文王之弟，足智多谋，人称"智囊"。',
  '魏冉': '战国秦国权臣，秦昭襄王之舅，长期把持秦国大权，起用白起为将。',
  '范雎': '战国秦国名相，提出"远交近攻"之策，助秦昭襄王巩固君权、蚕食六国。',
  '魏章': '战国秦国将领，参与秦对外的军事扩张。',
  '公子昂': '战国魏国公子，与商鞅有旧交，商鞅伐魏时以计擒之。',
  '苏代': '战国纵横家，苏秦之弟，继续推行合纵抗秦之策。',
  '苏厉': '战国纵横家，苏秦之弟，亦周旋于各国之间推行合纵。',
  '陈轸': '战国纵横家，先后仕于秦、楚，以善于游说著称。',
  '楼缓': '战国纵横家，主张连横亲秦，曾为赵、秦两国出谋。',
  '楚怀王': '战国楚国君主，前期与齐结盟抗秦，后因贪利被张仪所骗，客死于秦。',
  '魏襄王': '战国魏国君主，与齐、秦等国周旋，魏国继续衰落。',
  '韩王然': '战国韩国君主，身处秦、楚、魏之间，力图自保。',
  '齐湣王': '战国齐国君主，穷兵黩武，最终引发五国伐齐，齐国几乎灭亡，自己也死于内乱。',
  '孟尝君': '战国四公子之一，齐国宗室，门客三千，曾入秦为相又逃离，是"鸡鸣狗盗"故事的主角。',
  '触詟': '战国赵国老臣，以"触龙说赵太后"劝谏赵太后送子质齐，保国安邦。',
  '唐雎': '战国魏国使臣，以"唐雎不辱使命"力折秦王，维护安陵小国的尊严。',
  '蔡泽': '战国纵横家，继范雎之后出任秦相，善观时势。',
  '毛遂': '战国赵国门客，自荐随平原君出使楚国，促成楚赵合纵，留下"毛遂自荐"的典故。',
  '虞卿': '战国赵国上卿，主张抗秦，著书立说，是赵国主战派的代表。',
  '冯谖': '战国齐国谋士，孟尝君门客，为孟尝君"市义"买人心，留下"狡兔三窟"的谋略。',
  '春申君': '即黄歇，战国四公子之一，楚国令尹，辅佐楚考烈王，曾带兵救赵，后为李园所害。',
  '平原君赵胜': '战国四公子之一，赵国公子，长平之战后率赵人坚守邯郸，是邯郸保卫战的关键人物。',
  '甘罗': '战国秦国神童，十二岁出使赵国，不费一兵一卒为秦取五城，官拜上卿。',
  '告子': '战国思想家，曾与孟子辩论人性善恶，主张"性无善无不善"。',
  '杨朱': '战国思想家，主张"为我""贵己"，与墨家"兼爱"相对，其"一毛不拔"之说流传后世。',
  '慎到': '战国法家思想家，主张"势治"，强调君权与权势的作用。',
  '申不害': '战国韩国相国，以"术"治韩，推行变法，使韩国一度国治兵强。',
  '李斯': '战国末秦国政治家，从荀子学帝王之术，助秦王政统一六国，后任秦朝丞相。',
  '子思': '孔子之孙，战国早期儒家思想家，著有《中庸》，是思孟学派的开端。',
  '曾参': '孔子弟子，以孝行著称，著《孝经》《大学》，后世尊为"宗圣"。',
  '仲弓': '孔子弟子，名列孔门德行高足，曾任季氏宰，有贤德之名。',
  '陈相': '战国农家学者，受许行影响，主张君民并耕，曾与孟子论辩。',
  '陈良': '战国楚国儒者，悦周公仲尼之道，是南方儒学的传播者。',
  '田骈': '战国齐国稷下学者，道家学派代表人物，主张"贵齐"，善辩。',
  '环渊': '战国齐国稷下学者，道家学者，曾为田齐所养。',
  '尹文': '战国齐国稷下学者，名家代表，著有《尹文子》。',
  '彭蒙': '战国齐国稷下学者，道家学派人物，是田骈、慎到之师。',
  '宋钘': '战国思想家，主张"见侮不辱""禁攻寝兵"，接近墨家兼爱思想。',
  '尸佼': '战国学者，著有《尸子》，其"四方上下曰宇，往古来今曰宙"提出了时空概念。',
  '子游': '孔子弟子，以文学见长，曾在武城以礼乐教化百姓，是"弦歌而治"的代表。',
  '子夏': '孔子晚年重要弟子，以文学与经学见长，后在魏国西河设教，为传扬儒学的重要人物。',
  '子张': '孔子弟子，名颛孙师，以善于思考与询问政事著称。',
  '公孙尼子': '战国儒家学者，相传著《乐记》，对儒家乐教理论有重要贡献。',
  '魏牟': '战国魏国公子，道家学者，主张"重生""贵生"，与公孙龙等名家论辩。',
  '徐无鬼': '战国魏国隐士，与庄子交游，善相马，是庄子笔下的寓言人物。',
  '樊於期': '战国秦国将领，因罪逃亡燕国，后为成全荆轲刺秦而自刎献首。',
  '楚襄王': '战国楚国君主，白起破郢后被迫迁都，是楚国由盛转衰时期的君主。',
  '子兰': '战国楚国贵族，谗害屈原，使屈原被放逐，是楚国政治中的奸佞代表。',
  '靳尚': '战国楚国贵族，与张仪勾结，进谗陷害屈原，是楚国朝中的小人。',
  '高渐离': '战国末燕国乐师，荆轲挚友，擅长击筑，荆轲刺秦失败后欲为友复仇，终被杀。',
  '燕太子丹': '战国末燕国太子，因秦灭燕危在旦夕而派荆轲刺秦，是"荆轲刺秦"事件的策划者。',
  '秦舞阳': '战国燕国勇士，十三岁杀人，随荆轲入秦行刺，因怯场失态使行刺计划受挫。',
  '夏无且': '战国秦国御医，荆轲刺秦时以药囊掷荆轲，助秦王政脱险。',
  '景差': '战国楚国辞赋家，与宋玉、唐勒并称，是楚辞文学的代表人物。',
  '唐勒': '战国楚国辞赋家，与宋玉、景差并称，擅长辞赋创作。',
  '优孟': '战国楚国优人，以"优孟衣冠"讽谏楚庄王，是古代谏讽艺术的典范。',
  '优旃': '战国末秦宫廷优人，以滑稽讽谏秦始皇、秦二世，是"优谏"传统的代表。',
  '唐举': '战国魏国相士，以善相人著称，曾为蔡泽相面。',
  '景兰': '战国楚国人物，见于战国相关史料。',
  '乐羊子': '战国魏国名将乐羊之后（一说其妻），以"乐羊子妻"断机劝学的典故闻名。',
  '鲁仲连': '战国齐国高士，义不帝秦，助田单复齐，功成不受赏，是"高士"精神的代表。',
  '蔡桓公': '战国蔡国君主（一说齐国齐桓侯），扁鹊见蔡桓公的典故中讳疾忌医者。',
  '长桑君': '战国名医扁鹊之师，相传授扁鹊《禁方书》及透视之术。',
  '秦王政': '即秦始皇，战国末秦国王君，亲政后平定嫪毐之乱，最终统一六国，建立秦朝。',
  '韩桓惠王': '战国韩国君主，在秦国压力下割地自保，韩王然之父。',
  '张若': '战国秦国将领，曾任蜀郡太守，随司马错平定巴蜀。',
  '孔穿': '战国孔子后裔，与公孙龙等名家论辩，维护儒家学说。',
  '邹奭': '战国齐国阴阳家，继承邹衍学说，是稷下学宫的重要学者。',
  '嫪毐': '战国末年秦国政治人物，凭借赵太后宠幸擅权乱政，封长信侯，终因嫪毐之乱被秦王政车裂灭族。',
  '鬼谷子': '战国纵横家鼻祖，隐居鬼谷授徒，传说孙膑、庞涓、苏秦、张仪皆出其门下，是"纵横捭阖"之学的源头。',
  '公输般（鲁班）': '战国鲁国著名工匠，世称鲁班，发明云梯与攻城器械，与墨子斗智，被后世尊为木工祖师。',
  '禽滑厘': '战国墨家巨子，墨子高足，精于守城之术，是墨家学派的重要传承人。',
  '梁惠王': '即魏惠王，战国魏国君主，早年魏国称霸中原，后因桂陵、马陵两败于齐而国力大衰，是魏国由盛转衰的关键君主。',
  '姚贾': '战国末期秦国外交家，奉命出使四国，破坏合纵，助秦削平六国，是秦统一的关键外交人物。',
  '燕惠王': '战国燕国君主，因猜忌乐毅致其奔赵，使燕国伐齐功亏一篑，是燕国由盛转衰的转折点。',
  '滕文公': '战国滕国君主，在孟子辅佐下推行仁政，是《孟子》中"滕文公问政"的主角。',
  '田光': '战国末年燕国侠士，向太子丹举荐荆轲，为保守机密自刎明志，是"燕赵慷慨悲歌"精神的代表。',
  '齐桓侯': '战国齐国君主（即田齐桓公田午），与名医扁鹊同时，讳疾忌医的故事广为流传。',
  '秦武王': '战国秦国君主，在位虽短却积极扩张，好勇力，最终在洛阳举鼎绝膑而死。',
  '魏安釐王': '战国末年魏国君主，信陵君之兄，在位时魏国苟安于秦强之下，错失合纵抗秦的良机。',
  '赵太后': '战国赵国威后，赵惠文王之妻，在秦围邯郸之际以爱子入质齐国，是"触龙说赵太后"故事的主角。',
  '楚考烈王': '战国末期楚国君主，早年倚重春申君黄歇，晚年因李园之乱而楚国政局动荡。',
  '李园': '战国末期楚国权臣，以妹进献楚考烈王，后刺杀春申君黄歇，操纵楚国朝政。',
  '韩昭侯': '战国韩国君主，任用申不害推行术治，使韩国一度"国治兵强"，是韩国的中兴之主。',
};

/* ---------- 校验当日数据存在的名字/事件是否真实存在 ---------- */
function sanitizeCurated(raw, CURATED) {
  const personNames = new Set(raw.persons.map(p => p.name));
  const eventNames = new Set(raw.events.map(e => e.name));
  const out = {};
  Object.entries(CURATED).forEach(([id, spec]) => {
    const persons = (spec.persons || []).filter(([nm]) => personNames.has(nm));
    const events = (spec.events || []).filter(nm => eventNames.has(nm));
    if (persons.length + events.length > 0) out[id] = { persons, events };
  });
  return out;
}

/* 某人物 story 正文中提到的人名/事件名 */
function mentionedInStory(text, personNames, eventNames) {
  const found = new Set();
  if (!text) return found;
  [...eventNames].sort((a, b) => b.length - a.length).forEach(en => { if (text.includes(en)) found.add(en); });
  [...personNames].sort((a, b) => b.length - a.length).forEach(pn => { if (text.includes(pn)) found.add(pn); });
  return found;
}

/* 归一化关系标签：去掉「·因缘」叠缀 */
function cleanRel(s) {
  const base = (s || '').split('·')[0].trim();
  return base || '关联';
}
const REL_SET = {
  '君臣': 1, '敌对': 1, '同盟': 1, '盟友': 1, '师生': 1, '继承': 1, '亲属': 1,
  '对手': 1, '朋友': 1, '兄弟': 1, '同朝': 1, '影响': 1, '交流': 1, '关联': 1,
  '参与': 1, '因缘': 1, '先君': 1, '后继': 1, '继君': 1, '子嗣': 1, '子孙': 1,
  '辅臣': 1, '宗族': 1, '卿族': 1, '大夫': 1, '武将': 1, '谋臣': 1, '谏臣': 1,
  '楚臣': 1, '秦臣': 1, '秦将': 1, '越臣': 1, '吴君': 1, '晋君': 1, '鲁君': 1, '秦君': 1,
};
const REL_PRIORITY = {
  '君臣': 12, '敌对': 11, '同盟': 11, '盟友': 10, '师生': 10, '亲属': 10,
  '子嗣': 9, '继承': 9, '兄弟': 9, '对手': 9, '先君': 8, '后继': 8, '继君': 8,
  '朋友': 8, '影响': 7, '卿族': 7, '宗族': 7, '辅臣': 6, '武将': 6, '谋臣': 6,
  '谏臣': 6, '楚臣': 6, '秦臣': 6, '秦将': 6, '越臣': 6, '吴君': 6, '晋君': 6,
  '鲁君': 6, '秦君': 6, '大夫': 5, '交流': 5, '同朝': 5, '参与': 4, '因缘': 3, '关联': 2,
};
const REL_REAL = new Set(Object.keys(REL_SET).filter(k => !['关联', '因缘', '参与', '关系'].includes(k)));

function main() {
  const d = load(f203);
  const events = d.events || [];
  const persons = d.persons || [];
  const nameSet = new Set(persons.map(p => p.name));

  console.log('===== #1 历史脉络时间线 =====');
  d.timelines = d.timelines || {};
  d.timelines[ZHANGUO_TIMELINE_KEY] = ZHANGUO_TIMELINE;
  let tidCount = 0;
  events.forEach(ev => { ev.timeline_id = ZHANGUO_TIMELINE_KEY; tidCount++; });
  console.log('  timeline节点', ZHANGUO_TIMELINE.length, '；已为', tidCount, '条事件设置 timeline_id');

  // 事件维度参与人
  const personEvents = new Map();
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    names.forEach(n => { if (n && nameSet.has(n)) { if (!personEvents.has(n)) personEvents.set(n, new Set()); personEvents.get(n).add(ev.id); } });
  });

  // 关系线索
  const relationClues = new Map();
  events.forEach(ev => {
    (ev.person_relations || []).forEach(r => {
      if (!nameSet.has(r.source) || !nameSet.has(r.target)) return;
      const key = [r.source, r.target].sort().join('|');
      if (!relationClues.has(key)) relationClues.set(key, { type: r.type || '关系', count: 0 });
      relationClues.get(key).count++;
    });
  });

  // 事件共享人物 → 事件关联
  const evPersonSet = new Map();
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    evPersonSet.set(ev.id, names);
  });
  function relatedEventNames(ev) {
    const mine = evPersonSet.get(ev.id) || new Set();
    const scored = [];
    events.forEach(o => {
      if (o.id === ev.id) return;
      let share = 0; (evPersonSet.get(o.id) || []).forEach(n => { if (mine.has(n)) share++; });
      if (share > 0) scored.push({ id: o.id, name: o.name, share });
    });
    scored.sort((a, b) => b.share - a.share);
    ZHANGUO_TIMELINE.forEach(t => { if (t.event_id !== ev.id && !scored.some(s => s.id === t.event_id)) scored.push({ id: t.event_id, name: t.title, share: 0 }); });
    return scored.slice(0, 6).map(s => s.name);
  }

  console.log('\n===== #2 推荐人物 / 推荐事件 =====');
  let rp=0, re=0;
  events.forEach(ev => {
    const names = new Set([
      ...(ev.person_relations || []).flatMap(r => [r.source, r.target]),
      ...(ev.person_groups?.leaders || []).map(x => x.name),
      ...(ev.person_groups?.participants || []).map(x => x.name),
      ...(ev.person_groups?.opponents || []).map(x => x.name),
      ...(ev.person_groups?.affected || []).map(x => x.name),
    ]);
    ev.related_persons = [...names].filter(n => nameSet.has(n)).slice(0, 12);
    ev.related_events = relatedEventNames(ev).filter(n => n !== ev.name).slice(0, 6);
    if (ev.related_persons.length) rp++;
    if (ev.related_events.length) re++;
  });
  console.log('  已填充 related_persons 事件数:', rp, '/', events.length, '；related_events:', re, '/', events.length);

  console.log('\n===== #4 人物关系图 =====');
  const eventNamesArr = events.map(e => e.name);
  const personNamesArr = persons.map(p => p.name);
  const adjAll = new Map();
  const linkA = (a, b, rel) => {
    if (!nameSet.has(a) || !nameSet.has(b) || a === b) return;
    if (!adjAll.has(a)) adjAll.set(a, new Map());
    if (!adjAll.get(a).has(b)) adjAll.get(a).set(b, rel);
  };
  persons.forEach(pp => (pp.related_people || []).forEach(r => { if (r && r.name) linkA(pp.name, r.name, r.relation || '关系'); }));
  events.forEach(ev => (ev.person_relations || []).forEach(r => linkA(r.source, r.target, r.type || '关系')));
  persons.forEach(pp => mentionedInStory(pp.story?.content, personNamesArr, eventNamesArr).forEach(m => { if (nameSet.has(m)) linkA(pp.name, m, '因缘'); }));
  const degA = (nm) => (adjAll.get(nm) || new Map()).size;
  const evByName = new Map();
  events.forEach(ev => {
    const ppl = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(k =>
      (ev.person_groups?.[k] || []).forEach(x => { if (nameSet.has(x.name)) ppl.add(x.name); }));
    ppl.forEach(n => { if (!evByName.has(n)) evByName.set(n, new Set()); evByName.get(n).add(ev.name); });
  });
  const evRoleByName = new Map();
  events.forEach(ev => {
    const roleOf = (arr, label) => (arr || []).forEach(x => { if (!x.name) return; if (!evRoleByName.has(x.name)) evRoleByName.set(x.name, new Map()); evRoleByName.get(x.name).set(ev.name, label); });
    roleOf(ev.person_groups?.leaders, '主导');
    roleOf(ev.person_groups?.participants, '参与');
    roleOf(ev.person_groups?.opponents, '对抗');
    roleOf(ev.person_groups?.affected, '受影响');
  });
  const bfsPersons = (center, maxCount) => {
    const direct = new Map(), indirect = new Map(), visited = new Set([center]);
    const q = [[center, 0]];
    while (q.length) {
      const [cur, dep] = q.shift();
      if (dep >= 2 || direct.size >= maxCount) break;
      for (const [nb, rel] of (adjAll.get(cur) || new Map())) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        if (dep === 0) direct.set(nb, rel); else indirect.set(nb, rel);
        q.push([nb, dep + 1]);
        if (direct.size >= maxCount) break;
      }
    }
    return { direct, indirect };
  };

  // 一级：related_people
  let l1ok=0;
  persons.filter(p => (p.level || 1) === 1).forEach(p => {
    const merged = new Map();
    (p.related_people || []).forEach(rp2 => { if (rp2 && rp2.name) merged.set(rp2.name, { type: rp2.relation || '关系', count: (merged.get(rp2.name)?.count || 0) + 1 }); });
    events.forEach(ev => (ev.person_relations || []).forEach(r => {
      const other = r.source === p.name ? r.target : (r.target === p.name ? r.source : null);
      if (other && nameSet.has(other)) { const cur = merged.get(other); merged.set(other, { type: r.type || (cur?.type || '关系'), count: (cur?.count || 0) + 1 }); }
    }));
    events.forEach(ev => {
      const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
      const inGroups = groups.some(g => g.some(x => x.name === p.name));
      if (!inGroups) return;
      groups.forEach((g, gi) => {
        g.forEach(x => { if (x.name && x.name !== p.name && nameSet.has(x.name)) { const rel = gi === 2 ? '敌对' : '同盟'; const cur = merged.get(x.name); if (!cur || cur.count === 0) merged.set(x.name, { type: rel, count: (cur?.count || 0) + 1 }); } });
      });
    });
    const list = [...merged.entries()].map(([nm, info]) => ({
      name: nm,
      relation: cleanRel(info.type),
      influence: Math.min(95, 55 + info.count * 8),
    })).sort((a, b) => b.influence - a.influence);
    if (list.length < 6) {
      const have = new Set(list.map(x => x.name));
      const { direct, indirect } = bfsPersons(p.name, 8);
      [...direct.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => { if (!have.has(nm)) { have.add(nm); list.push({ name: nm, relation: cleanRel(rel) || '关系', influence: 60 }); } });
      [...indirect.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel]) => { if (!have.has(nm) && list.length < 9) { have.add(nm); list.push({ name: nm, relation: '关联', influence: 50 }); } });
    }
    list.sort((a, b) => b.influence - a.influence);
    list.forEach((x, i) => { x.influence = Math.max(45, 88 - i * 3); });
    p.related_people = list.slice(0, 9);
    if (p.related_people.length >= 4) l1ok++;
  });
  console.log('  一级人物 related_people (>=4) 数量:', l1ok, '/', persons.filter(p=>p.level===1).length);

  // 二级：narrative_relations（因缘际会）
  const CURATED_203 = {
    '田和': { persons: [['齐威王', '后君'], ['邹忌', '同朝'], ['齐宣王', '继君'], ['田婴', '宗室']], events: ['齐威王改革'] },
    '告子': { persons: [['孟子', '论辩'], ['荀子', '后学'], ['杨朱', '并世'], ['许行', '并世']], events: ['孟子游说诸侯', '百家争鸣'] },
    '环渊': { persons: [['田骈', '同道'], ['慎到', '同道'], ['尹文', '同门'], ['宋钘', '同道']], events: ['稷下学术交流'] },
    '尸佼': { persons: [['商鞅', '同幕'], ['公孙鞅', '同幕'], ['申不害', '法家'], ['慎到', '法家']], events: ['商鞅变法'] },
    '公孙尼子': { persons: [['子思', '儒家'], ['曾参', '儒门'], ['荀子', '儒门'], ['孟子', '儒门']], events: ['百家争鸣'] },
    '魏牟': { persons: [['公孙龙', '论辩'], ['惠施', '论辩'], ['庄子', '同道'], ['宋钘', '并世']], events: ['百家争鸣'] },
    '徐无鬼': { persons: [['庄子', '交游'], ['魏牟', '并世'], ['惠施', '并世'], ['慎到', '并世']], events: ['庄子思想'] },
    '唐勒': { persons: [['屈原', '同好'], ['宋玉', '同好'], ['景差', '同好'], ['楚襄王', '楚君']], events: ['白起破郢'] },
    '景兰': { persons: [['屈原', '同朝'], ['宋玉', '同好'], ['唐勒', '同好'], ['楚襄王', '楚君']], events: ['白起破郢'] },
    '唐举': { persons: [['蔡泽', '相面'], ['范雎', '秦相'], ['吕不韦', '秦相'], ['甘罗', '秦臣']], events: [] },
    '乐羊子': { persons: [['乐羊', '先祖'], ['魏文侯', '魏君'], ['李克', '同朝'], ['西门豹', '同朝']], events: ['魏文侯变法'] },
    '孔穿': { persons: [['公孙龙', '论辩'], ['惠施', '论辩'], ['孟子', '儒门'], ['荀子', '儒门']], events: ['百家争鸣'] },
    '邹奭': { persons: [['邹衍', '承学'], ['环渊', '同道'], ['田骈', '同道'], ['慎到', '同道']], events: ['稷下学术交流'] },
    '张若': { persons: [['司马错', '同将'], ['樗里疾', '秦将'], ['甘茂', '秦将'], ['秦惠文王', '秦君']], events: ['五国伐秦'] },
    '韩桓惠王': { persons: [['韩王然', '继君'], ['申不害', '韩相'], ['韩昭侯', '先君'], ['苏秦', '纵横']], events: ['申不害变法'] },
    '公孙喜': { persons: [['白起', '对手'], ['魏冉', '秦相'], ['韩王然', '韩君'], ['魏襄王', '魏君']], events: ['伊阙之战'] },
    '魏章': { persons: [['张仪', '同朝'], ['司马错', '同将'], ['樗里疾', '同将'], ['秦惠文王', '秦君']], events: ['五国伐秦'] },
    '楼缓': { persons: [['苏秦', '对手'], ['张仪', '同道'], ['赵武灵王', '赵君'], ['秦昭襄王', '秦君']], events: ['胡服骑射'] },
    '乐乘': { persons: [['乐毅', '同族'], ['乐间', '同族'], ['赵孝成王', '赵君'], ['廉颇', '同将']], events: ['乐毅伐齐'] },
    '赵葱': { persons: [['李牧', '同将'], ['赵王迁', '赵君'], ['郭开', '权臣'], ['王翦', '对手']], events: ['秦灭六国'] },
    '嫪毐': { persons: [['赵太后', '宠幸'], ['秦王政', '君臣'], ['吕不韦', '政敌']], events: ['嫪毐之乱'] },
    '鬼谷子': { persons: [['孙膑', '师生'], ['庞涓', '师生'], ['苏秦', '纵横'], ['张仪', '纵横']], events: ['百家争鸣'] },
    '公输般（鲁班）': { persons: [['墨子', '敌对'], ['禽滑厘', '同门']], events: ['墨家兴盛'] },
    '禽滑厘': { persons: [['墨子', '师生'], ['公输般（鲁班）', '敌对']], events: ['墨家兴盛', '《墨经》成书'] },
    '梁惠王': { persons: [['孟子', '君臣'], ['庞涓', '君臣'], ['惠施', '相国']], events: ['马陵之战', '徐州相王'] },
    '姚贾': { persons: [['韩非', '政敌'], ['秦王政', '君臣'], ['李斯', '同朝']], events: ['秦灭六国'] },
    '燕惠王': { persons: [['乐毅', '君臣'], ['燕昭王', '先君'], ['邹衍', '君臣']], events: ['乐毅伐齐'] },
    '滕文公': { persons: [['孟子', '君臣'], ['许行', '并世']], events: ['孟子游说诸侯'] },
    '田光': { persons: [['荆轲', '友人'], ['高渐离', '同友']], events: ['荆轲刺秦'] },
    '齐桓侯': { persons: [['扁鹊', '合作'], ['邹忌', '同朝'], ['淳于髡', '同朝']], events: ['齐威王改革'] },
    '秦武王': { persons: [['扁鹊', '合作'], ['甘茂', '臣下'], ['樗里疾', '宗族'], ['秦惠文王', '先君']], events: ['五国伐秦'] },
    '魏安釐王': { persons: [['信陵君', '亲属'], ['范雎', '秦相'], ['白起', '秦将']], events: ['长平之战', '窃符救赵'] },
    '赵太后': { persons: [['触詟', '君臣'], ['赵孝成王', '子嗣'], ['廉颇', '赵将']], events: ['邯郸之战'] },
    '楚考烈王': { persons: [['春申君', '君臣'], ['毛遂', '盟友'], ['李园', '政敌']], events: ['邯郸之战'] },
    '李园': { persons: [['春申君', '政敌'], ['楚考烈王', '君臣'], ['毛遂', '同朝']], events: [] },
    '韩昭侯': { persons: [['申不害', '君臣'], ['韩桓惠王', '继君'], ['苏秦', '纵横']], events: ['申不害变法'] },
    '李克': { persons: [['魏文侯', '君臣'], ['乐羊', '同僚'], ['吴起', '同朝'], ['西门豹', '同僚']], events: ['魏文侯变法', '李悝变法'] },
    '段干木': { persons: [['魏文侯', '礼遇'], ['李克', '同朝'], ['西门豹', '同朝'], ['子夏', '师承']], events: ['魏文侯变法'] },
    '乐羊': { persons: [['魏文侯', '君臣'], ['李克', '同僚'], ['乐羊子', '后代'], ['西门豹', '同僚']], events: ['魏文侯变法'] },
    '公叔痤': { persons: [['魏惠王', '君臣'], ['商鞅', '举荐'], ['吴起', '同僚'], ['庞涓', '同朝']], events: ['李悝变法', '马陵之战'] },
    '韩王安': { persons: [['韩王然', '先君'], ['韩桓惠王', '先君'], ['韩昭侯', '先祖'], ['申不害', '韩相']], events: ['申不害变法', '秦灭六国'] },
    '赵奢': { persons: [['赵惠文王', '君臣'], ['赵括', '子嗣'], ['蔺相如', '同朝'], ['廉颇', '同将']], events: ['邯郸之战', '长平之战'] },
    '蒙武': { persons: [['蒙骜', '先辈'], ['蒙恬', '子嗣'], ['王翦', '同将'], ['项燕', '对手']], events: ['秦灭六国'] },
    '项梁': { persons: [['项燕', '父子'], ['楚考烈王', '楚君'], ['春申君', '同朝'], ['王翦', '对手']], events: ['秦灭六国'] },
    '乐间': { persons: [['乐毅', '父子'], ['乐乘', '同族'], ['燕惠王', '燕君'], ['燕昭王', '先君']], events: ['乐毅伐齐'] },
    '田横': { persons: [['田单', '同族'], ['齐湣王', '齐君'], ['田和', '先祖'], ['田婴', '同宗']], events: ['田单复齐', '乐毅伐齐'] },
    '司马错': { persons: [['秦惠文王', '秦君'], ['张仪', '同朝'], ['甘茂', '同将'], ['樗里疾', '同将']], events: ['五国伐秦'] },
    '甘茂': { persons: [['秦惠文王', '秦君'], ['秦武王', '秦君'], ['樗里疾', '同朝'], ['张仪', '同朝']], events: ['五国伐秦'] },
    '樗里疾': { persons: [['秦惠文王', '宗族'], ['秦武王', '宗族'], ['甘茂', '同朝'], ['张仪', '同朝']], events: ['五国伐秦'] },
    '魏冉': { persons: [['秦昭襄王', '君臣'], ['白起', '举荐'], ['范雎', '政敌'], ['樗里疾', '同族']], events: ['伊阙之战', '长平之战'] },
    '苏厉': { persons: [['苏秦', '兄弟'], ['苏代', '兄弟'], ['张仪', '对手'], ['陈轸', '同道']], events: ['五国伐秦'] },
    '蔡泽': { persons: [['范雎', '继任'], ['秦昭襄王', '秦君'], ['吕不韦', '同朝'], ['唐举', '相面']], events: ['长平之战'] },
    '虞卿': { persons: [['赵孝成王', '君臣'], ['平原君赵胜', '同朝'], ['蔺相如', '同朝'], ['廉颇', '同朝']], events: ['长平之战', '邯郸之战'] },
    '冯谖': { persons: [['孟尝君', '门客'], ['田婴', '宗室'], ['齐湣王', '齐君'], ['苏秦', '并世']], events: ['乐毅伐齐'] },
    '杨朱': { persons: [['孟子', '论辩'], ['墨子', '对立'], ['庄子', '并世'], ['宋钘', '并世']], events: ['百家争鸣'] },
    '曾参': { persons: [['子思', '师徒'], ['子夏', '同门'], ['子游', '同门'], ['仲弓', '同门']], events: ['百家争鸣'] },
    '仲弓': { persons: [['曾参', '同门'], ['子夏', '同门'], ['子游', '同门'], ['子张', '同门']], events: ['百家争鸣'] },
    '子游': { persons: [['曾参', '同门'], ['子夏', '同门'], ['子张', '同门'], ['仲弓', '同门']], events: ['百家争鸣'] },
    '子张': { persons: [['曾参', '同门'], ['子夏', '同门'], ['子游', '同门'], ['仲弓', '同门']], events: ['百家争鸣'] },
    '子兰': { persons: [['屈原', '政敌'], ['楚怀王', '楚君'], ['楚襄王', '楚君'], ['靳尚', '同党']], events: ['白起破郢'] },
    '靳尚': { persons: [['屈原', '政敌'], ['张仪', '勾结'], ['楚怀王', '楚君'], ['子兰', '同党']], events: ['白起破郢'] },
    '高渐离': { persons: [['荆轲', '挚友'], ['燕太子丹', '同朝'], ['秦舞阳', '同友'], ['田光', '同友']], events: ['荆轲刺秦'] },
    '景差': { persons: [['宋玉', '同好'], ['唐勒', '同好'], ['屈原', '同好'], ['楚襄王', '楚君']], events: ['白起破郢'] },
    '优孟': { persons: [['楚怀王', '楚君'], ['优旃', '同道'], ['唐勒', '同朝'], ['景差', '同朝']], events: ['白起破郢'] },
    '优旃': { persons: [['秦王政', '秦君'], ['优孟', '同道'], ['淳于髡', '同艺'], ['唐举', '并世']], events: ['秦统一六国'] },
    '蔡桓公': { persons: [['扁鹊', '诊治'], ['邹忌', '同朝'], ['淳于髡', '同朝'], ['齐威王', '齐君']], events: ['齐威王改革'] },
    '长桑君': { persons: [['扁鹊', '师生'], ['蔡桓公', '同朝'], ['淳于髡', '并世'], ['秦武王', '并世']], events: [] },
    '蔺相如': { persons: [['赵惠文王', '君臣'], ['廉颇', '同僚'], ['平原君赵胜', '同朝']], events: ['邯郸之战', '长平之战'] },
    '郭开': { persons: [['赵王迁', '君臣'], ['廉颇', '政敌'], ['赵葱', '同朝']], events: ['肥之战', '秦灭六国'] },
    '陈轸': { persons: [['苏代', '同道'], ['楼缓', '同道'], ['张仪', '对手']], events: ['五国伐秦'] },
    '触詟': { persons: [['赵太后', '君臣'], ['平原君赵胜', '同朝'], ['蔺相如', '同朝']], events: ['邯郸之战'] },
    '唐雎': { persons: [['魏襄王', '魏君'], ['信陵君', '同朝'], ['毛遂', '同道']], events: ['窃符救赵'] },
    '春申君': { persons: [['楚考烈王', '君臣'], ['毛遂', '盟友'], ['平原君赵胜', '盟友']], events: ['邯郸之战', '秦灭六国'] },
    '甘罗': { persons: [['秦王政', '君臣'], ['吕不韦', '门客'], ['蒙骜', '同朝']], events: ['秦统一六国'] },
    '陈相': { persons: [['许行', '师承'], ['陈良', '同门'], ['宋钘', '并世']], events: ['百家争鸣'] },
    '陈良': { persons: [['孟子', '论辩'], ['陈相', '同门'], ['荀子', '儒门']], events: ['百家争鸣'] },
    '子夏': { persons: [['曾参', '同门'], ['子游', '同门'], ['魏文侯', '受教']], events: ['百家争鸣', '魏文侯变法'] },
    '鲁仲连': { persons: [['平原君赵胜', '同道'], ['田单', '合作'], ['信陵君', '同道']], events: ['邯郸之战', '田单复齐'] },
  };
  const curated = sanitizeCurated(d, CURATED_203);
  const buildL2Graph = (p) => {
    const center = p.name;
    const N = new Map(), E = new Map();
    const addN = (name, type, size) => { if (!N.has(name)) N.set(name, { name, type, size: size || (type === 'person' ? (name === center ? 'large' : 'medium') : 'small') }); };
    const addE = (s, t, label) => { const k = [s, t].sort().join('|'); if (s !== t && !E.has(k)) E.set(k, { source: s, target: t, label, direction: 'forward' }); };
    addN(center, 'person', 'large');
    const cand = new Map();
    for (const [nb, rel] of (adjAll.get(center) || new Map())) {
      const r = cleanRel(rel);
      if (REL_REAL.has(r)) cand.set(nb, r);
    }
    [...cand.entries()].sort((a, b) => degA(b[0]) - degA(a[0])).forEach(([nm, rel], i) => {
      addN(nm, 'person', i < 4 ? 'medium' : 'small');
      addE(center, nm, rel);
    });
    const evRoles = evRoleByName.get(center) || new Map();
    for (const [en, rel] of evRoles) { if (N.size >= 7) break; addN(en, 'event', 'small'); addE(center, en, rel); }
    const personNodes = [...N.keys()].filter(nm => nm !== center && N.get(nm).type === 'person');
    const pairs = [];
    for (let i = 0; i < personNodes.length; i++)
      for (let j = i + 1; j < personNodes.length; j++) {
        const rel = adjAll.get(personNodes[i])?.get(personNodes[j]);
        if (rel && REL_REAL.has(cleanRel(rel))) pairs.push({ a: personNodes[i], b: personNodes[j], rel: cleanRel(rel) });
      }
    pairs.sort((x, y) => (REL_PRIORITY[y.rel] ?? 0) - (REL_PRIORITY[x.rel] ?? 0));
    pairs.slice(0, 2).forEach(({ a, b, rel }) => addE(a, b, rel));
    if (personNodes.length < 3 && N.size < 6) {
      const evNamesForCenter = evByName.get(center) || new Set();
      events.forEach(ev => {
        if (!evNamesForCenter.has(ev.name) || N.size >= 7) return;
        const groups = [ev.person_groups?.leaders || [], ev.person_groups?.participants || [], ev.person_groups?.opponents || []];
        groups.forEach((g, gi) => {
          if (N.size >= 7) return;
          g.forEach(x => {
            if (!x.name || x.name === center || !nameSet.has(x.name) || N.has(x.name)) return;
            const known = adjAll.get(center)?.get(x.name);
            const rel = known && REL_REAL.has(cleanRel(known)) ? cleanRel(known) : (gi === 2 ? '敌对' : '同朝');
            addN(x.name, 'person', 'medium');
            addE(center, x.name, rel);
          });
        });
      });
    }
    if (N.size < 5 && curated[p.name]) {
      const c = curated[p.name];
      const have = new Set(N.keys());
      c.persons.forEach(([nm, rel]) => { if (!have.has(nm) && N.size < 6) { addN(nm, 'person', 'medium'); addE(center, nm, cleanRel(rel) || '关系'); } });
      c.events.forEach(en => { if (!have.has(en) && N.size < 6) { addN(en, 'event', 'small'); addE(center, en, '参与'); } });
    }
    return { nodes: [...N.values()], edges: [...E.values()] };
  };
  let l2ok=0;
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    let g = buildL2Graph(p);
    p.narrative_relations = g;
    if (g.nodes.length >= 5) l2ok++;
  });
  console.log('  二级人物因缘际会(>=5节点) 数量:', l2ok, '/', persons.filter(p=>p.level===2).length);

  save(f203, d);

  console.log('\n===== #3 二级人物引语 =====');
  let q203=0, missing=[];
  persons.filter(p => (p.level || 2) === 2).forEach(p => {
    const q = LEVEL2_QUOTES_203[p.name];
    if (q) { p.summary = q; q203++; } else missing.push(p.name);
  });
  console.log('  二级人物引语更新:', q203, '/', persons.filter(p=>p.level===2).length, missing.length?('；未命中:'+missing.join(',')):'');
  save(f203, d);

  console.log('\n完成。');
}
main();