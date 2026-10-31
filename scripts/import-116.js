// 清朝数据导入脚本：从 Excel 生成 frontend/public/data/dynasty_116.json
// 结构对齐 import-115.js（明朝），改朝代配置 / ID 前缀 / 关系保留规则 / 事件字段
// 用法：node scripts/import-116.js
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
  id: 116, name: '清', english_name: 'Qing Dynasty',
  start_year: 1644, end_year: 1912,
  summary: '公元1644年清军入关、定都北京，逐步确立对全国的统治。康雍乾三朝平定边疆、整顿财政，人口与疆域达到极盛，同时君主专制空前强化、文字狱频兴。晚清鸦片战争后国门被迫打开，内外危机交织，洋务、维新、新政相继而起，终在1911年辛亥革命中覆亡，1912年清帝退位，两千余年帝制就此终结。',
  capital: '北京', population: '约四亿（晚清）', duration: '约268年',
  representative_buildings: ['圆明园', '颐和园', '承德避暑山庄'],
  characteristics: { politics: 82, culture: 85, military: 88, technology: 75, openness: 45 }
};

// ---- 读取并过滤清朝数据 ----
const qing = r => String(col(r, '朝代')).includes('清');
const l1 = read('1级人物数据.xlsx').filter(qing);
const l2 = read('2级人物数据.xlsx').filter(qing);
const ev = read('事件数据.xlsx').filter(qing);
const kw = read('朝代热力图.xlsx').filter(qing);
const rel = read('人物关系表.xlsx').filter(qing);
const pev = read('人事关系表.xlsx').filter(qing);

// ---- 年份解析（世纪按初/前期/中期/中后期/后期取代表年）----
function parseYear(s) {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim();
  let m = t.match(/约?公元前?(\d{1,4})(?:年|世纪)?/);
  if (m) return t.includes('世纪') ? -parseInt(m[1]) * 100 : -parseInt(m[1]);
  m = t.match(/约?(\d{1,2})世纪(初|前期|中叶|中期|中后期|后期|末)?/);
  if (m) {
    const base = (parseInt(m[1]) - 1) * 100;
    const off = { '初': 10, '前期': 20, '中叶': 50, '中期': 50, '中后期': 80, '后期': 80, '末': 90 }[m[2]] ?? 50;
    return base + off;
  }
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

// ============= 精准字典：清朝一级人物代表成果的专属 description（124 条） =============
// 约定：每条约 20-35 字、无年份、单行、完整句
const WORK_DESC_MAP_116 = {
  // —— 努尔哈赤 ——
  '统一女真诸部': '统一建州与海西等女真各部，凝聚东北军事力量。',
  '建立八旗制度': '创建八旗军政合一的组织，强化部族动员能力。',
  '建立后金': '在赫图阿拉称汗建国，与明朝公开分庭抗礼。',
  '创制满文基础体系': '主持创制老满文，为满族文字与文书奠定基础。',
  // —— 皇太极 ——
  '改国号为清': '改国号为大清，完成后金向清朝的政权转型。',
  '完善官制': '仿明制设置内三院六部，健全中央官僚机构。',
  '推动满汉制度整合': '吸纳汉官儒臣，调和满汉制度与治理方式。',
  '扩展八旗体系': '扩编八旗蒙古与八旗汉军，壮大军事基础。',
  '加强中央集权': '削弱贝勒共治传统，将权力集中到中央。',
  // —— 多尔衮 ——
  '统率清军入关': '率清军入山海关，击败大顺军而定鼎中原。',
  '推动迁都北京': '促成清廷迁都北京，确立全国统治中心。',
  '辅佐顺治帝': '以摄政王身份辅佐幼帝，主持清初政务。',
  '参与清初政权整合': '整合关外与中原官僚体系，稳定清初政局。',
  // —— 孝庄太后 ——
  '辅佐顺治帝': '在顺治朝扶持幼帝，维系清初宫廷秩序。',
  '支持康熙帝即位后的政局稳定': '支持康熙继位，协助稳定宗室与朝局。',
  '劝谏皇帝': '以太后身份规谏皇帝，影响朝廷决策。',
  '关怀军民与灾民': '关注灾情与军民疾苦，倡导宽恤之政。',
  // —— 顺治帝 ——
  '清廷定都北京': '定都北京，确立清朝对中原的统治中心。',
  '逐步恢复中原行政体系': '沿用明制，恢复地方行政与赋役秩序。',
  '加强中央政务': '整顿中枢机构，强化皇帝对政务的控制。',
  '推进清初统治整合': '调和满汉关系，推进全国统治秩序整合。',
  // —— 康熙帝 ——
  '平定三藩之乱': '历时八年平定三藩，消除地方割据势力。',
  '收复台湾': '派军进取台湾，将台湾纳入清朝版图。',
  '签订《尼布楚条约》': '与俄国订立条约，划定东北地区边界。',
  '组织编纂《康熙字典》': '敕修字书，汇集历代汉字字形与音义。',
  '推动文化与西学交流': '任用传教士，吸收西方天文历算知识。',
  // —— 雍正帝 ——
  '推行摊丁入亩': '将丁银摊入田赋，改革传统赋役征收方式。',
  '推行火耗归公与养廉银': '规范地方附加税，以养廉银整顿吏治。',
  '完善密折奏报': '推广密折制度，强化皇帝对地方的掌控。',
  '整顿吏治': '严惩贪腐，整肃官僚队伍与财政纪律。',
  '推进西南改土归流': '在西南废除土司，改设流官进行治理。',
  // —— 乾隆帝 ——
  '完成多次西北军事行动': '用兵西北，平定准噶尔与回部等势力。',
  '编纂《四库全书》': '敕修大型丛书，汇集历代典籍文献。',
  '推进边疆治理': '经营新疆、西藏与蒙古，巩固疆域统治。',
  '扩大宫廷文化收藏': '广收书画文物，充实内廷典藏。',
  '加强典籍整理': '组织校勘编纂，推动官方文献系统整理。',
  // —— 嘉庆帝 ——
  '处置和珅': '亲政后查办和珅，清除其贪腐势力。',
  '尝试整顿官僚系统': '整饬吏治，试图扭转乾隆晚期的积弊。',
  '应对大规模民变': '调兵镇压白莲教等民变，维持统治秩序。',
  '维持清廷中央统治': '在财政与政局困局中维系中央权威。',
  // —— 道光帝 ——
  '支持禁烟': '支持严禁鸦片，整顿沿海烟毒问题。',
  '任用林则徐': '派林则徐赴广东查禁鸦片、整顿海防。',
  '应对第一次鸦片战争': '组织抗英战争，应对沿海军事冲击。',
  '签订《南京条约》': '战败后签约，开放口岸并赔款割地。',
  // —— 咸丰帝 ——
  '组织清廷应对太平天国': '调集军政力量镇压太平天国运动。',
  '依赖地方团练与湘军': '倚重地方团练与湘军维持统治。',
  '应对第二次鸦片战争': '应对英法联军入侵与京师失守之局。',
  // —— 慈禧太后 ——
  '掌握清廷最高决策权': '长期垂帘听政，主导清廷核心决策。',
  '支持部分洋务举措': '支持创办近代军工与新式事业。',
  '镇压戊戌变法': '发动政变终止变法，囚禁光绪帝。',
  '晚年推行新政': '推行新政与预备立宪，试图挽救统治。',
  // —— 恭亲王奕訢 ——
  '参与设立总理各国事务衙门': '参与创设总理衙门，主管对外事务。',
  '主持对外交涉': '主持晚清外交谈判与条约事务。',
  '支持洋务运动': '支持近代军工、教育与海防建设。',
  '参与清廷中枢改革': '参与军机处与中枢机构的调整。',
  // —— 同治帝 ——
  '名义上推动清廷恢复秩序': '在位期间清廷逐步恢复战后统治秩序。',
  '其朝时期支持部分洋务事业': '同治朝支持部分洋务与近代事业。',
  '清廷重建部分地方治理': '战后重建部分地方行政与治理秩序。',
  // —— 光绪帝 ——
  '支持戊戌变法': '支持维新派推行变法改革。',
  '推动百日维新': '推动百日维新期间的各项新政。',
  '推动京师大学堂创办': '批准创办京师大学堂，开启近代教育。',
  // —— 宣统帝 ——
  '清朝最后一位皇帝': '为清朝末代皇帝，在位三年后帝制终结。',
  '见证帝制终结': '亲历清帝退位，见证两千年帝制终结。',
  '晚年参与撰写回忆录': '晚年撰写回忆录，记述宫廷与近代变迁。',
  // —— 和珅 ——
  '参与中央政务': '长期参与中枢政务，掌握多项要职。',
  '主持部分外交与财政事务': '主持部分外交与财政事务，权倾一时。',
  '掌握多项朝廷要职': '身兼多职，控制内廷与户部等关键权力。',
  // —— 张廷玉 ——
  '参与军机处政务': '入值军机处，参与雍正乾隆两朝机务。',
  '主持编纂《明史》': '任总裁主持修成《明史》官修定本。',
  '参与《清会典》等典籍编修': '参与《清会典》等官方典籍的编纂。',
  // —— 林则徐 ——
  '主持虎门销烟': '在虎门销毁收缴鸦片，彰显禁烟决心。',
  '整顿广东海防': '整饬广东海防，加强沿海军事防御。',
  '编译外国地理与政情资料': '编译外国资料，开近代了解世界之风。',
  // —— 洪秀全 ——
  '发动金田起义': '在广西金田起兵，掀起大规模反清战争。',
  '建立太平天国': '建号太平天国，定都天京建立政权。',
  '推动大规模反清战争': '领导太平军长期作战，动摇清朝统治。',
  // —— 曾国藩 ——
  '创建并统率湘军': '组建湘军并统率作战，镇压太平天国。',
  '支持安庆内军械所': '支持创办安庆内军械所，试制近代军械。',
  '参与江南制造总局相关洋务事业': '参与江南制造总局等近代洋务事业。',
  // —— 左宗棠 ——
  '组织西征收复新疆大部地区': '率军西征，收复新疆大部地区。',
  '创办福州船政局相关事业': '参与创办福州船政局，建设近代海军工业。',
  '推动西北建设': '经营西北，推动屯垦与地方建设。',
  // —— 李鸿章 ——
  '创建淮军': '组建淮军，使其成为晚清重要军事力量。',
  '推动江南制造总局等洋务事业': '推动江南制造总局等近代工业建设。',
  '参与北洋海军建设': '主持北洋海军建设与海防事务。',
  '代表清廷签订多项条约': '代表清廷签订多项对外条约。',
  // —— 张之洞 ——
  '推动汉阳铁厂、湖北枪炮厂建设': '推动汉阳铁厂与湖北枪炮厂建设。',
  '创办或推动新式学堂': '创办新式学堂，推动近代教育发展。',
  '参与制定《劝学篇》': '著《劝学篇》，倡中体西用之说。',
  // —— 冯子材 ——
  '指挥镇南关战役': '率军取得镇南关大捷，重创法军。',
  '参与边境防务与抗法作战': '参与广西边境防务与抗法战事。',
  // —— 刘永福 ——
  '领导黑旗军': '统领黑旗军，活跃于中越边境。',
  '参与越南抗法作战': '率黑旗军援越抗法，屡挫法军。',
  '参与台湾抗日行动': '台湾割让后率部抵抗日军接收。',
  // —— 康有为 ——
  '推动维新思想传播': '著书讲学，传播变法维新思想。',
  '参与组织强学会': '参与组织强学会，聚合维新力量。',
  '倡导变法与制度改革': '倡言变法，推动政治与制度改革。',
  // —— 梁启超 ——
  '参与维新运动': '参与戊戌维新，主掌舆论宣传。',
  '创办《新民丛报》等报刊': '创办报刊，传播新民与变革思想。',
  '推动近代史学与学术研究': '倡导新史学，推动近代学术转型。',
  // —— 谭嗣同 ——
  '参与维新运动': '参与戊戌变法，为维新派重要骨干。',
  '撰写《仁学》': '著《仁学》，阐发冲决网罗的思想。',
  '倡导政治与社会改革': '倡言政治与社会改革，主张变法图强。',
  // —— 严复 ——
  '翻译《天演论》': '译《天演论》，引入进化论思想。',
  '翻译《原富》《群学肄言》等西学著作': '译介多部西学名著，传播近代知识。',
  '倡导新式教育': '倡办新式教育，主张开民智、育人才。',
  // —— 容闳 ——
  '推动幼童赴美留学计划': '推动幼童留美，开启近代官派留学。',
  '参与创办近代教育项目': '参与创办近代教育项目，培养新式人才。',
  '倡导学习西方科学技术': '倡导学习西方科技，推动教育革新。',
  // —— 詹天佑 ——
  '主持京张铁路建设': '主持修建京张铁路，首创人字形线路。',
  '推动中国铁路工程人才培养': '培养铁路工程人才，推动技术自主。',
  '参与多项铁路建设': '参与多项铁路工程，奠定中国铁路基础。',
  // —— 曹雪芹 ——
  '创作《红楼梦》': '创作《红楼梦》，展现封建家族的兴衰。',
  '塑造复杂人物群像': '塑造众多性格鲜明、命运各异的形象。',
  '以家族叙事呈现清代社会生活': '以家族叙事呈现清代社会的生活风貌。',
  // —— 蒲松龄 ——
  '创作《聊斋志异》': '创作《聊斋志异》，借狐鬼故事讽喻世情。',
  '发展文言短篇小说': '发展文言短篇小说的叙事与想象空间。',
  '记录与改写民间传说': '采集改写民间传说，保存市井故事。',
  // —— 吴敬梓 ——
  '创作《儒林外史》': '创作《儒林外史》，讽刺科举与士林风气。',
  '发展章回讽刺小说': '推动章回讽刺小说成熟，影响后世创作。',
  '塑造多样士人形象': '塑造多样士人形象，揭示功名利禄之弊。',
  // —— 郑燮 ——
  '创作兰竹石题材绘画': '以兰竹石入画，形成清劲独特的画风。',
  '形成独特书法风格': '创六分半书，书法瘦硬挺拔自成一家。',
  '留下大量题画诗文': '题画诗文相生，寄托民生关怀与性情。'
};

function genWorkDesc(name) {
  if (!name) return '';
  const n = name.trim();
  if (WORK_DESC_MAP_116[n]) return WORK_DESC_MAP_116[n];
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
  s.split(/[；;]/).forEach(seg => {
    seg = seg.trim();
    if (!seg) return;
    let m = seg.match(/[“「"]([^”」"]{2,})[”」"]\s*(?:——|—|–|-)\s*(《[^》]{1,40}》|[^《》]{1,40})?/);
    if (m && m[1]) {
      const text = m[1].trim();
      let author = (m[2] || '').trim();
      author = author.replace(/^——?/, '').trim();
      if (author && author.length > 30) author = author.slice(0, 30);
      if (!author) author = '史评';
      out.push({ text, author });
      return;
    }
    m = seg.match(/^(.{2,30}?)\s*(?:——|—|–|-)\s*(《[^》]{1,40}》|[^《》]{1,40})?$/);
    if (m && m[1]) {
      out.push({ text: m[1].trim(), author: ((m[2] || '').replace(/^——?/, '').trim()) || '史评' });
    }
  });
  return out;
}

// ---- 庙号/本名/称号别名归并 ----
const ALIAS_MAP_116 = {
  '清太祖': '努尔哈赤', '清太宗': '皇太极', '清世祖': '顺治帝', '清圣祖': '康熙帝',
  '清世宗': '雍正帝', '清高宗': '乾隆帝', '清仁宗': '嘉庆帝', '清宣宗': '道光帝',
  '清文宗': '咸丰帝', '清穆宗': '同治帝', '清德宗': '光绪帝', '清逊帝': '宣统帝',
  '福临': '顺治帝', '玄烨': '康熙帝', '胤禛': '雍正帝', '弘历': '乾隆帝',
  '颙琰': '嘉庆帝', '旻宁': '道光帝', '奕詝': '咸丰帝', '载淳': '同治帝',
  '载湉': '光绪帝', '溥仪': '宣统帝', '布木布泰': '孝庄太后',
  '恭亲王': '恭亲王奕訢'
};

// ---- 二级人物分类（89 人，Excel 无类型列，按史实归类）----
const L2_CAT_MAP_116 = {
  // 宗室与军事人物
  '代善': '军事人物', '济尔哈朗': '军事人物', '年羹尧': '军事人物', '傅恒': '军事人物',
  '阿桂': '军事人物', '福康安': '军事人物', '兆惠': '军事人物', '海兰察': '军事人物',
  '关天培': '军事人物', '陈化成': '军事人物', '葛云飞': '军事人物',
  '杨秀清': '军事人物', '萧朝贵': '军事人物', '韦昌辉': '军事人物', '石达开': '军事人物',
  '李秀成': '军事人物', '陈玉成': '军事人物', '曾国荃': '军事人物', '彭玉麟': '军事人物',
  '鲍超': '军事人物', '刘铭传': '军事人物',
  // 统治者（宗室）
  '载漪': '统治者', '隆裕太后': '统治者',
  // 政治人物
  '范文程': '政治人物', '索额图': '政治人物', '明珠': '政治人物', '陈廷敬': '政治人物',
  '李光地': '政治人物', '于成龙': '政治人物', '靳辅': '政治人物', '张鹏翮': '政治人物',
  '隆科多': '政治人物', '田文镜': '政治人物', '李卫': '政治人物', '鄂尔泰': '政治人物',
  '刘墉': '政治人物', '邓廷桢': '政治人物', '裕谦': '政治人物', '姚莹': '政治人物',
  '祁寯藻': '政治人物', '冯云山': '政治人物', '胡林翼': '政治人物', '沈葆桢': '政治人物',
  '丁日昌': '政治人物', '曾纪泽': '政治人物', '郭嵩焘': '政治人物', '薛福成': '政治人物',
  '唐廷枢': '政治人物', '盛宣怀': '政治人物', '张謇': '政治人物', '翁同龢': '政治人物',
  '张荫桓': '政治人物', '杨锐': '政治人物', '刘光第': '政治人物', '林旭': '政治人物',
  '康广仁': '政治人物', '徐致靖': '政治人物', '唐才常': '政治人物', '刚毅': '政治人物',
  '端方': '政治人物', '铁良': '政治人物', '岑春煊': '政治人物', '徐锡麟': '政治人物',
  // 思想人物
  '戴震': '思想人物', '洪亮吉': '思想人物', '包世臣': '思想人物', '魏源': '思想人物',
  '龚自珍': '思想人物', '徐继畬': '思想人物', '王韬': '思想人物', '秋瑾': '思想人物',
  '邹容': '思想人物',
  // 文化人物
  '纪昀': '文化人物', '钱大昕': '文化人物', '赵翼': '文化人物', '朱彝尊': '文化人物',
  '陈维崧': '文化人物', '洪昇': '文化人物', '孔尚任': '文化人物', '王原祁': '文化人物',
  '黄慎': '文化人物', '李鱓': '文化人物', '罗聘': '文化人物', '郎世宁': '文化人物',
  '马建忠': '文化人物',
  // 科技人物
  '陈潢': '科技人物', '梅文鼎': '科技人物', '徐寿': '科技人物', '华蘅芳': '科技人物',
  '李善兰': '科技人物'
};
const DEFAULT_L2_CAT = '政治人物';

const CAT_MAP = { '思想家': '思想人物', '思想家/政治家': '思想人物', '君主': '统治者', '皇帝': '统治者', '帝王': '统治者', '军事家': '军事人物', '军事家/政治家': '军事人物', '外交家': '政治人物', '改革家': '政治人物', '政治家': '政治人物', '文学家': '文化人物', '文学家/政治家': '文化人物', '史学家': '文化人物', '科学家': '科技人物', '医学家': '科技人物', '工程师': '科技人物', '发明家': '科技人物' };

const persons = [];
const nameToId = {};
const l1Persons = [];
const aliasMap = {};
const addAlias = (a, c) => { if (a && String(a).trim()) aliasMap[String(a).trim()] = c; };
const missingWorkDesc = [];

let i1 = 1;
for (const r of l1) {
  const rawName = String(col(r, '姓名')).trim();
  const pm = rawName.match(/^(.+?)（(.+?)）$/);
  const name = pm ? pm[1].trim() : rawName;
  const id = 116000 + i1++;
  nameToId[name] = id;
  addAlias(name, name);
  if (pm) { addAlias(pm[1], name); addAlias(pm[2], name); addAlias(rawName, name); }
  (String(col(r, '称号') || '') || '').split(/[；;]/).forEach(a => addAlias(a, name));
  const { birth, death } = pbd(col(r, '生年'), col(r, '卒年'));
  const rawCat = String(col(r, '人物类型') || '政治人物').trim();
  const cat = CAT_MAP[rawCat] || rawCat || '政治人物';
  const influence = Number(col(r, '历史影响力')) || 80;
  const impactRaw = col(r, '影响力描述');
  const impactList = impactRaw
    ? String(impactRaw).split(/[；;]/).map(s => s.trim()).filter(Boolean)
    : [];
  const worksRaw = (() => { const fk = Object.keys(r).find(k => String(k).startsWith('代表成果')); return fk ? String(r[fk] || '') : ''; })();
  const works = worksRaw
    ? worksRaw.split(/[，,；;\n]/).filter(Boolean).map(n => {
        const wn = n.trim();
        if (!WORK_DESC_MAP_116[wn]) missingWorkDesc.push(name + '·' + wn);
        return { name: wn, description: genWorkDesc(wn) };
      }).slice(0, 5)
    : [];
  let life = [];
  const lifeRaw = col(r, '人生时间轴');
  if (lifeRaw) {
    try {
      const arr = JSON.parse(String(lifeRaw).trim());
      if (Array.isArray(arr)) {
        life = arr.map(x => ({
          year: parseYear(String(x.year || '')),
          title: String(x.title || '').trim(),
          description: String(x.description || '').trim(),
          importance: Number(x.importance) || 5
        }));
      }
    } catch (e) {}
  }
  if (!life.length) {
    let y = birth || death || 1644;
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
    id, name, dynasty: '清',
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
Object.entries(ALIAS_MAP_116).forEach(([a, c]) => { if (nameToId[c]) addAlias(a, c); });

// --- 二级人物 ---
const l2Persons = [];
let i2 = 1;
for (const r of l2) {
  const name = String(col(r, '姓名')).trim();
  if (nameToId[name]) continue;
  const id = 116100 + i2++;
  nameToId[name] = id;
  addAlias(name, name);
  const storyContent = String(col(r, '故事内容') || '').trim();
  const storyTitle = String(col(r, '故事标题') || '').trim();
  const cat = L2_CAT_MAP_116[name] || DEFAULT_L2_CAT;
  const p = {
    id, name, dynasty: '清',
    summary: '',
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

// ---- 事件 (id 1163xx) ----
const events = [];
let e1 = 1;
const TYPE_MAP = { '战争军事': '战争军事', '政治制度': '政治事件', '政治': '政治事件', '外交交流': '外交', '外交': '外交', '对外交流': '外交', '经济贸易': '经济', '经济': '经济', '思想教育': '思想文化', '思想文化': '思想文化', '文化艺术': '文化艺术', '文化': '文化艺术', '科技发明': '科技发明', '科技': '科技发明', '自然灾害': '自然灾害' };
for (const r of ev) {
  const id = 116300 + e1++;
  const name = String(col(r, '事件名称'));
  const y = parseYear(String(col(r, '发生时间') || '')) || 1644;
  const bg = {};
  for (const [k, v] of [['政治背景', 'political'], ['经济背景', 'economic'], ['社会背景', 'social'], ['文化背景', 'cultural'], ['地理背景', 'geographic']]) {
    const x = col(r, k); if (x) bg[v] = String(x);
  }
  const significance = String(col(r, '历史影响描述') || col(r, '历史影响') || '').trim();
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
    : `「${name}」作为清朝时期重要的${etype}事件，深刻影响了当时的政治格局，是理解这段历史的关键节点。`;
  events.push({
    id, name, dynasty: '清',
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

// ---- 关系归一化：人物关系表 7 类基础关系 ----
const REL_MAP_116 = {
  '君臣': '君臣', '亲属': '亲属', '继承': '继承', '敌对': '敌对', '盟友': '盟友',
  '师生': '师生', '影响': '影响',
  '同门': '师生', '政治继任': '继承', '政治冲突': '敌对',
  '学术影响': '影响', '文学影响': '影响', '艺术影响': '影响', '思想影响': '影响',
  '交流': '交流', '学术交流': '交流', '学术交往': '交流', '文学交往': '交流',
  '同僚': '同僚', '政治同僚': '同僚', '军事同僚': '同僚', '幕僚': '同僚',
  '政治合作': '盟友', '政治盟友': '盟友', '军事合作': '盟友', '军事盟友': '盟友'
};
const REL_PRIO_116 = { '亲属': 9, '父子': 9, '母子': 9, '夫妻': 9, '兄弟': 9, '祖孙': 9, '叔侄': 9, '舅甥': 9, '堂兄弟': 9, '姻亲': 9, '义父子': 9, '君臣': 9, '师生': 8, '继承': 8, '敌对': 7, '盟友': 6, '交流': 5, '影响': 4, '同僚': 3 };
// 源表亲属类统一标为「亲属」，此处按人物对还原具体关系；未列出的亲属对保留「亲属」
const KIN_DETAIL_RAW_116 = {
  '努尔哈赤|皇太极': '父子', '努尔哈赤|代善': '父子', '努尔哈赤|多尔衮': '父子',
  '努尔哈赤|褚英': '父子', '努尔哈赤|莽古尔泰': '父子', '努尔哈赤|多铎': '父子',
  '努尔哈赤|济尔哈朗': '叔侄', '皇太极|豪格': '父子', '皇太极|顺治帝': '父子',
  '代善|皇太极': '兄弟', '多尔衮|多铎': '兄弟',
  '顺治帝|康熙帝': '父子', '康熙帝|雍正帝': '父子', '雍正帝|乾隆帝': '父子',
  '乾隆帝|嘉庆帝': '父子', '嘉庆帝|道光帝': '父子', '道光帝|咸丰帝': '父子',
  '咸丰帝|同治帝': '父子', '慈禧太后|同治帝': '母子', '孝庄太后|顺治帝': '母子',
  '孝庄太后|康熙帝': '祖孙', '多尔衮|顺治帝': '叔侄', '雍正帝|胤祥': '兄弟',
  '康熙帝|胤礽': '父子', '曹雪芹|曹寅': '祖孙', '敦敏|敦诚': '兄弟'
};
const KIN_DETAIL_116 = {};
Object.entries(KIN_DETAIL_RAW_116).forEach(([k, v]) => {
  KIN_DETAIL_116[k.split('|').sort().join('|')] = v;
});
const UNKNOWN_REL = new Set();
let FLOW_ONLY = 0;

function canon(n) { return aliasMap[n] || n; }
function personByName(n) {
  return persons.find(p => p.name === n) || persons.find(p => p.name === (aliasMap[n] || ''));
}
// 每一条有向记录都保留：A→B 与 B→A 视为两条数据
const pairBest = new Map();
let REL_ROWS_DROPPED = 0;
for (const r of rel) {
  const rawA = String(col(r, '起点人物') || '').trim();
  const rawB = String(col(r, '终点人物') || '').trim();
  const a = canon(rawA);
  const b = canon(rawB);
  if (!a || !b || a === b) continue;
  const pa = personByName(a);
  const pb = personByName(b);
  // 只丢弃两端都不在册的行；一端在册时仍保留，用于在册人物的 related_people
  if (!pa && !pb) { REL_ROWS_DROPPED++; continue; }
  const raw = String(col(r, '关系类型') || '').trim();
  // 关系类型为空的行只用于因缘际会图谱，不进人物关系
  if (!raw) { FLOW_ONLY++; continue; }
  let type = REL_MAP_116[raw];
  if (!type) { UNKNOWN_REL.add(raw); continue; }
  if (type === '亲属') type = KIN_DETAIL_116[[a, b].sort().join('|')] || type;
  const key = `${a}|${b}`;
  const prev = pairBest.get(key);
  if (!prev || (REL_PRIO_116[type] || 0) > (REL_PRIO_116[prev.type] || 0)) {
    pairBest.set(key, { a, b, type, desc: String(col(r, '关系说明') || '').trim() });
  }
}
// 人物详情页按「本人-对端人物」去重，保留优先级最高的关系
const relatedMap = new Map();
function addRelated(from, to, type, desc) {
  if (!relatedMap.has(from)) relatedMap.set(from, new Map());
  const m = relatedMap.get(from);
  const prev = m.get(to);
  if (!prev || (REL_PRIO_116[type] || 0) > (REL_PRIO_116[prev.relation] || 0)) {
    m.set(to, { name: to, relation: type, influence: 75, desc });
  }
}
for (const { a, b, type, desc } of pairBest.values()) {
  addRelated(a, b, type, desc);
  addRelated(b, a, type, desc);
}
persons.forEach(p => {
  const m = relatedMap.get(p.name);
  p.related_people = (m ? [...m.values()] : [])
    .sort((x, y) => (REL_PRIO_116[y.relation] || 0) - (REL_PRIO_116[x.relation] || 0));
});

// ---- 人事关系表：按事件分组（含不在册人物）----
const ROLE_GROUP_116 = {
  '领导': 'leaders', '胜利方': 'leaders',
  '支持': 'participants', '参与': 'participants', '推动': 'participants', '完成': 'participants',
  '反对': 'opponents', '失败方': 'opponents',
  '见证': 'affected', '受影响': 'affected'
};
// 事件名别名：人事关系表用简称，事件表用全称
const EVENT_ALIAS_116 = { '后金建立': '后金建立（清朝前身）' };
const evByName = new Map(events.map(e => [e.name, e]));
const evByBase = new Map(events.map(e => [e.name.replace(/（.*?）/g, '').trim(), e]));
function matchEvent(n) {
  if (!n) return null;
  if (evByName.has(n)) return evByName.get(n);
  if (EVENT_ALIAS_116[n] && evByName.has(EVENT_ALIAS_116[n])) return evByName.get(EVENT_ALIAS_116[n]);
  const base = String(n).replace(/（.*?）/g, '').trim();
  return evByBase.get(base) || null;
}
for (const r of pev) {
  const eName = String(col(r, '事件') || '').trim();
  const pName = String(col(r, '人物') || '').trim();
  const e = matchEvent(eName); if (!e) continue;
  const p = personByName(pName);
  const name = p ? p.name : canon(pName);
  const role = String(col(r, '人事关系类型') || '').trim();
  const g = ROLE_GROUP_116[role] || 'participants';
  if (!e.person_groups[g].find(x => x.name === name)) {
    e.person_groups[g].push(p ? { name, role } : { name, role, cross_dynasty: '待接入' });
  }
  if (p && !p.related_events.find(x => x.name === e.name)) p.related_events.push({ name: e.name, role });
}
// 事件 related_persons 汇总全部出现人名（含不在册）
for (const e of events) {
  const names = new Set();
  ['leaders', 'participants', 'opponents', 'affected'].forEach(k => e.person_groups[k].forEach(x => names.add(x.name)));
  e.related_persons = [...names];
}

// ---- event.person_relations ----
for (const e of events) {
  const names = new Set();
  Object.values(e.person_groups).forEach(arr => arr.forEach(x => names.add(x.name)));
  const findPersonId = n => personByName(n)?.id;
  const rels = [];
  const seenPair = new Set();
  for (const { a, b, type, desc } of pairBest.values()) {
    if (names.has(a) && names.has(b)) {
      const key = `${a}|${b}`;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      rels.push({ source: a, target: b, type, desc, sourceId: findPersonId(a), targetId: findPersonId(b) });
    }
  }
  e.person_relations = rels.slice(0, 8);
}

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

// ---- 关键词 ----
const KC = { '时代印象': 'era', '历史概念': 'event', '政治改革': 'civilization', '历史事件': 'event', '政治理念': 'civilization', '外交制度': 'civilization', '人物': 'person', '人物故事': 'person', '历史典故': 'event', '思想文化': 'civilization', '政治格局': 'era', '战争': 'event', '制度文化': 'civilization', '科技发明': 'civilization', '核心人物': 'person', '文明制度': 'civilization', '文化地理': 'geo' };
const keywords = kw.map(r => ({ name: String(col(r, '关键词')), value: Number(col(r, '权重（100）')) || 50, category: KC[String(col(r, '类别'))] || 'era', desc: String(col(r, '关键词')) + '是清朝时期的重要概念。' }));

// ---- 写文件 ----
const out = {
  dynasty: DYN, persons, events, keywords,
  _meta: {
    imported_at: new Date().toISOString(),
    stats: { persons: persons.length, level1: persons.filter(p => p.level === 1).length, level2: persons.filter(p => p.level === 2).length, events: events.length, keywords: keywords.length },
    sources: ['1级人物数据.xlsx', '2级人物数据.xlsx', '事件数据.xlsx', '朝代热力图.xlsx', '人物关系表.xlsx', '人事关系表.xlsx']
  }
};
const target = path.join(dir, 'frontend/public/data/dynasty_116.json');
fs.writeFileSync(target, JSON.stringify(out, null, 2), 'utf-8');

console.log('dynasty_116.json 生成完成');
console.log('  人物: ' + persons.length + ' (一级 ' + persons.filter(p => p.level === 1).length + ', 二级 ' + persons.filter(p => p.level === 2).length + ')');
console.log('  事件: ' + events.length);
console.log('  关键词: ' + keywords.length);
console.log('  有向关系记录: ' + pairBest.size + '；两端均不在册丢弃: ' + REL_ROWS_DROPPED + '；因缘际会专用记录(跳过): ' + FLOW_ONLY);
if (UNKNOWN_REL.size) console.log('  [注意] 未映射关系标签: ' + [...UNKNOWN_REL].join('、'));
if (missingWorkDesc.length) console.log('  [注意] 缺少成果描述的条目: ' + missingWorkDesc.join('、'));

// ---- 依次挂载后续精修脚本（文件不存在则跳过）----
if (fs.existsSync(path.join(__dirname, 'fix_116_content.js'))) {
  console.log('\n--- 运行事件内容精修 fix_116_content.js ---');
  require('./fix_116_content.js');
}
if (fs.existsSync(path.join(__dirname, 'fix_116_summaries.js'))) {
  console.log('\n--- 运行二级人物简介精修 fix_116_summaries.js ---');
  require('./fix_116_summaries.js');
}
if (fs.existsSync(path.join(__dirname, 'enrich_116_relations.js'))) {
  console.log('\n--- 运行数据丰富 enrich_116_relations.js ---');
  require('./enrich_116_relations.js');
}

// ---- 自查（读取最终产物）----
{
  const finalData = JSON.parse(fs.readFileSync(target, 'utf-8'));
  const fp = finalData.persons || [];
  const fe = finalData.events || [];
  const l2f = fp.filter(p => p.level === 2);
  const regNames = new Set(fp.map(p => p.name));
  const extEnds = new Set();
  for (const { a, b } of pairBest.values()) {
    if (!regNames.has(a)) extEnds.add(a);
    if (!regNames.has(b)) extEnds.add(b);
  }
  const groupExt = new Set();
  fe.forEach(e => ['leaders', 'participants', 'opponents', 'affected'].forEach(k =>
    (e.person_groups?.[k] || []).forEach(x => { if (!regNames.has(x.name)) groupExt.add(x.name); })));
  const avgL2 = l2f.length ? (l2f.reduce((s, p) => s + (p.related_people || []).length, 0) / l2f.length) : 0;
  console.log('\n===== 自查 =====');
  console.log('  一级人物: ' + fp.filter(p => p.level === 1).length);
  console.log('  二级人物: ' + l2f.length + '；summary 空值: ' + l2f.filter(p => !p.summary).length);
  console.log('  事件: ' + fe.length);
  console.log('  关键词: ' + (finalData.keywords || []).length);
  console.log('  关系总数(有向去重后): ' + pairBest.size);
  console.log('  因缘际会外部端点数量(不在册唯一人名): ' + extEnds.size);
  console.log('  事件 person_groups 中非在册人物数量: ' + groupExt.size);
  console.log('  二级 related_people 平均条数: ' + avgL2.toFixed(2));
}
