// 元朝数据导入脚本 v1：从 Excel 生成 frontend/public/data/dynasty_114.json
// 结构对齐 import-113.js（宋朝），只改朝代配置/ID前缀/二级分类/别名
// 用法：node scripts/import-114.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dir = 'd:/SHUMEI/GraduationProject';

function read(fn) {
  const wb = XLSX.readFile(path.join(dir, fn));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}
function col(r, ...ks) {
  for (const k of ks) {
    const fk = Object.keys(r).find(kk => String(kk).includes(k));
    if (fk && r[fk] != null && String(r[fk]) !== '') return r[fk];
  }
  return null;
}

const DYN = {
  id: 114, name: '元', english_name: 'Yuan Dynasty',
  start_year: 1271, end_year: 1368,
  summary: '公元1206年成吉思汗统一蒙古各部建大蒙古国，其孙忽必烈1271年改国号为元、1279年灭南宋完成统一。元朝疆域空前辽阔，行省制度影响深远，中外交流活跃，马可·波罗来华即是此际。然统治时间不足百年，吏治腐败、民族矛盾、天灾叠乘，1351年红巾军起义爆发，1368年朱元璋北伐攻克大都，元顺帝北遁，元朝灭亡。',
  capital: '大都（今北京）、上都（开平）', population: '约八千万（鼎盛）', duration: '约97年',
  representative_buildings: ['大都城', '上都开平', '妙应寺白塔', '居庸关'],
  characteristics: { politics: 82, culture: 86, military: 94, technology: 90, openness: 96 }
};

// ---- 读取并过滤元朝数据 ----
const l1 = read('1级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('元'));
const l2 = read('2级人物数据.xlsx').filter(r => String(col(r, '朝代')).includes('元'));
const ev = read('事件数据.xlsx').filter(r => String(col(r, '朝代')).includes('元'));
const kw = read('朝代热力图.xlsx').filter(r => String(col(r, '朝代')).includes('元'));
const rel = read('人物关系表.xlsx');
const pev = read('人事关系表.xlsx');

// ---- 年份解析 ----
function parseYear(s) {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim();
  let m = t.match(/约?公元前?(\d{1,4})(?:年|世纪)?/);
  if (m) return t.includes('世纪') ? -parseInt(m[1]) * 100 : -parseInt(m[1]);
  m = t.match(/约?(\d{1,2})世纪(?:初|中叶|前期|后期|末)?/);
  if (m) return parseInt(m[1]) * 100;
  m = t.match(/约?(\d{1,4})年?/);
  if (m) return parseInt(m[1]);
  return null;
}
function pbd(b, d) {
  return { birth: (b && b !== '不详') ? parseYear(String(b)) : null, death: (d && d !== '不详') ? parseYear(String(d)) : null };
}
function imageUrl(name, type = 'person') {
  const size = type === 'person' ? 'portrait_3_4' : 'landscape_16_9';
  const phr = type === 'person' ? 'ancient chinese historical figure ' + name + ' traditional ink painting style portrait' : 'ancient chinese historical event ' + name + ' traditional ink painting style';
  return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(phr) + '&image_size=' + size;
}
function fmtYear(y) {
  if (y == null) return '';
  return y < 0 ? `前${Math.abs(y)}年` : `${y}年`;
}

// ============= 精准字典：元朝一级人物主要成果的专属 description =============
// 约定：每条 ~30 字、无年份、单行、不含特定人名（works 同名跨人物通用）
const WORK_DESC_MAP = {
  // —— 忽必烈 ——
  '建立元朝': '采纳汉臣建议，取《易经》“大哉乾元”之意改国号为元。',
  '迁都大都': '迁都燕京改名大都，营建宫城官署，奠定北京城格局。',
  '统一南宋': '指挥灭宋战争，南宋覆亡后完成全国大统一。',
  '行省制度': '首创行中书省制度，奠定中国省级行政区划基础。',
  '推动汉地治理': '推行汉法、重用儒臣，促进蒙汉融合与社会发展。',
  // —— 铁穆耳 ——
  '减免赋税': '即位后轻徭薄赋，减免百姓负担，缓和矛盾。',
  '限制宗王': '削弱宗王势力，加强中央集权，巩固皇权。',
  '停止远征日本': '停止对日远征，休养生息，避免战争消耗。',
  '整顿吏治': '整顿官僚机构、惩治贪腐，改善吏治风气。',
  // —— 海山 ——
  '统领漠北': '长期镇守漠北，率军抵御西北诸王叛乱。',
  '平定西北': '平定海都之乱，稳固西北边疆，维护统一。',
  '发行至大钞': '发行至大银钞，改革币制，强化财政控制。',
  '设置行省': '增设行省机构，加强中央对地方的管控。',
  '强化中央财政': '整顿财政制度，增加中央收入，充实国库。',
  // —— 爱育黎拔力八达 ——
  '任用汉儒': '重用汉族儒臣，推行汉化政策，促进融合。',
  '改革机构': '精简政府机构、整顿冗官，提高行政效率。',
  '推行汉法': '全面推行汉法，规范礼仪，确立儒家治道。',
  '翻译儒家典籍': '组织翻译儒家经典为蒙文，促进汉文化传播。',
  // —— 硕德八剌 ——
  '《大元通制》': '主持编纂《大元通制》，系统整理元朝律令。',
  '振举台纲': '整顿监察机构，强化御史台职能，整肃官场。',
  '助役法': '推行助役法，减轻百姓徭役负担，缓解民生。',
  '机构整顿': '裁减冗官、精简机构，提高行政效率。',
  // —— 图帖睦尔 ——
  '奎章阁': '设立奎章阁学士院，网罗文士，推动文治。',
  '学士院': '建奎章阁学士院，延揽名儒，发展学术文化。',
  '《经世大典》': '组织编纂《经世大典》，总结元朝典章制度。',
  '儒学推广': '尊崇儒学、设学兴教，推动理学在元代传播。',
  // —— 和世㻋 ——
  '重新取得皇位': '以元明宗身份重登帝位，确立武宗系皇统。',
  '整合西北蒙古诸王': '安抚西北诸王势力，缓和汗国内部矛盾。',
  '短暂恢复武宗系统': '恢复武宗一系继承皇统，维护贵族权益。',
  // —— 妥欢帖睦尔 ——
  '至正新政': '任用脱脱推行新政，整顿财政，挽救元朝危局。',
  '迁都上都': '元末北逃上都，元朝在中原的统治走向终结。',
  // —— 耶律楚材 ——
  '劝止屠戮': '力劝蒙古统治者少屠城，保全中原百姓性命。',
  '赋税制度': '建议实行固定赋税制，取代掠夺，恢复经济。',
  '州县治理': '推行州县制，恢复汉地行政，稳定社会秩序。',
  '重用儒士': '举荐儒臣、兴文教，推动汉法在中原施行。',
  // —— 刘秉忠 ——
  '定国号': '建议取《易经》“大哉乾元”之意定国号为元。',
  '规划大都': '主持规划元大都城，奠定后世北京城格局。',
  '官制建设': '参与设计元朝中央官制，完善行政体系。',
  '礼制建设': '制定朝廷礼仪典制，规范元朝礼乐制度。',
  // —— 姚枢 ——
  '推广儒学': '向忽必烈讲授儒学治国之道，推动汉法施行。',
  '兴办教育': '倡导设立学校、兴办教育，培养治国人才。',
  '推荐儒士': '举荐许衡、窦默等儒臣，充实朝廷人才。',
  '汉地治理': '参与汉地州县治理，恢复社会经济秩序。',
  // —— 许衡 ——
  '授徒讲学': '广收门徒、讲学传道，培养大批理学人才。',
  '建立教育体系': '参与创设国子学，奠定元代教育体系。',
  '推广程朱理学': '将程朱理学定为官学，成为主流思想。',
  '参与制度建设': '参与元朝礼乐、历法等重要制度制定。',
  // —— 郝经 ——
  '出使南宋': '奉使南宋议和，被扣多年仍持节不屈。',
  '《续后汉书》': '撰《续后汉书》补续汉史，考订精详。',
  '经世文献': '著经世之文，主张以汉法治国、休养生息。',
  // —— 史天泽 ——
  '汉军组织': '统率汉军万户，为蒙古提供精锐汉人军队。',
  '灭金战争': '参与灭金之战屡建战功，为灭金名将。',
  '襄阳战事': '参与襄阳围攻战，为灭宋重要将领。',
  // —— 伯颜 ——
  '临安受降': '率军兵临临安，受南宋投降，完成统一。',
  '江南治理': '平定江南后安抚地方，维持新附地区秩序。',
  // —— 阿术 ——
  '襄阳战役': '参与长达六年的襄阳围攻战，战功卓著。',
  '攻宋作战': '率军攻宋连下沿江重镇，为灭宋主力。',
  '长江作战': '指挥水军沿长江东下，突破南宋江防。',
  // —— 张弘范 ——
  '崖山海战': '指挥崖山海战大破宋军，南宋就此灭亡。',
  // —— 脱脱 ——
  '三史修撰': '主持修撰辽、金、宋三史，为官修正史壮举。',
  // —— 贾鲁 ——
  '贾鲁治河': '主持治河工程，兼用疏浚、筑堤、堵口诸法。',
  '黄河治理': '治理黄河决口泛滥，稳定河道、减少水患。',
  '河道工程': '提出治河三策，完成大规模河道整治工程。',
  // —— 刘福通 ——
  '红巾军起义': '领导红巾军起义，掀开元末起义序幕。',
  '韩宋政权': '拥立韩林儿称帝，建立韩宋政权抗元。',
  '颍州起义': '在颍州首举义旗，红巾军起义由此爆发。',
  // —— 赵孟頫 ——
  '《鹊华秋色图》': '作《鹊华秋色图》，文人山水画传世名作。',
  '赵体书法': '创“赵体”楷书，与欧、颜、柳并称四大家。',
  '《松雪斋文集》': '著《松雪斋文集》，诗文书法皆负盛名。',
  '绘画理论': '倡“书画同源”，开元代文人画新风。',
  // —— 关汉卿 ——
  '《窦娥冤》': '写窦娥蒙冤昭雪故事，元杂剧巅峰之作。',
  '《救风尘》': '写风尘女子智斗恶少，诙谐辛辣喜剧名篇。',
  '《望江亭》': '写谭记儿智斗权豪，为元杂剧喜剧佳作。',
  '《单刀会》': '写关公单刀赴会，慷慨豪迈历史剧。',
  // —— 马致远 ——
  '《汉宫秋》': '写昭君出塞故事，元曲四大悲剧之一。',
  '《天净沙·秋思》': '“枯藤老树昏鸦”千古绝唱，散曲名篇。',
  '《荐福碑》': '写书生怀才不遇的悲愤，元杂剧名作。',
  // —— 王实甫 ——
  '《西厢记》': '写崔张爱情故事，被誉为天下夺魁之作。',
  '《丽春堂》': '写金代故事，文辞典雅，元杂剧名作。',
  '《破窑记》': '写吕蒙正发迹故事，寓意科举功名。',
  // —— 白朴 ——
  '《梧桐雨》': '写唐明皇杨贵妃故事，元曲四大悲剧之一。',
  '《墙头马上》': '写李千金追求爱情，元杂剧喜剧名作。',
  '《东墙记》': '写书生董秀英爱情故事，元杂剧佳作。',
  // —— 郑光祖 ——
  '《倩女离魂》': '写张倩女离魂追爱，浪漫奇幻名作。',
  '《王粲登楼》': '写王粲登楼作赋，才子怀才不遇故事。',
  '《周公摄政》': '写周公辅政故事，宣扬忠义教化。',
  // —— 黄公望 ——
  '《富春山居图》': '画《富春山居图》，元代山水画第一神品。',
  '《九峰雪霁图》': '画《九峰雪霁图》，雪景山水代表作。',
  '山水画理论': '师法自然、以书入画，确立文人画法则。',
  // —— 王蒙 ——
  '《青卞隐居图》': '画《青卞隐居图》，密体山水之经典。',
  '《具区林屋图》': '画《具区林屋图》，写太湖林屋幽深之境。',
  // —— 倪瓒 ——
  '《渔庄秋霁图》': '画《渔庄秋霁图》，疏朗简淡画风典范。',
  '《容膝斋图》': '画《容膝斋图》，意境清远，代表名作。',
  // —— 吴镇 ——
  '《渔父图》': '画《渔父图》，寄寓隐逸江湖之志。',
  '《双桧平远图》': '画《双桧平远图》，古木苍劲、平远深秀。',
  '墨竹画': '擅画墨竹，笔力遒劲，为元四家之一。',
  // —— 郭守敬 ——
  '《授时历》': '参与编制《授时历》，精度领先世界数百年。',
  '授时历': '参与编制《授时历》，精度领先世界数百年。',
  '简仪': '设计制造简仪，为先进的天文观测仪器。',
  '高表': '创制高表配合景符，精确测定冬至时刻。',
  '大都水利': '主持开通惠河，解决大都漕运与供水难题。',
  // —— 王恂 ——
  '历法计算': '精于数学历法，推演回归年时长极为精确。',
  '天文观测': '参与全国天文观测，为授时历提供数据。',
  // —— 李冶 ——
  '《测圆海镜》': '著《测圆海镜》，系统阐述天元术。',
  '《益古演段》': '著《益古演段》，普及天元术与方程解法。',
  '天元术': '发展天元术，开代数方程研究之先河。',
  // —— 朱世杰 ——
  '《算学启蒙》': '著《算学启蒙》，为初等数学入门教材。',
  '《四元玉鉴》': '著《四元玉鉴》，论四元高次方程组。',
  '四元术': '创四元术，代表宋元数学最高成就。',
  // —— 黄道婆 ——
  '棉纺织技术': '改良棉纺织技术，推动江南棉纺业。',
  '纺车改进': '改进纺车工具，提高纺纱效率与质量。',
  '织布技术': '传授错纱配色提花技法，织出精美棉布。',
  // —— 管道升 ——
  '《墨竹图》': '画《墨竹图》，笔意清劲，传世名作。',
  '书法': '擅行楷书法，与赵孟頫并称“二妙”。',
  '诗词': '诗词清新婉约，传世《我侬词》情真意切。',
  // —— 高克恭 ——
  '墨竹': '擅画墨竹，笔法遒劲，时与赵孟頫齐名。',
  '《云横秀岭图》': '画《云横秀岭图》，山水画代表作。',
  // —— 王祯 ——
  '《农书》': '著《农书》，系统总结元代农业技术经验。',
  '农具图谱': '绘农具图谱数百种，图文并茂便于实用。',
  '农业技术整理': '整理推广农业技术，重视农桑生产。',
  // —— 危亦林 ——
  '《世医得效方》': '著《世医得效方》，集骨科医术大成。',
  '骨折整复': '精于骨折脱臼整复，创悬吊复位法。',
  '麻醉技术': '应用麻药施行手术，骨科医学先驱。',
  // —— 萨都剌 ——
  '《雁门集》': '著《雁门集》，少数民族诗人代表。',
  '《满江红·金陵怀古》': '怀古伤今，苍凉悲壮，词中名篇。',
  '诗歌创作': '诗风清丽，兼融南北文风，题材广泛。',
  // —— 多人同名通用条目 ——
  '恢复科举': '恢复科举取士制度，为汉族士人重开入仕之门。',
  '治理黄河': '任命贾鲁主持治河，堵塞决口，缓解水患。',
  '南宋灭亡战争': '率军南征灭宋，为元朝统一的重要将领。',
  '山水画': '工山水画，笔意高逸，为元代画坛名家。',
};

function genWorkDesc(name) {
  if (!name) return '';
  const n = name.trim();
  if (WORK_DESC_MAP[n]) return WORK_DESC_MAP[n];
  // 通用兜底：根据关键词粗略匹配
  if (n.includes('经') || n.includes('历')) return '古代天文历法领域的重要成就或典籍。';
  if (n.includes('史') || n.includes('书')) return '历史编纂或文献整理领域的重要工作。';
  if (n.includes('治') || n.includes('法') || n.includes('政')) return '与政治治理、制度改革相关的重要举措。';
  if (n.includes('战') || n.includes('军')) return '军事领域的重要行动或成果。';
  if (n.includes('水') || n.includes('河')) return '水利工程或治理河患方面的重要工作。';
  if (n.includes('科') || n.includes('考')) return '科举或教育文化领域的重要事件。';
  if (n.includes('画') || n.includes('书') || n.includes('诗') || n.includes('曲')) return '文学艺术领域的重要成就。';
  if (n.includes('贸') || n.includes('商') || n.includes('海')) return '商业贸易或对外交流领域的重要活动。';
  return n + '是其人生中的重要成就之一。';
}
function parseLaterQuotes(raw) {
  if (!raw) return [];
  const s = String(raw);
  const out = [];
  // 兼容 Excel 两种格式："《原文》——书名；" + 无书名号的 "原文 ——说明"
  // 先按分号拆段落
  s.split(/[；;]/).forEach(seg => {
    seg = seg.trim();
    if (!seg) return;
    // 格式1："内容"——《作者》 或 "内容"——作者（有无书名号）
    let m = seg.match(/[“「"]([^”」"]{2,})[”」"]\s*(?:——|—|–|-)\s*(《[^》]{1,40}》|[^《》]{1,40})?/);
    if (m && m[1]) {
      const text = m[1].trim();
      let author = (m[2] || '').trim();
      // 去掉末尾的"评价""之评"等冗余词
      author = author.replace(/^——?/, '').trim();
      if (author && author.length > 30) author = author.slice(0, 30);
      if (!author) author = '史评';
      out.push({ text, author });
      return;
    }
    // 格式2：内容——作者（无引号）
    m = seg.match(/^(.{2,30}?)\s*(?:——|—|–|-)\s*(《[^》]{1,40}》|[^《》]{1,40})?$/);
    if (m && m[1]) {
      out.push({ text: m[1].trim(), author: ((m[2] || '').replace(/^——?/, '').trim()) || '史评' });
    }
  });
  return out;
}

// ---- 庙号/称号别名归并 ----
const ALIAS_MAP_114 = {
  '元世祖': '忽必烈', '元成宗': '铁穆耳', '元武宗': '海山', '元仁宗': '爱育黎拔力八达',
  '元英宗': '硕德八剌', '元文宗': '图帖睦尔', '元明宗': '和世㻋', '元顺帝': '妥欢帖睦尔',
  '成吉思汗': '铁木真', '元太宗': '窝阔台', '元定宗': '贵由', '元宪宗': '蒙哥',
  '马可波罗': '马可·波罗', '马哥孛罗': '马可·波罗'
};
// 跨朝代人物（引用自宋末元末明初，已在宋/明数据中存在）
const YUAN_CROSS = new Set(['文天祥', '陆秀夫', '张世杰', '陈友谅', '明玉珍', '方国珍', '刘基', '宋濂', '朱元璋', '徐达', '常遇春', '张士诚']);

// ---- 二级人物分类（72人，Excel无类型列）----
const L2_CAT_MAP_114 = {
  // —— 统治者 ——
  '贵由': '统治者',
  // —— 军事人物 ——
  '木华黎': '军事人物', '博尔术': '军事人物', '速不台': '军事人物', '拔都': '军事人物',
  '也先帖木儿': '军事人物', '玉昔帖木儿': '军事人物', '月赤察儿': '军事人物', '土土哈': '军事人物',
  '阿里海牙': '军事人物', '阿剌罕': '军事人物', '李恒': '军事人物', '董文炳': '军事人物',
  '张柔': '军事人物', '刘福通': '军事人物', '韩山童': '军事人物', '彭莹玉': '军事人物',
  '徐寿辉': '军事人物', '邹普胜': '军事人物', '韩林儿': '军事人物',
  // —— 政治人物 ——
  '安童': '政治人物', '廉希宪': '政治人物', '张文谦': '政治人物', '窦默': '政治人物',
  '赵璧': '政治人物', '王盘': '政治人物', '李孟': '政治人物', '完泽': '政治人物',
  '哈剌哈孙': '政治人物', '不忽木': '政治人物', '拜住': '政治人物', '铁失': '政治人物',
  '燕铁木儿': '政治人物', '马札儿台': '政治人物', '阿鲁图': '政治人物', '桑哥': '政治人物',
  '阿合马': '政治人物', '董文用': '政治人物', '董文忠': '政治人物', '姚燧': '政治人物',
  '程钜夫': '政治人物', '许有壬': '政治人物', '李好文': '政治人物', '王著': '政治人物',
  '高和尚': '政治人物', '彻里帖木儿': '政治人物',
  // —— 思想人物 ——
  '赵复': '思想人物', '刘因': '思想人物', '吴澄': '思想人物', '耶律有尚': '思想人物',
  // —— 文化人物 ——
  '张德辉': '文化人物', '虞集': '文化人物', '杨载': '文化人物', '揭傒斯': '文化人物',
  '黄溍': '文化人物', '危素': '文化人物', '欧阳玄': '文化人物', '张养浩': '文化人物',
  '乔吉': '文化人物', '睢景臣': '文化人物', '贯云石': '文化人物', '元好问': '文化人物',
  '高明': '文化人物', '鲜于枢': '文化人物', '康里巎巎': '文化人物', '柯九思': '文化人物',
  '郭子兴': '文化人物'
};
const DEFAULT_L2_CAT = '军事人物';

const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '君主': '统治者', '皇帝': '统治者', '帝王': '统治者', '军事家': '军事人物', '军事家/政治家': '军事人物', '外交家': '政治人物', '改革家': '政治人物', '政治家': '政治人物', '文学家': '文化人物', '文学家/政治家': '文化人物', '史学家': '文化人物', '科学家': '科技人物', '医学家': '科技人物', '工程师': '科技人物', '发明家': '科技人物' };

const persons = [];
let i2 = 1;
const nameToId = {};
const l1Persons = [];
const aliasMap = {};
const addAlias = (a, c) => { if (a && String(a).trim()) aliasMap[String(a).trim()] = c; };

let i1 = 1;
for (const r of l1) {
  const name = String(col(r, '姓名'));
  nameToId[name] = 114000 + i1;
  const id = 114000 + i1++;
  addAlias(name, name);
  const m = name.match(/^(.+?)（(.+?)）$/);
  if (m) { addAlias(m[1], name); addAlias(m[2], name); }
  (String(col(r, '称号') || '') || '').split(/[；;]/).forEach(a => addAlias(a, name));
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const rawCat = String(col(r, '人物类型') || '政治人物').trim();
  const cat = CAT_MAP[rawCat] || rawCat || '政治人物';
  const influence = Number(col(r, '历史影响力')) || 80;
  const impactRaw = col(r, '影响力描述');
  // 只按分号拆（顿号/逗号属于同一句内部，不拆）
  const impactList = impactRaw
    ? String(impactRaw).split(/[；;]/).map(s => s.trim()).filter(Boolean)
    : [];
  // 为每个 works 自动生成精准 description（按名字语义匹配 Excel 原始资料）
  const workName = col(r, '人物简介') ? String(col(r, '人物简介')) : '';
  const worksRaw = col(r, '代表成果') ? String(col(r, '代表成果')) : '';
  const works = worksRaw
    ? worksRaw.split(/[，,；;、\n]/).filter(Boolean).map(n => {
        const name = n.trim();
        return { name, description: genWorkDesc(name, nameToId) };
      }).slice(0, 5)
    : [];
  let life = [];
  const lifeRaw = col(r, '人生时间轴');
  if (lifeRaw) {
    try {
      const arr = JSON.parse(String(lifeRaw).trim());
      if (Array.isArray(arr)) {
        life = arr.map(x => ({
          year: parseYear(String(x.year || '')),   // Excel year 带"年"字，必须 parseYear！
          title: String(x.title || '').trim(),
          description: String(x.description || '').trim(),
          importance: Number(x.importance) || 5
        }));
      }
    } catch (e) {}
  }
  if (!life.length) {
    let y = birth || death || 1200;
    const storyRaw = col(r, '代表事件');
    const items = storyRaw ? String(storyRaw).split(/[，,；;、]/) : [];
    life = items.filter(Boolean).slice(0, 4).map((t, k) => ({ year: y + k, title: t.trim(), description: name + '人生重要节点：' + t.trim(), importance: 8 }));
  }
  const dimDefaults = {
    '统治者': [95, 88, 92], '政治人物': [88, 85, 80], '军事人物': [88, 82, 75],
    '文化人物': [82, 78, 88], '思想人物': [82, 76, 90], '科技人物': [88, 80, 90]
  };
  const dd = dimDefaults[cat] || [85, 80, 80];
  const tags = col(r, '人物标签') ? String(col(r, '人物标签')).split(/[；;、/\n]/).map(s => s.trim()).filter(Boolean).slice(0, 5) : [];
  const p = {
    id, name, dynasty: '元',
    summary: String(col(r, '人物简介') || '').trim() || String(col(r, '历史地位') || '').trim(),
    historical_position: String(col(r, '历史地位') || '').trim(),
    achievement: (() => { const a = String(col(r, '称号') || '').trim(); return (a && a !== name) ? a : ''; })(),
    impact_list: impactList,
    later_quotes: parseLaterQuotes(col(r, '后人评价')),
    tags,
    image_url: imageUrl(name), birth_year: birth, death_year: death,
    category: cat, level: 1,
    birth_place: col(r, '出生地') ? String(col(r, '出生地')) : null,
    occupations: col(r, '身份') ? String(col(r, '身份')).split(/[，,；;]/).filter(Boolean) : [],
    works, related_people: [], life_events: life, related_events: [],
    influence,
    dimension_scores: { historical_influence: influence, relation_activity: Number(col(r, '关系活跃度')) || dd[1], professional_1: Number(col(r, '专业维度①')) || dd[0], professional_2: Number(col(r, '专业维度②')) || dd[2], professional_3: Number(col(r, '专业维度③')) || dd[2] },
    narrative_relations: { nodes: [], edges: [] }
  };
  l1Persons.push(p);
  persons.push(p);
}
Object.entries(ALIAS_MAP_114).forEach(([a, c]) => { if (nameToId[c]) addAlias(a, c); });

// --- 二级人物 ---
const l2Persons = [];
for (const r of l2) {
  const name = String(col(r, '姓名'));
  if (nameToId[name]) continue; // 与一级重名跳过
  const id = 114100 + i2++;
  nameToId[name] = id;
  addAlias(name, name);
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const summary = (storyTitle && storyTitle.length >= 3)
    ? `${name}是元朝时期的历史人物，其重要事迹为「${storyTitle}」，从侧面展现了这一时期的历史风貌。`
    : `${name}是元朝时期的历史人物，其事迹载于史籍文献，从侧面展现了这一时期的历史风貌。`;
  const cat = L2_CAT_MAP_114[name] || DEFAULT_L2_CAT;
  const p = {
    id, name, dynasty: '元',
    summary,
    image_url: imageUrl(name),
    birth_year: null, death_year: null,
    category: cat, level: 2,
    birth_place: null,
    occupations: [],
    works: [], related_people: [], life_events: [], related_events: [],
    influence: 60,
    dimension_scores: { historical_influence: 60, relation_activity: 55, professional_1: 55, professional_2: 55, professional_3: 55 },
    story: { title: storyTitle, content: storyContent, image_url: imageUrl(name) },
    narrative_relations: { nodes: [], edges: [] }
  };
  l2Persons.push(p);
  persons.push(p);
}

// ---- 事件 (id 1143xx) ----
const events = [];
let e1 = 1;
const TYPE_MAP = { '战争军事': '战争军事', '政治制度': '政治事件', '政治': '政治事件', '外交交流': '外交', '外交': '外交', '对外交流': '外交', '经济贸易': '经济', '经济': '经济', '思想教育': '思想文化', '思想文化': '思想文化', '文化艺术': '文化艺术', '文化': '文化艺术', '科技发明': '科技发明', '科技': '科技发明', '自然灾害': '自然灾害' };
for (const r of ev) {
  const id = 114300 + e1++;
  const name = String(col(r, '事件名称'));
  const y = parseYear(String(col(r, '发生时间') || '')) || 1271;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  const significance = String(col(r, '历史影响') || '').trim();
  const rawType = String(col(r, '类型') || '').trim();
  const etype = TYPE_MAP[rawType] || '政治事件';
  const impacts = [];
  for (const [colKey, nameKey] of [['政治影响', '政治影响'], ['社会影响', '社会影响'], ['文化影响', '文化影响'], ['历史影响', '历史影响']]) {
    const fk = Object.keys(r).find(kk => String(kk).trim() === colKey);
    const v = fk ? r[fk] : null;
    if (v != null && !isNaN(Number(v))) impacts.push({ name: nameKey, score: Number(v) });
  }
  const summaryText = String(col(r, '简介') || '').trim();
  const osFirst = significance ? String(significance).split(/。/)[0].trim() : '';
  const one_sentence = (osFirst && osFirst.length >= 8 && osFirst !== summaryText)
    ? osFirst
    : `「${name}」作为元朝时期重要的${etype}事件，深刻影响了当时的政治格局，是理解这段历史的关键节点。`;
  events.push({
    id, name, dynasty: '元',
    start_year: y, end_year: y,
    summary: summaryText,
    event_type: etype,
    related_persons: [],
    significance,
    image_url: imageUrl(name, 'event'),
    one_sentence,
    person_groups: { leaders: [], participants: [], opponents: [], affected: [] },
    narratives: [], background: bg, impacts, chain: [], related_events: [], person_relations: []
  });
}

// ---- 关系聚合 ----
const REL_MAP = { '对手': '敌对', '敌对': '敌对', '敌人': '敌对', '政敌': '敌对', '盟友': '盟友', '同盟': '盟友', '合作': '盟友', '君臣': '君臣', '父子': '亲属', '母子': '亲属', '兄弟': '亲属', '兄弟姐妹': '亲属', '夫妻': '亲属', '夫妻/宫廷关系': '亲属', '宗族': '亲属', '叔侄': '亲属', '祖孙': '亲属', '父子/宗族': '亲属', '同僚': '同僚', '朋友': '同僚', '友人': '同僚', '同门': '同僚', '师徒': '师生', '师生': '师生', '下属': '支持', '支持': '支持', '继承': '继承', '宗族/继承': '继承', '文化影响': '影响', '影响': '影响', '思想关联': '影响', '交流': '交流' };
function canon(n) { return aliasMap[n] || n; }
function personByName(n) {
  return persons.find(p => p.name === n) || persons.find(p => p.name === (aliasMap[n] || ''));
}
for (const r of rel) {
  const a = col(r, '起点人物'), b = col(r, '终点人物');
  const pa = personByName(a), pb = personByName(b);
  if (!pa || !pb) continue;
  const type = REL_MAP[String(col(r, '关系类型'))] || '关联';
  if (!pa.related_people.find(x => x.name === pb.name)) pa.related_people.push({ name: pb.name, relation: type, influence: 75 });
  if (!pb.related_people.find(x => x.name === pa.name)) pb.related_people.push({ name: pa.name, relation: type, influence: 75 });
}
persons.forEach(p => { p.related_people = (p.related_people || []).slice(0, 10); });

// ---- 关键人物角色分类 ----
function classifyRole(role) {
  const s = role || '';
  const OPPO = ['失败', '对立', '对抗', '反对', '挑战', '复仇对象', '竞争', '被消灭', '对手', '敌对', '敌', '讨伐对象', '征讨对象', '征伐对象', '落败', '竞争者', '叛乱', '被伐', '对抗方', '敌对者'];
  const AFF = ['被杀', '被弑', '被刺', '被俘', '被架空', '被救', '被驱逐', '失势', '末代君主', '逃亡', '受封', '被取代', '前任', '隐士', '被记史', '受害者', '被废', '受影响'];
  const LEAD = ['主导', '胜利', '盟主', '主角', '君主', '统帅', '主将', '主谋', '谋划', '军政谋划', '执行', '推动', '主持', '提出', '复国功臣', '功臣', '中兴', '创立', '组织', '元帅', '国君', '霸主', '变法者', '改革者', '支持', '完成', '联合者', '联盟者', '三家之一', '代表', '领导'];
  if (OPPO.some(k => s.includes(k))) return 'opponents';
  if (AFF.some(k => s.includes(k))) return 'affected';
  if (LEAD.some(k => s.includes(k))) return 'leaders';
  return 'participants';
}
for (const r of pev) {
  const eName = col(r, '事件'), pName = col(r, '人物');
  const e = events.find(x => x.name === eName); if (!e) continue;
  const p = personByName(pName);
  const name = p ? p.name : canon(pName);
  const role = String(col(r, '人事关系类型'));
  const g = classifyRole(role);
  const unresolved = p ? null : (YUAN_CROSS.has(name) ? '明·待接入' : '待接入');
  if (!e.person_groups[g].find(x => x.name === name)) e.person_groups[g].push(p ? { name, role } : { name, role, cross_dynasty: unresolved });
  if (p) { if (!p.related_events.find(x => x.name === eName)) p.related_events.push({ name: eName, role }); }
}

// ---- event.person_relations ----
for (const e of events) {
  const names = new Set();
  Object.values(e.person_groups).forEach(arr => arr.forEach(x => names.add(x.name)));
  const findPersonId = n => personByName(n)?.id;
  const rels = [];
  const seenPair = new Set();
  for (const r of rel) {
    const a = canon(col(r, '起点人物')), b = canon(col(r, '终点人物'));
    if (names.has(a) && names.has(b)) {
      const type = REL_MAP[String(col(r, '关系类型'))] || '关联';
      const key = [a, b].sort().join('|') + '|' + type;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      rels.push({ source: a, target: b, type, desc: String(col(r, '关系说明') || ''), sourceId: findPersonId(a), targetId: findPersonId(b) });
    }
  }
  e.person_relations = rels.slice(0, 6);
}

// ---- 事件经过（初版：句切分，后续由 enrich 手写补全） ----
function buildNarratives(evObj) {
  const summary = evObj.summary;
  if (!summary) return [];
  const sents = summary.split(/[。；]/).map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (sents.length === 0) return [];
  const y = evObj.start_year;
  const tags = ['起因', '经过', '转折', '结果'];
  return sents.map((s, i) => ({
    year: y,
    tag: tags[i % tags.length],
    title: s.split(/[，,。；;、]/)[0].trim().slice(0, 6).replace(/[，。；、,.:：！?？]+$/, '') || '史事始末',
    description: s
  }));
}
events.forEach(e => { e.narratives = buildNarratives(e); });

// ---- 历史脉络 ----
{
  const eventPersonMap = new Map();
  for (const e of events) {
    const set = new Set();
    Object.values(e.person_groups).forEach(arr => (arr || []).forEach(x => set.add(x.name)));
    eventPersonMap.set(e.id, set);
  }
  const yearOf = id => events.find(e => e.id === id).start_year;
  const fmt = id => fmtYear(yearOf(id));
  for (const e of events) {
    const myNames = eventPersonMap.get(e.id);
    let causes = [], conses = [];
    for (const other of events) {
      if (other.id === e.id) continue;
      const shared = [...myNames].filter(n => eventPersonMap.get(other.id).has(n)).length;
      if (shared === 0) continue;
      if (other.start_year < e.start_year) causes.push({ id: other.id, shared });
      else if (other.start_year > e.start_year) conses.push({ id: other.id, shared });
    }
    causes.sort((a, b) => b.shared - a.shared || b.id - a.id || 0);
    conses.sort((a, b) => b.shared - a.shared || a.id - b.id || 0);
    let chain = [];
    causes.slice(0, 1).forEach(c => chain.push({ type: 'cause', title: c.id, year: fmt(c.id) }));
    chain.push({ type: 'event', title: e.id, year: fmt(e.id) });
    conses.slice(0, 2).forEach(c => chain.push({ type: 'consequence', title: c.id, year: fmt(c.id) }));
    if (causes.length === 0 || conses.length === 0) {
      const sorted = events.map(x => x.id).filter(id => id !== e.id).sort((a, b) => yearOf(a) - yearOf(b));
      const before = sorted.filter(id => yearOf(id) < e.start_year).pop();
      const after = sorted.filter(id => yearOf(id) > e.start_year)[0];
      chain = [];
      if (before) chain.push({ type: 'cause', title: before, year: fmt(before) });
      chain.push({ type: 'event', title: e.id, year: fmt(e.id) });
      if (after) chain.push({ type: 'consequence', title: after, year: fmt(after) });
      if (sorted.length === 0) chain = [{ type: 'event', title: e.name, year: fmt(e.id) }];
    }
    chain.forEach(c => { c.title = events.find(x => x.id === c.title)?.name || c.title; });
    e.chain = chain;
    if (e.chain.length === 0) e.chain = [{ type: 'event', title: e.name, year: fmt(e.id) }];
  }
}

// ---- 贡献富化（仅兜底，不覆盖已有 description） ----
{
  const evSummaryMap = {};
  events.forEach(e => { evSummaryMap[e.name] = e.summary; });
  for (const p of l1Persons) {
    (p.works || []).forEach(w => {
      // genWorkDesc 已生成精准 description → 跳过覆盖
      if (w.description && !w.description.includes('是其人生中的重要成就')) return;
      // 仅当 work 名与事件名完全一致时才用事件简介，绝不把同一事件简介塞给多个 works
      const matched = events.find(e => e.name === w.name || (w.name && e.name.includes(w.name)));
      if (matched && matched.summary) {
        w.description = matched.summary;
      } else if (!w.description) {
        w.description = `系${p.name}在${p.dynasty}时期的重要建树。`;
      }
    });
  }
}

// ---- 关键词 ----
const KC = { '时代印象': 'era', '历史概念': 'event', '政治改革': 'civilization', '历史事件': 'event', '政治理念': 'civilization', '外交制度': 'civilization', '人物': 'person', '人物故事': 'person', '历史典故': 'event', '思想文化': 'civilization', '政治格局': 'era', '战争': 'event', '制度文化': 'civilization', '科技发明': 'civilization', '核心人物': 'person', '文明制度': 'civilization', '文化地理': 'geo' };
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是元朝时期的重要概念。' }));

// ---- 写文件 ----
const out = { dynasty: DYN, persons, events, keywords, _meta: { imported_at: new Date().toISOString(), stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length } } };
const target = path.join(dir, 'frontend/public/data/dynasty_114.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_114.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);

if (fs.existsSync(path.join(__dirname, 'fix_114_content.js'))) {
  console.log('\n--- 运行内容精修 fix_114_content.js ---');
  require('./fix_114_content.js');
}
if (fs.existsSync(path.join(__dirname, 'enrich_114_relations.js'))) {
  console.log('\n--- 运行数据丰富 enrich_114_relations.js ---');
  require('./enrich_114_relations.js');
}
