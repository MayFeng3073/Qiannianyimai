/**
 * 词云关键词补全模块：为春秋之后被导入朝代补充「文明(civilization)/地理(geo)」类关键词。
 * 背景：import-2xx.json 的关键词多来自 Excel「朝代热力图」的 时代印象/人物/事件 类别，
 *      缺少反映制度文明成果与地理地标的词，导致词云全偏朱砂红/深棕红/鎏金黄，颜色单调。
 * 用法：在 import-<朝代>.js 中 require 后调用 injectKeywords(keywords, dynastyName)，就地 push 补充词。
 */
function kw(name, category, value, desc) { return { name, value, category, desc }; }

const EXTRA = {
  '战国': [
    kw('百家争鸣', 'civilization', 78, '思想学术空前活跃，诸子峰起、学派林立。'),
    kw('郡县制', 'civilization', 72, '各国推行郡县，取代分封、加强集权。'),
    kw('铁器牛耕', 'civilization', 68, '铁农具与牛耕普及，生产力大幅提高。'),
    kw('都江堰', 'civilization', 66, '李冰主持修筑的宏大水利枢纽工程。'),
    kw('编钟乐悬', 'civilization', 60, '金石礼乐文明，曾侯乙编钟即其代表。'),
    kw('邯郸', 'geo', 64, '赵国都城，战国中后期北方都会。'),
    kw('临淄', 'geo', 62, '齐国都城，工商业繁荣的东方大城。'),
    kw('咸阳', 'geo', 66, '秦国都城，统一战争中崛起之地。'),
    kw('函谷关', 'geo', 58, '关中东部门户，秦与六国对峙要冲。'),
  ],
  '秦': [
    kw('书同文', 'civilization', 76, '统一文字，车同轨、行同伦。'),
    kw('车同轨', 'civilization', 70, '统一度量衡与交通制度、强化集权。'),
    kw('郡县制', 'civilization', 74, '废分封行郡县，确立中央集权框架。'),
    kw('灵渠', 'civilization', 66, '沟通湘漓的军事水利工程。'),
    kw('长城工程', 'civilization', 64, '连接边城，筑成万里西北防线。'),
    kw('咸阳', 'geo', 72, '秦都，帝国政治中心。'),
    kw('阿房宫', 'geo', 62, '极尽奢华的秦代皇家宫殿营建。'),
    kw('骊山陵', 'geo', 60, '秦始皇陵所在，规模空前。'),
    kw('碣石', 'geo', 52, '秦皇东巡刻石纪功之地。'),
  ],
  '汉': [
    kw('太学', 'civilization', 72, '国家最高学府，养士兴儒。'),
    kw('造纸术', 'civilization', 70, '蔡伦改进造纸，推动文明传播。'),
    kw('地动仪', 'civilization', 64, '张衡所造，测知远方地震。'),
    kw('察举制', 'civilization', 66, '以孝廉等科目选拔官吏。'),
    kw('丝绸之路', 'civilization', 74, '沟通中外的贸易与文化交流之路。'),
    kw('长安', 'geo', 76, '西汉都城，东方文明中心。'),
    kw('未央宫', 'geo', 64, '西汉皇宫，政权象征。'),
    kw('河西走廊', 'geo', 62, '连通中原与西域的咽喉要道。'),
    kw('玉门关', 'geo', 56, '西域门户，丝路重要关隘。'),
  ],
  '三国': [
    kw('屯田制', 'civilization', 72, '曹操推行，军屯民屯以足食强兵。'),
    kw('九品中正制', 'civilization', 70, '曹魏选官制度，影响后世数百年。'),
    kw('建安文学', 'civilization', 68, '慷慨悲凉的建安风骨、文气勃发。'),
    kw('翻车', 'civilization', 62, '马钧改良的汲水灌溉工具。'),
    kw('蜀锦', 'civilization', 60, '蜀地锦绣，享誉海内。'),
    kw('洛阳', 'geo', 72, '曹魏都城，中原核心。'),
    kw('建业', 'geo', 66, '东吴都城，江南兴起之城。'),
    kw('成都', 'geo', 68, '蜀汉都城，号为天府。'),
    kw('五丈原', 'geo', 60, '诸葛北伐临终之地，星陨于此。'),
  ],
  '晋南北朝': [
    kw('均田制', 'civilization', 74, '北魏颁行，按丁授田、劝课农桑。'),
    kw('三长制', 'civilization', 70, '厘定基层户口，强化中央统治。'),
    kw('制图六体', 'civilization', 66, '裴秀创立的古代地图测绘原则。'),
    kw('永明体', 'civilization', 64, '讲究四声八病的格律诗新体。'),
    kw('灌钢法', 'civilization', 62, '薁治炼钢技术成熟，兵刃利器。'),
    kw('建康', 'geo', 74, '东晋南朝都城，六朝金粉之地。'),
    kw('洛阳', 'geo', 72, '西晋北魏都城，衣冠南渡故里。'),
    kw('平城', 'geo', 62, '北魏前期都城，草原与中原交汇。'),
    kw('云冈石窟', 'geo', 60, '北魏开凿的佛教石刻艺术宝库。'),
  ],
};

function injectKeywords(keywords, dynastyName) {
  const list = EXTRA[dynastyName];
  if (!list) return keywords;
  const names = new Set(keywords.map(k => k.name));
  let added = 0;
  for (const k of list) {
    if (!names.has(k.name)) { keywords.push(k); names.add(k.name); added++; }
  }
  if (added) console.log('  [kw_patch] 为「' + dynastyName + '」补充 ' + added + ' 个文明/地理关键词');
  return keywords;
}

module.exports = { injectKeywords, EXTRA };