/**
 * 春秋数据知识库（手工精选）
 * 为一级人物提供精简的主要贡献(works)、准确的人生轨迹(life_events)
 * 为事件提供分阶段经过(narratives)，解决"太长太啰嗦/重复"问题
 * 用法: node scripts/enrich_202.js
 */

const PERSON_ENRICHMENT = {
  '齐桓公': {
    works: [
      { name: '任用管仲', excerpt: '尊贤纳士', description: '不计前嫌拜管仲为相，授权推行改革，奠定霸业根基。' },
      { name: '尊王攘夷', excerpt: '尊周抗狄', description: '高举尊王攘夷大旗，率诸侯保卫周王室、抵御戎狄入侵。' },
      { name: '九合诸侯', excerpt: '会盟称霸', description: '先后召集诸侯会盟，成为春秋时期第一位霸主，终成"一匡天下"。' }
    ],
    life_events: [
      { year: -685, title: '即位为君', description: '击败公子纠回国即位，任用管仲开始改革', importance: 8 },
      { year: -679, title: '会盟称霸', description: '与诸侯会盟，确立春秋首霸地位', importance: 9 },
      { year: -656, title: '率师伐楚', description: '领八国联军伐楚，遏制楚国北进之势', importance: 8 },
      { year: -651, title: '葵丘会盟', description: '举行葵丘会盟，霸业达到顶峰', importance: 10 }
    ]
  },
  '管仲': {
    works: [
      { name: '辅齐改革', excerpt: '国富兵强', description: '辅佐齐桓公推行政治、经济、军事改革，使齐国迅速强盛。' },
      { name: '尊王攘夷', excerpt: '一匡天下', description: '提出尊王攘夷方略，助齐桓公九合诸侯、一匡天下。' },
      { name: '著《管子》', excerpt: '经世致用', description: '提出"仓廪实而知礼节"等重民思想，成为先秦治国典范。' }
    ],
    life_events: [
      { year: -685, title: '相齐辅政', description: '经鲍叔牙举荐为相，辅佐齐桓公富国强兵', importance: 9 },
      { year: -679, title: '助桓称霸', description: '辅佐齐桓公会盟诸侯，成就首霸之业', importance: 9 },
      { year: -656, title: '伐楚定盟', description: '随齐桓公伐楚，主持会谈订立盟约', importance: 8 }
    ]
  },
  '鲍叔牙': {
    works: [
      { name: '让贤荐管', excerpt: '知人让国', description: '力荐管仲为相，甘居其下，成为知人善荐的千古典范。' },
      { name: '辅桓复位', excerpt: '拥立有功', description: '辅佐公子小白（齐桓公）回国即位，是即位功臣。' }
    ],
    life_events: [
      { year: -685, title: '拥立齐桓公', description: '辅佐公子小白夺位，助其即位为齐桓公', importance: 8 },
      { year: -684, title: '举荐管仲', description: '向齐桓公力荐管仲，成就君臣佳话', importance: 9 }
    ]
  },
  '晋文公': {
    works: [
      { name: '流亡归国', excerpt: '十九年韬光', description: '流亡十九年后回国即位，励精图治振兴晋国。' },
      { name: '城濮之战', excerpt: '退避三舍', description: '城濮之战以"退避三舍"击败楚军，奠定中原霸主地位。' },
      { name: '践土会盟', excerpt: '受王策封', description: '践土之盟召集诸侯，受周天子策封为"侯伯"，确立霸业。' }
    ],
    life_events: [
      { year: -655, title: '流亡在外', description: '因骊姬之乱被迫流亡列国，长达十九年', importance: 7 },
      { year: -636, title: '归国即位', description: '返晋即位，任用狐偃等贤臣整顿内政', importance: 9 },
      { year: -632, title: '城濮大捷', description: '城濮之战击败楚军，一战定中原霸业', importance: 10 },
      { year: -632, title: '践土会盟', description: '会盟诸侯于践土，受封霸主之位', importance: 9 }
    ]
  },
  '狐偃': {
    works: [
      { name: '辅佐重耳', excerpt: '谋主之功', description: '作为重耳谋主随其流亡，出谋划策十九年，是晋文公霸业核心谋臣。' },
      { name: '城濮献策', excerpt: '决胜之战', description: '城濮之战前力主退避三舍以避楚锋芒，为取胜奠定基础。' }
    ],
    life_events: [
      { year: -655, title: '随君流亡', description: '随重耳流亡列国，始终不离不弃', importance: 8 },
      { year: -636, title: '辅君复位', description: '辅佐重耳归国即位，成为晋文公首辅谋臣', importance: 9 }
    ]
  },
  '赵衰': {
    works: [
      { name: '从亡辅政', excerpt: '流亡重臣', description: '随晋文公流亡多年的重臣，善于外交辞令，深得敬重。' },
      { name: '奠基赵氏', excerpt: '卿族之祖', description: '其子孙世代为卿，奠定晋国赵氏强盛家族的基础。' }
    ],
    life_events: [
      { year: -655, title: '随君流亡', description: '随重耳流亡列国，是流亡集团核心成员', importance: 8 },
      { year: -636, title: '辅弼晋室', description: '随晋文公归国，位列执政之列，赵氏由此兴起', importance: 9 }
    ]
  },
  '晋襄公': {
    works: [
      { name: '继承霸业', excerpt: '守成之主', description: '继承晋文公霸业，保持晋国对诸侯的强势影响力。' },
      { name: '殽之战', excerpt: '大破秦军', description: '于殽山伏击秦军，大获全胜，遏制秦穆公东进之势。' }
    ],
    life_events: [
      { year: -628, title: '继父即位', description: '晋文公去世后继位，延续晋国霸权', importance: 8 },
      { year: -627, title: '殽山破秦', description: '在殽之战中大败偷袭的秦军，巩固晋国霸权', importance: 9 }
    ]
  },
  '晋景公': {
    works: [
      { name: '鞍之战', excerpt: '克齐之役', description: '发动鞍之战击败齐军，维护晋国在中原的霸主地位。' },
      { name: '迁都新田', excerpt: '富国强兵', description: '迁都新田（今山西侯马），依凭沃土发展国力。' }
    ],
    life_events: [
      { year: -599, title: '即位为君', description: '即位后延续晋国争霸之业', importance: 8 },
      { year: -589, title: '鞍之战胜', description: '在鞍之战中击败齐国，巩固霸主地位', importance: 9 }
    ]
  },
  '楚庄王': {
    works: [
      { name: '一鸣惊人', excerpt: '久蛰而发', description: '三年不理朝政后一举整肃朝纲，任用贤臣，史称"一鸣惊人"。' },
      { name: '问鼎中原', excerpt: '觊觎王权', description: '陈兵周疆问九鼎轻重，显露争霸中原之雄心。' },
      { name: '邲之战', excerpt: '克晋争霸', description: '邲之战大败晋军，使楚国跻身春秋五霸之列。' }
    ],
    life_events: [
      { year: -613, title: '即位楚国', description: '继楚穆公即位，最初沉迷逸乐', importance: 7 },
      { year: -611, title: '一鸣惊人', description: '亲理朝政，诛佞用贤，楚国大治', importance: 9 },
      { year: -597, title: '邲之战胜', description: '在邲之战中大败晋军，问鼎中原', importance: 10 }
    ]
  },
  '伍举': {
    works: [
      { name: '一鸣谏君', excerpt: '以隐喻谏', description: '以"一鸣惊人"的比喻隐谏楚庄王，促其奋发图强。' },
      { name: '辅楚称霸', excerpt: '直言辅政', description: '以直谏辅佐楚庄王整肃内政，是楚国称霸的重要推手。' }
    ],
    life_events: [
      { year: -613, title: '谏王图治', description: '以"不鸣则已"隐谏楚庄王，助其励精图治', importance: 9 },
      { year: -597, title: '佐楚争霸', description: '辅佐楚庄王邲败晋军，成就楚国霸业', importance: 8 }
    ]
  },
  '鲁昭公': {
    works: [
      { name: '抵御三桓', excerpt: '强公室', description: '长期试图遏制季氏等三家卿族势力，希望恢复鲁君权威。' }
    ],
    life_events: [
      { year: -542, title: '即位为君', description: '即位时鲁国公室势力已大衰', importance: 7 },
      { year: -517, title: '败于三桓', description: '联合外部势力讨伐季氏失败，被迫流亡晋国', importance: 8 }
    ]
  },
  '鲁定公': {
    works: [
      { name: '支持孔子', excerpt: '礼贤用儒', description: '一度任用孔子为中都宰、司寇，支持其从政与夹谷会盟。' },
      { name: '夹谷会盟', excerpt: '结好齐国', description: '与齐景公夹谷会盟，在孔子协助下维护了鲁国尊严。' }
    ],
    life_events: [
      { year: -509, title: '即定为君', description: '被季氏立为鲁君，公室权力微弱', importance: 7 },
      { year: -500, title: '夹谷会盟', description: '与齐会盟于夹谷，孔子摄相事维护鲁国体面', importance: 8 },
      { year: -498, title: '任用孔子', description: '支持孔子堕三都以强公室', importance: 8 }
    ]
  },
  '鲁哀公': {
    works: [
      { name: '不甘微弱', excerpt: '试图复权', description: '曾试图借外力削弱季氏等三桓，挽救衰微的公室。' }
    ],
    life_events: [
      { year: -494, title: '即位为君', description: '即位时三桓专权，公室形同虚设', importance: 7 },
      { year: -468, title: '失位出奔', description: '图谋削三桓失败，被逼出奔越国，客死他乡', importance: 8 }
    ]
  },
  '孔子': {
    works: [
      { name: '创立儒学', excerpt: '仁礼思想', description: '创立以"仁""礼"为核心的思想体系，开儒家学派之先。' },
      { name: '删订六经', excerpt: '述而不作', description: '修《诗》《书》，定《礼》《乐》，序《周易》，作《春秋》。' },
      { name: '兴办私学', excerpt: '有教无类', description: '首开私人讲学之风，弟子三千、贤者七十二，桃李满天下。' }
    ],
    life_events: [
      { year: -551, title: '生于陬邑', description: '生于鲁国陬邑（今山东曲阜）', importance: 7 },
      { year: -501, title: '出仕为官', description: '任中都宰、大司寇，摄行相事，政绩卓著', importance: 8 },
      { year: -497, title: '周游列国', description: '率弟子周游列国十四年，虽不得志而志不改', importance: 8 },
      { year: -484, title: '归鲁修书', description: '返鲁专心整理典籍，教授弟子，终成至圣', importance: 9 }
    ]
  },
  '颜回': {
    works: [
      { name: '安贫乐道', excerpt: '贤哉回也', description: '箪食瓢饮而不改其乐，被孔子赞为"贤哉回也"。' },
      { name: '克己复礼', excerpt: '好学好德', description: '笃守仁德，是孔子眼中唯一"好学"的弟子。' }
    ],
    life_events: [
      { year: -521, title: '拜师孔子', description: '拜入孔门，天资聪颖、勤于修身', importance: 8 },
      { year: -481, title: '英年早逝', description: '早逝，令孔子哀恸，被视为孔门德行弟子的典范', importance: 9 }
    ]
  },
  '子贡': {
    works: [
      { name: '纵横外交', excerpt: '存鲁乱齐', description: '凭雄辩与外交才能，在齐、吴、越之间纵横捭阖，保全鲁国。' },
      { name: '经商致富', excerpt: '货殖典范', description: '善经商理财，富致千金，被奉为"端木遗风"的商贾楷模。' }
    ],
    life_events: [
      { year: -490, title: '事师从政', description: '长期侍奉孔子，又游说各国政治', importance: 8 },
      { year: -484, title: '匡扶鲁国', description: '以外交斡旋使齐国缓攻鲁，并助吴越相争', importance: 9 }
    ]
  },
  '曾子': {
    works: [
      { name: '传承孝道', excerpt: '以孝立教', description: '著《孝经》，将孝道发展为儒家伦理的核心范畴。' },
      { name: '慎独修身', excerpt: '吾日三省', description: '倡导"吾日三省吾身"与慎独之学，是儒家内省功夫的代表。' }
    ],
    life_events: [
      { year: -490, title: '师从孔子', description: '拜孔子为师，勤恳笃实、谨守孝道', importance: 8 },
      { year: -470, title: '传道授业', description: '传学于子思，成为孔子思想承上启下的关键', importance: 9 }
    ]
  },
  '冉有': {
    works: [
      { name: '政事之才', excerpt: '以政事见长', description: '长于政事，位居孔门"政事"科，辅佐季氏处理政务。' },
      { name: '助鲁却齐', excerpt: '临阵指挥', description: '率鲁军在郎之战中击败齐军，展现军事才能。' }
    ],
    life_events: [
      { year: -495, title: '事于季氏', description: '为季氏家臣，凭借政事才能得到重用', importance: 8 },
      { year: -484, title: '郎之战胜', description: '率鲁军败齐，为巩固鲁国作出贡献', importance: 8 }
    ]
  },
  '季孙氏（季平子）': {
    works: [
      { name: '专擅鲁政', excerpt: '三桓之首', description: '作为季氏宗主执掌鲁政，使季氏在"三桓"中势力最盛。' }
    ],
    life_events: [
      { year: -534, title: '执掌鲁政', description: '为鲁执政，季氏权倾鲁国', importance: 8 },
      { year: -517, title: '逼走昭公', description: '深结晋卿以自固，迫使鲁昭公流亡', importance: 8 }
    ]
  },
  '季康子': {
    works: [
      { name: '权倾鲁国', excerpt: '末季强卿', description: '执掌鲁政，是春秋末年鲁国最有权势的卿大夫。' },
      { name: '改用田赋', excerpt: '改革赋税', description: '推行"用田赋"，强化季氏对鲁国财政的控制。' }
    ],
    life_events: [
      { year: -493, title: '嗣位执政', description: '继为季氏宗主，掌鲁国大政', importance: 8 },
      { year: -484, title: '用田赋', description: '推行田赋改制，进一步强化私室力量', importance: 8 }
    ]
  },
  '叔孙氏（叔孙穆子）': {
    works: [
      { name: '表里如一', excerpt: '名节无损', description: '以诚信著称，位列三桓而重名节，是卿大夫中的贤者。' }
    ],
    life_events: [
      { year: -589, title: '佐政鲁国', description: '为鲁卿，参与三桓共执朝政', importance: 7 },
      { year: -574, title: '保节去国', description: '以正身自守闻名，虽遭家难而不坠名节', importance: 8 }
    ]
  },
  '晏婴': {
    works: [
      { name: '辅佐三君', excerpt: '俭朴贤相', description: '历事齐灵公、庄公、景公三代，以节俭力行著称。' },
      { name: '晏子使楚', excerpt: '不辱使命', description: '使楚不辱国体，机智善辩，成语"南橘北枳""挥汗成雨"皆出其出使。' },
      { name: '听说善谏', excerpt: '直言劝主', description: '屡次劝谏齐景公省刑薄敛，是"二桃杀三士"故事中的智者。' }
    ],
    life_events: [
      { year: -556, title: '嗣位为卿', description: '继父出任齐卿，历仕三朝', importance: 8 },
      { year: -531, title: '使楚不辱', description: '出使楚国挫楚王锋芒，维护齐国尊严', importance: 9 },
      { year: -500, title: '病逝于齐', description: '卒于相位，身后家无余财', importance: 8 }
    ]
  },
  '齐景公': {
    works: [
      { name: '励精图治', excerpt: '重振齐威', description: '任用晏婴、司马穰苴等贤臣，一度重振齐国的东方一大国的地位。' },
      { name: '执牛耳盟', excerpt: '再主会盟', description: '曾主盟诸侯，与晋国相对抗，维持齐国霸主余威。' }
    ],
    life_events: [
      { year: -547, title: '即位为君', description: '继齐庄公即位，任用晏婴整顿内政', importance: 8 },
      { year: -517, title: '会盟诸侯', description: '谋求重振齐国霸业，与晋争衡', importance: 8 },
      { year: -490, title: '临终托孤', description: '病危时欲立太子而终未果，齐国内乱再起', importance: 7 }
    ]
  },
  '田乞': {
    works: [
      { name: '收买人心', excerpt: '大斗出小斗入', description: '以大斗借出、小斗收回收买民心，为田氏代齐奠定基础。' }
    ],
    life_events: [
      { year: -530, title: '柄齐国政', description: '为田氏宗主，逐渐掌握齐国大权', importance: 8 },
      { year: -489, title: '擅立景公立', description: '发动政变拥立齐景公之子为君，专擅朝政', importance: 8 }
    ]
  },
  '崔杼': {
    works: [
      { name: '弑君乱齐', excerpt: '权臣专横', description: '专横擅权，弑齐庄公，又逼史官曲笔，最终身败名裂。' }
    ],
    life_events: [
      { year: -572, title: '执政齐国', description: '为齐卿，在齐国内乱中一度掌权', importance: 7 },
      { year: -548, title: '崔杼弑君', description: '弑齐庄公，欲让史官"书以崔氏之罪"而不可得', importance: 8 }
    ]
  },
  '齐庄公': {
    works: [
      { name: '伐卫侵晋', excerpt: '以武争胜', description: '在位好勇斗狠，多次对外用兵，挑战晋国霸权。' }
    ],
    life_events: [
      { year: -553, title: '即位为君', description: '即位后依仗齐国民望对外争胜', importance: 7 },
      { year: -548, title: '被杀于宫', description: '因私通崔杼之妻，为崔杼所弑', importance: 7 }
    ]
  },
  '郑庄公': {
    works: [
      { name: '小霸中原', excerpt: '射王中肩', description: '缮葛之战击败周桓王联军，"射王中肩"，开诸侯抗王之先河，史称"小霸"。' },
      { name: '克段于鄢', excerpt: '翦除内患', description: '平定共叔段之乱，巩固郑国统治，是春秋初期强主。' }
    ],
    life_events: [
      { year: -743, title: '即位执政', description: '继承郑伯之位，谋划强郑之业', importance: 8 },
      { year: -722, title: '克段于鄢', description: '平定共叔段与母亲武姜之乱', importance: 8 },
      { year: -707, title: '缮葛败王', description: '缮葛之战射中周桓王之肩，郑国小霸', importance: 9 }
    ]
  },
  '祭仲': {
    works: [
      { name: '辅郑三君', excerpt: '翼庄之臣', description: '长期辅佐郑庄公，是春秋初期郑国崛起的重要谋臣。' }
    ],
    life_events: [
      { year: -739, title: '事郑庄公', description: '为郑庄公重臣，参决郑国大政', importance: 8 },
      { year: -707, title: '佐郑抗王', description: '缮葛之战佐郑庄公挫败王室联军', importance: 8 }
    ]
  },
  '子产': {
    works: [
      { name: '铸刑书', excerpt: '公布成文法', description: '将刑书铸于鼎上公布，是中国最早的成文法公布事件。' },
      { name: '宽猛相济', excerpt: '治国至理', description: '主张"宽猛相济"治理郑国，使小国在群雄间安然立足。' },
      { name: '不毁乡校', excerpt: '重视民意', description: '主张保留乡校让百姓议政，"防民之口甚于防川"的正面典范。' }
    ],
    life_events: [
      { year: -543, title: '执政郑国', description: '受命为郑国执政，整顿田洫、井然有序', importance: 9 },
      { year: -536, title: '铸刑书', description: '铸刑书于鼎，明确法度', importance: 9 },
      { year: -522, title: '病卒于郑', description: '卒时郑人巷哭，孔子称其为"惠人"', importance: 8 }
    ]
  },
  '叔向': {
    works: [
      { name: '持平为政', excerpt: '晋国名臣', description: '历仕晋悼公至晋顷公，以明辨是非、拒绝贿赂著称。' }
    ],
    life_events: [
      { year: -560, title: '任晋上卿', description: '为晋国上卿，名重诸侯', importance: 8 },
      { year: -536, title: '论郑铸刑', description: '与子产论铸刑书，主张"礼治"而反对公布刑法', importance: 7 }
    ]
  },
  '伍子胥': {
    works: [
      { name: '奔吴辅主', excerpt: '龙腾虎跃', description: '因父兄被害奔吴，辅佐吴王阖闾、夫差，助吴崛兴。' },
      { name: '破楚复仇', excerpt: '掘墓鞭尸', description: '率吴军攻破郢都，为父兄复仇，雪耻名震天下。' }
    ],
    life_events: [
      { year: -522, title: '奔吴避难', description: '父兄为楚平王所杀，逃亡至吴国', importance: 8 },
      { year: -506, title: '破楚复仇', description: '随吴军一鼓破郢，鞭尸楚平王以报父仇', importance: 10 },
      { year: -484, title: '赐剑自尽', description: '谏夫差灭越反遭猜忌，被赐属镂剑自杀', importance: 9 }
    ]
  },
  '孙武': {
    works: [
      { name: '著《孙子兵法》', excerpt: '兵学圣典', description: '所著《孙子兵法》十三篇，被誉为"百世兵家之师"。' },
      { name: '吴宫教战', excerpt: '斩美立威', description: '以"治军以严"斩杀吴王宠姬立威，终获吴王拜将。' },
      { name: '助吴强兵', excerpt: '破楚克郢', description: '辅佐吴王操练劲旅，为吴国破楚称雄提供军事支撑。' }
    ],
    life_events: [
      { year: -512, title: '吴宫教战', description: '以严治军斩妃立威，吴王拜其为将', importance: 9 },
      { year: -506, title: '佐吴破楚', description: '运用谋略助吴军五战五捷、攻入楚都', importance: 9 }
    ]
  },
  '夫差': {
    works: [
      { name: '报杀父之仇', excerpt: '御儿之志', description: '即位后励志雪耻，在夫椒之战击败越国，报杀父之仇。' },
      { name: '观兵黄池', excerpt: '争霸中原', description: '会盟黄池与晋争长，欲争当霸主，却因后方空虚致越祸终成。' }
    ],
    life_events: [
      { year: -495, title: '即位为君', description: '继阖闾之位，常使人呼"夫差而忘越王杀而父乎"以自警', importance: 8 },
      { year: -494, title: '夫椒胜越', description: '败越于夫椒，越王勾践屈膝求和', importance: 9 },
      { year: -482, title: '黄池会盟', description: '与晋争霸黄池，越国乘虚攻吴', importance: 8 },
      { year: -473, title: '吴亡自刎', description: '被越王勾践所灭，羞愤自刎', importance: 9 }
    ]
  },
  '越王勾践': {
    works: [
      { name: '卧薪尝胆', excerpt: '十年生聚', description: '战败后卧薪尝胆、励精图治，是忍辱复仇的千古典范。' },
      { name: '灭吴称霸', excerpt: '三千越甲', description: '在范蠡、文种辅佐下东山再起，一举灭吴，成春秋末代霸主。' }
    ],
    life_events: [
      { year: -496, title: '即位越王', description: '继位为越王，开始与吴争锋', importance: 8 },
      { year: -494, title: '会稽之耻', description: '夫椒战败，屈膝事吴，身为人质', importance: 8 },
      { year: -473, title: '灭吴称霸', description: '趁吴国疲敝灭吴，威震诸侯', importance: 10 }
    ]
  },
  '范蠡': {
    works: [
      { name: '辅越灭吴', excerpt: '三计复国', description: '与文种同辅勾践，"十年生聚、十年教训"，终以弱胜强灭吴。' },
      { name: '功成身退', excerpt: '鸱夷泛舟', description: '功成后携利遁退，因善经商成"陶朱公"，被尊为商圣。' }
    ],
    life_events: [
      { year: -494, title: '事越受辱', description: '劝勾践忍辱，随其至吴为质', importance: 8 },
      { year: -473, title: '助越灭吴', description: '运筹帷幄助越灭吴，成就霸业', importance: 10 },
      { year: -468, title: '泛舟归隐', description: '功成身退，化名陶朱公经商致富', importance: 8 }
    ]
  },
  '文种': {
    works: [
      { name: '献计灭吴', excerpt: '九术兴越', description: '进献"伐吴九术"，为越国灭吴提供战略蓝图。' },
      { name: '兴越富民', excerpt: '内政之臣', description: '主管越国内政，助勾践复国强兵。' }
    ],
    life_events: [
      { year: -494, title: '辅勾践归', description: '与范蠡同辅勾践，共谋复国', importance: 8 },
      { year: -473, title: '越国称霸', description: '复国灭吴，越王功成', importance: 9 },
      { year: -472, title: '被赐自尽', description: '因"兔死狗烹"见忌于勾践，被迫自杀', importance: 8 }
    ]
  },
  '晋厉公': {
    works: [
      { name: '鄢陵之战', excerpt: '败楚争霸', description: '鄢陵之战击败楚军，一度遏制楚国北进，重振晋国军威。' },
      { name: '集权失败', excerpt: '失于内乱', description: '企图削弱卿族夺回君权，反被栾书等卿族诛杀。' }
    ],
    life_events: [
      { year: -581, title: '即位为君', description: '即位后谋图振兴王权、削弱卿族', importance: 7 },
      { year: -575, title: '鄢陵败楚', description: '鄢陵之战击败楚共王', importance: 8 },
      { year: -573, title: '被弑失位', description: '被栾书、中行偃弑于匠丽氏', importance: 8 }
    ]
  },
  '老子': {
    works: [
      { name: '著《道德经》', excerpt: '道法自然', description: '著《道德经》五千言，创立道家学说，影响深远。' },
      { name: '无为而治', excerpt: '柔能克刚', description: '提出"无为而治""柔弱胜刚强"，成为道家治国与人生哲学。' }
    ],
    life_events: [
      { year: -521, title: '居周守藏', description: '任周朝守藏室之史，博通礼乐', importance: 8 },
      { year: -486, title: '出关著书', description: '见周衰西出函谷关，应关令尹喜之请著《道德经》', importance: 9 }
    ]
  }
};

const EVENT_ENRICHMENT = {
  '平王东迁': {
    narratives: [
      { year: -771, title: '犬戎破镐京', description: '犬戎联合申侯攻破镐京，周幽王被杀，西周覆亡', tag: '背景' },
      { year: -770, title: '平王即位', description: '周平王在雒邑继位，正式开启东周时代', tag: '转折' },
      { year: -770, title: '迁都洛邑', description: '因镐京残破难守，平王东迁至洛邑，王权由此衰微', tag: '东迁' }
    ],
    background: { political: '西周覆亡后，周王室权威扫地，诸侯势力蒸蒸日上。', social: '关中遭兵燹之灾，百姓东迁寻求安定。', geographic: '洛邑居中原腹地、近东诸侯，利于周室存续。' },
    impacts: [
      { name: '政治影响', score: 96, description: '周王室衰微，诸侯争霸局面由此开启' },
      { name: '历史影响', score: 98, description: '中国历史进入春秋时代' }
    ],
    chain: [
      { title: '烽火戏诸侯', year: '前771年', type: 'cause', color: '#D8B26A' },
      { title: '平王东迁', year: '前770年', type: 'event', color: '#C34739' },
      { title: '繻葛之战', year: '前707年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '繻葛之战': {
    narratives: [
      { year: -707, title: '君臣交恶', description: '周桓王夺郑庄公卿士之职，郑庄公不满，不再朝见周王', tag: '背景' },
      { year: -707, title: '王师来伐', description: '周桓王亲率虢、蔡、卫、陈联军讨伐郑国', tag: '开战' },
      { year: -707, title: '射王中肩', description: '郑军用鱼丽之阵大败王师，祝聃一箭射中桓王肩膀', tag: '决胜' }
    ],
    background: { political: '郑庄公小霸中原，与周王室矛盾日益激化。', cultural: '开诸侯武力对抗周天子之先河，礼乐秩序濒临崩溃。' },
    impacts: [
      { name: '政治影响', score: 92, description: '周天子威信扫地，诸侯不再尊奉王室' },
      { name: '历史影响', score: 90, description: '"礼乐征伐自诸侯出"的时代正式开始' }
    ],
    chain: [
      { title: '平王东迁', year: '前770年', type: 'cause', color: '#D8B26A' },
      { title: '繻葛之战', year: '前707年', type: 'event', color: '#C34739' },
      { title: '齐桓称霸', year: '前679年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '齐桓公即位与管仲改革': {
    narratives: [
      { year: -686, title: '公孙无知之乱', description: '齐国内乱，公孙无知弑君自立，齐政动荡', tag: '背景' },
      { year: -685, title: '齐桓即位', description: '公子小白回国即位为齐桓公，任用鲍叔牙为辅', tag: '即位' },
      { year: -685, title: '管仲为相', description: '鲍叔牙力荐管仲，齐桓公捐弃前嫌拜其为相', tag: '任贤' },
      { year: -684, title: '厉行改革', description: '管仲推行军政、经济、用人改革，齐国由弱转强', tag: '改制' }
    ],
    background: { political: '齐国内乱频仍，国势不振，亟待整顿。', economic: '管仲主张"通货积财，富国强兵"。' },
    impacts: [
      { name: '政治影响', score: 95, description: '齐国强盛，奠定春秋首霸基础' },
      { name: '文化影响', score: 90, description: '管仲改制成为先秦改革典范' }
    ],
    chain: [
      { title: '齐桓即位', year: '前685年', type: 'event', color: '#C34739' },
      { title: '葵丘会盟', year: '前651年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '齐桓公伐楚': {
    narratives: [
      { year: -656, title: '楚侵中原', description: '楚成王北进，灭蔡伐郑，威胁中原诸侯', tag: '背景' },
      { year: -656, title: '齐率诸侯伐楚', description: '齐桓公率鲁、宋等八国联军伐楚，进驻召陵', tag: '伐楚' },
      { year: -656, title: '召陵之盟', description: '楚遣屈完求和，齐楚在召陵会盟，楚暂退兵', tag: '定盟' }
    ],
    background: { political: '楚国势力北扩，冲击齐桓公的霸主地位。' },
    impacts: [
      { name: '政治影响', score: 88, description: '遏制楚国北进，维护齐霸格局' },
      { name: '外交影响', score: 85, description: '召陵之盟成为春秋外交典范' }
    ],
    chain: [
      { title: '齐桓称霸', year: '前679年', type: 'cause', color: '#D8B26A' },
      { title: '齐桓公伐楚', year: '前656年', type: 'event', color: '#C34739' },
      { title: '葵丘会盟', year: '前651年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '葵丘会盟': {
    narratives: [
      { year: -651, title: '齐霸巅峰', description: '齐桓公与众诸侯会盟于葵丘（今河南民权）', tag: '会盟' },
      { year: -651, title: '周王遣使', description: '周襄王派宰孔赐胙，对齐桓公以示嘉许', tag: '承命' },
      { year: -651, title: '订立盟约', description: '盟约约定互不侵害、尊重王室，齐桓公霸业由此登顶', tag: '定盟' }
    ],
    background: { political: '齐桓公尊王攘夷多年，武功与威望达到顶点。' },
    impacts: [
      { name: '政治影响', score: 96, description: '确立齐桓公春秋首霸地位' },
      { name: '历史影响', score: 90, description: '葵丘之盟成为霸政的典范会盟' }
    ],
    chain: [
      { title: '齐桓公伐楚', year: '前656年', type: 'cause', color: '#D8B26A' },
      { title: '葵丘会盟', year: '前651年', type: 'event', color: '#C34739' },
      { title: '齐桓之死', year: '前643年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '重耳返晋即位': {
    narratives: [
      { year: -655, title: '骊姬之乱', description: '晋献公宠幸骊姬，逼杀太子申生，重耳被迫流亡', tag: '背景' },
      { year: -636, title: '秦助返晋', description: '重耳在秦国相助下回国，夺取君位为晋文公', tag: '即位' },
      { year: -636, title: '整顿内政', description: '任用狐偃、赵衰等贤臣，轻税薄敛，人心归附', tag: '图治' }
    ],
    background: { political: '晋国内乱，献公诸子争立，国势动荡。' },
    impacts: [
      { name: '政治影响', score: 92, description: '晋国复苏，为称霸中原奠定基础' },
      { name: '历史影响', score: 88, description: '重耳流亡中兴成为后世励志典范' }
    ],
    chain: [
      { title: '骊姬之乱', year: '前656年', type: 'cause', color: '#D8B26A' },
      { title: '重耳返晋即位', year: '前636年', type: 'event', color: '#C34739' },
      { title: '城濮之战', year: '前632年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '介之推隐居绵山': {
    narratives: [
      { year: -636, title: '辞禄不授', description: '晋文公分封功臣而未及介之推，其不求封赏', tag: '背景' },
      { year: -636, title: '携母隐居', description: '介之推携母隐居绵山，不复出仕', tag: '隐居' },
      { year: -636, title: '母子被焚', description: '晋文公寻而不得，焚山欲逼其出，介之推抱树而死', tag: '结局' }
    ],
    background: { social: '介之推淡泊名利，与争功邀赏者形成鲜明对比。' },
    impacts: [
      { name: '文化影响', score: 90, description: '寒食节习俗由此而生，成为忠孝清廉的象征' },
      { name: '历史影响', score: 85, description: '介子推死于绵山成为千古悼念的主题' }
    ],
    chain: [
      { title: '重耳返晋即位', year: '前636年', type: 'cause', color: '#D8B26A' },
      { title: '介之推隐居绵山', year: '前636年', type: 'event', color: '#C34739' }
    ]
  },
  '城濮之战': {
    narratives: [
      { year: -633, title: '楚围宋国', description: '楚成王亲率联军围宋，宋向晋求救', tag: '背景' },
      { year: -632, title: '晋伐曹卫', description: '晋文公攻打楚之盟国曹、卫，以诱楚撤围', tag: '伐敌' },
      { year: -632, title: '退避三舍', description: '晋军退避三舍信守前诺，诱楚军深入', tag: '折冲' },
      { year: -632, title: '大破楚军', description: '城濮决战，晋军大败楚军，一战定霸', tag: '决胜' }
    ],
    background: { political: '晋楚争霸中原，宋降晋成为导火索。', geographic: '城濮（今山东鄄城一带）处中原要冲。' },
    impacts: [
      { name: '政治影响', score: 97, description: '晋文公确立中原霸主地位' },
      { name: '军事影响', score: 95, description: '""退避三舍"成兵法与信义的典范' },
      { name: '历史影响', score: 94, description: '奠定晋楚长期争霸的基本格局' }
    ],
    chain: [
      { title: '重耳返晋即位', year: '前636年', type: 'cause', color: '#D8B26A' },
      { title: '城濮之战', year: '前632年', type: 'event', color: '#C34739' },
      { title: '践土会盟', year: '前632年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '秦晋殽之战': {
    narratives: [
      { year: -628, title: '郑人告密', description: '秦穆公谋袭郑国，郑人弦高犒师示警，秦军退', tag: '背景' },
      { year: -627, title: '秦过晋境', description: '秦军回师经晋殽山险道，晋襄公设伏以待', tag: '设伏' },
      { year: -627, title: '伏击全歼', description: '晋军于殽山伏击，秦军主帅孟明视等被俘', tag: '决战' },
      { year: -627, title: '放归三帅', description: '晋文公夫人文嬴出于私情放归秦三帅，为后患埋下伏笔', tag: '余波' }
    ],
    background: { geographic: '殽山（今河南渑池一带）为关中通中原之险道。' },
    impacts: [
      { name: '政治影响', score: 90, description: '遏制秦东进，巩固晋的霸主地位' },
      { name: '历史影响', score: 85, description: '崤之战成为秦晋世仇的重要转折点' }
    ],
    chain: [
      { title: '城濮之战', year: '前632年', type: 'cause', color: '#D8B26A' },
      { title: '秦晋殽之战', year: '前627年', type: 'event', color: '#C34739' }
    ]
  },
  '赵穿弑晋灵公': {
    narratives: [
      { year: -607, title: '灵公暴虐', description: '晋灵公荒淫暴虐，厚敛民财、戏于台上', tag: '背景' },
      { year: -607, title: '灵公欲杀赵盾', description: '灵公多次谋害忠臣赵盾，赵盾被迫出逃', tag: '生隙' },
      { year: -607, title: '赵穿弑君', description: '赵穿在桃园弑晋灵公，赵盾返国复位', tag: '弑君' }
    ],
    background: { political: '晋灵公昏聩，卿族与君权矛盾激化。' },
    impacts: [
      { name: '政治影响', score: 88, description: '晋国卿族势力更盛，君权进一步削弱' },
      { name: '文化影响', score: 85, description: '引发"赵盾弑其君"书法之争，成为史学典范' }
    ],
    chain: [
      { title: '赵穿弑晋灵公', year: '前607年', type: 'event', color: '#C34739' },
      { title: '董狐书弑君', year: '前607年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '董狐书“赵盾弑其君”': {
    narratives: [
      { year: -607, title: '弑君事发', description: '赵穿弑灵公，赵盾仓促返国立新君', tag: '背景' },
      { year: -607, title: '太史直书', description: '晋太史董狐直书"赵盾弑其君"，不顾情面', tag: '直笔' },
      { year: -607, title: '孔子称善', description: '孔子赞董狐为"古之良史"，书法不隐', tag: '定评' }
    ],
    background: { cultural: '史官"书法不隐"的传统由此彰显。' },
    impacts: [
      { name: '文化影响', score: 95, description: '史官秉笔直书，成为史学"直笔"的典范' },
      { name: '历史影响', score: 90, description: '"董狐之笔"成为后世评价良史的标尺' }
    ],
    chain: [
      { title: '赵穿弑晋灵公', year: '前607年', type: 'cause', color: '#D8B26A' },
      { title: '董狐书弑君', year: '前607年', type: 'event', color: '#C34739' }
    ]
  },
  '楚庄王问鼎中原': {
    narratives: [
      { year: -606, title: '楚伐陆浑', description: '楚庄王北伐陆浑之戎，陈兵于周王畿边界', tag: '背景' },
      { year: -606, title: '问鼎轻重', description: '楚庄王观兵周疆，问周鼎"大小轻重"，觊觎王权', tag: '问鼎' },
      { year: -606, title: '王孙满对', description: '周大夫王孙满答以"在德不在鼎"，使楚退兵', tag: '讥退' }
    ],
    background: { political: '楚国力强盛，楚庄王野心勃勃，欲图天下。' },
    impacts: [
      { name: '政治影响', score: 92, description: '党的楚国对中原王权威胁日增' },
      { name: '文化影响', score: 90, description: '"问鼎中原"成为觊觎最高权力的著名典故' }
    ],
    chain: [
      { title: '楚庄王问鼎中原', year: '前606年', type: 'event', color: '#C34739' },
      { title: '邲之战', year: '前597年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '邲之战': {
    narratives: [
      { year: -597, title: '楚攻郑国', description: '楚庄王攻郑，郑降楚，晋国出兵救郑', tag: '背景' },
      { year: -597, title: '晋楚对峙', description: '晋、楚两军于邲（今河南荥阳北）相遇', tag: '对垒' },
      { year: -597, title: '晋军大败', description: '因主帅和与战不定、议事不决，晋军大败而逃', tag: '决战' },
      { year: -597, title: '楚霸南天', description: '楚庄王由此饮马黄河，成为春秋五霸之一', tag: '称霸' }
    ],
    background: { political: '晋楚争霸胶着，郑为两国争夺焦点。', geographic: '邲地处黄河南岸，为中原冲要。' },
    impacts: [
      { name: '政治影响', score: 95, description: '楚庄王称霸南北，楚国国势达于顶峰' },
      { name: '军事影响', score: 88, description: '邲之战展示楚军战力与晋帅失和之弊' },
      { name: '历史影响', score: 90, description: '晋楚势均力敌，推动弭兵会盟之议' }
    ],
    chain: [
      { title: '楚庄王问鼎中原', year: '前606年', type: 'cause', color: '#D8B26A' },
      { title: '邲之战', year: '前597年', type: 'event', color: '#C34739' }
    ]
  },
  '鞍之战': {
    narratives: [
      { year: -589, title: '齐伐鲁卫', description: '齐顷公伐鲁、卫，二国求救于晋', tag: '背景' },
      { year: -589, title: '晋师来援', description: '晋景公派郤克率军救鲁卫，与齐战于鞍', tag: '应援' },
      { year: -589, title: '齐师大败', description: '晋军大破齐师，齐顷公险些被俘', tag: '决战' },
      { year: -589, title: '齐晋盟约', description: '齐国求和，晋齐盟于爰娄，齐折服于晋', tag: '定盟' }
    ],
    background: { political: '齐国东进挑战晋国霸权，二强矛盾激化。' },
    impacts: [
      { name: '政治影响', score: 90, description: '巩固晋国在中原的霸主地位' },
      { name: '历史影响', score: 85, description: '鞍之战后晋齐长期保持尊卑关系' }
    ],
    chain: [
      { title: '邲之战', year: '前597年', type: 'cause', color: '#D8B26A' },
      { title: '鞍之战', year: '前589年', type: 'event', color: '#C34739' }
    ]
  },
  '士会返晋': {
    narratives: [
      { year: -620, title: '奔秦避祸', description: '因晋国内乱，士会出奔秦国避难', tag: '背景' },
      { year: -614, title: '秦晋相持', description: '秦晋交恶，士会以才智为秦所重，晋深忌之', tag: '生隙' },
      { year: -614, title: '诱返晋国', description: '晋使魏寿余伪奔秦，诱俘士会归晋', tag: '归晋' },
      { year: -613, title: '出任执政', description: '士会返晋后任中军帅，修明内政，晋国大治', tag: '为政' }
    ],
    background: { political: '士会贤能，晋秦皆欲得之，成为外交争夺对象。' },
    impacts: [
      { name: '政治影响', score: 88, description: '士会归晋，晋国政通人和' },
      { name: '历史影响', score: 82, description: '"得士则昌"的外交智慧成为后世借鉴' }
    ],
    chain: [
      { title: '士会返晋', year: '前614年', type: 'event', color: '#C34739' }
    ]
  },
  '鄢陵之战': {
    narratives: [
      { year: -576, title: '晋楚将战', description: '楚共王欲争郑、宋，与晋军对峙于鄢陵', tag: '背景' },
      { year: -575, title: '对峙鄢陵', description: '两军遇于鄢陵（今河南鄢陵北），相持不安', tag: '对垒' },
      { year: -575, title: '晋军扬威', description: '晋军射伤楚共王之目，楚军夜遁', tag: '决战' },
      { year: -575, title: '晋国复振', description: '鄢陵之战晋胜，重振晋国霸业声威', tag: '称强' }
    ],
    background: { political: '晋厉公有志于重振霸权，楚亦图北进。' },
    impacts: [
      { name: '政治影响', score: 92, description: '晋国威信重振，楚国北进受挫' },
      { name: '军事影响', score: 85, description: '晋军以谋制胜，展示了内部分歧下的险胜' }
    ],
    chain: [
      { title: '鄢陵之战', year: '前575年', type: 'event', color: '#C34739' },
      { title: '栾书弑晋厉公', year: '前573年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '栾书弑晋厉公': {
    narratives: [
      { year: -575, title: '厉公集权', description: '晋厉公鄢陵胜楚后，意欲除去诸卿、加强君权', tag: '背景' },
      { year: -574, title: '厉公诛卿', description: '晋厉公诛杀三郤（郤至等），栾书中行偃人人自危', tag: '逼反' },
      { year: -573, title: '栾书弑君', description: '栾书、中行偃执晋厉公，弑之于匠丽氏', tag: '弑君' },
      { year: -573, title: '迎立悼公', description: '栾书等迎立公子周为君，是为晋悼公', tag: '改立' }
    ],
    background: { political: '晋国卿族专权，君权与卿权矛盾白热化。' },
    impacts: [
      { name: '政治影响', score: 90, description: '晋卿族权势更盛，为六卿崛起埋下伏笔' },
      { name: '历史影响', score: 85, description: '卿弑君之例渐多，标志君权衰微、卿权上升' }
    ],
    chain: [
      { title: '鄢陵之战', year: '前575年', type: 'cause', color: '#D8B26A' },
      { title: '栾书弑晋厉公', year: '前573年', type: 'event', color: '#C34739' },
      { title: '晋悼公即位', year: '前573年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '晋悼公即位与晋国复兴': {
    narratives: [
      { year: -573, title: '亡国公子', description: '晋悼公为晋襄公曾孙，流落洛邑，栾书迎而立之', tag: '背景' },
      { year: -573, title: '即位明志', description: '悼公即位即宣布"以君临诸卿"，重整纲纪', tag: '即位' },
      { year: -572, title: '任用贤能', description: '任用魏绛、韩厥等贤臣，拨乱反正', tag: '图治' },
      { year: -569, title: '霸业中兴', description: '悼公复霸，诸侯归附，史称"晋国复兴"', tag: '复兴' }
    ],
    background: { political: '晋厉公死后国政紊乱，急需明君整饬。' },
    impacts: [
      { name: '政治影响', score: 95, description: '晋国霸业再度鼎盛，悼公成中兴霸主' },
      { name: '历史影响', score: 90, description: '晋悼公之治成为君强臣顺的治国典范' }
    ],
    chain: [
      { title: '栾书弑晋厉公', year: '前573年', type: 'cause', color: '#D8B26A' },
      { title: '晋悼公即位与晋国复兴', year: '前573年', type: 'event', color: '#C34739' },
      { title: '三国分晋', year: '前453年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '魏绛和戎': {
    narratives: [
      { year: -569, title: '戎族来犯', description: '山戎无终国遣使求与晋和好，众议不一', tag: '背景' },
      { year: -569, title: '魏绛进言', description: '魏绛上"和戎五利"，力主与戎讲和', tag: '定策' },
      { year: -569, title: '晋戎结盟', description: '晋悼公采纳魏绛之策，与诸戎订立盟约', tag: '和盟' },
      { year: -562, title: '辑睦相安', description: '和戎后晋无西顾之忧，得以专心与楚争霸', tag: '成效' }
    ],
    background: { geographic: '晋之西、北为戎狄分布，征伐不止、耗损国力。' },
    impacts: [
      { name: '政治影响', score: 88, description: '稳定西部边境，为晋国争霸解除后顾之忧' },
      { name: '文化影响', score: 86, description: '和戎思想成为处理民族关系的重要借鉴' }
    ],
    chain: [
      { title: '晋悼公即位', year: '前573年', type: 'cause', color: '#D8B26A' },
      { title: '魏绛和戎', year: '前569年', type: 'event', color: '#C34739' }
    ]
  },
  '晋楚弭兵会盟': {
    narratives: [
      { year: -579, title: '第一次弭兵', description: '在华元的调停下，晋楚于宋西门首次盟誓弭兵', tag: '首盟' },
      { year: -577, title: '盟约破裂', description: '因南方楚国进犯，第一次弭兵盟约迅速破裂', tag: '破裂' },
      { year: -546, title: '宋国再倡', description: '宋国大夫向戌奔走斡旋，晋楚等十国复会于宋', tag: '再倡' },
      { year: -546, title: '四十载休兵', description: '第二次弭兵会盟达成，晋楚不再大战，中原稍安', tag: '成盟' }
    ],
    background: { political: '晋楚争霸数十年，国力俱疲，各国均望休战。' },
    impacts: [
      { name: '政治影响', score: 92, description: '晋楚平分霸权，中原获得难得和平' },
      { name: '历史影响', score: 90, description: '弭兵之会成为春秋由霸政走向列国对峙的转折' }
    ],
    chain: [
      { title: '邲之战', year: '前597年', type: 'cause', color: '#D8B26A' },
      { title: '晋楚弭兵会盟', year: '前546年', type: 'event', color: '#C34739' }
    ]
  },
  '晋国六卿崛起': {
    narratives: [
      { year: -589, title: '增设六卿', description: '晋国设六卿之职，分掌军政，权柄渐向卿族集中', tag: '建制' },
      { year: -588, title: '郤氏崛起', description: '郤氏、栾氏等卿族扩充封地、培植私兵', tag: '坐大' },
      { year: -514, title: '灭祁氏', description: '卿族合力灭祁氏、羊舌氏，六卿专晋政', tag: '兼并' },
      { year: -490, title: '六卿制晋', description: '晋君权力空悬，实权尽归六卿之手', tag: '专权' }
    ],
    background: { political: '晋君权代代削弱，卿族势力代代坐大。' },
    impacts: [
      { name: '政治影响', score: 95, description: '晋国政出多门，为三家分晋埋下伏笔' },
      { name: '历史影响', score: 94, description: '六卿兼并开启战国卿族夺国的先声' }
    ],
    chain: [
      { title: '栾书弑晋厉公', year: '前573年', type: 'cause', color: '#D8B26A' },
      { title: '晋国六卿崛起', year: '前490年', type: 'event', color: '#C34739' },
      { title: '三家分晋', year: '前453年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '吴王阖闾即位': {
    narratives: [
      { year: -526, title: '公子世系', description: '吴王僚在位，公子光（阖闾）心怀夺位之志', tag: '背景' },
      { year: -515, title: '专诸刺僚', description: '阖闾用专诸刺杀吴王僚，自立为吴王', tag: '夺位' },
      { year: -515, title: '任贤整军', description: '阖闾任用伍子胥、孙武，整顿军政，吴国崛起', tag: '图强' }
    ],
    background: { political: '吴国为周宗室偏居东南，受中原诸国轻视，亟图自强。' },
    impacts: [
      { name: '政治影响', score: 92, description: '吴国由弱转强，成为威胁楚越的南方大国' },
      { name: '历史影响', score: 88, description: '吴王阖闾开启了吴国称雄的黄金时代' }
    ],
    chain: [
      { title: '吴王阖闾即位', year: '前515年', type: 'event', color: '#C34739' },
      { title: '柏举之战', year: '前506年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '专诸刺吴王僚': {
    narratives: [
      { year: -515, title: '公子蓄志', description: '公子光指使伍子胥寻刺客，结纳专诸', tag: '背景' },
      { year: -515, title: '鱼腹藏剑', description: '专诸藏剑于鱼腹进献，刺死吴王僚', tag: '行刺' },
      { year: -515, title: '阖闾立国', description: '专诸殉难，公子光即位为吴王阖闾', tag: '成事' }
    ],
    background: { political: '吴王僚在位，公子光觊觎君位已久。' },
    impacts: [
      { name: '政治影响', score: 88, description: '吴国政权更迭，阖闾开创吴国强盛之路' },
      { name: '文化影响', score: 90, description: '鱼腹藏剑成为刺客文化的经典典故' }
    ],
    chain: [
      { title: '专诸刺吴王僚', year: '前515年', type: 'event', color: '#C34739' },
      { title: '吴王阖闾即位', year: '前515年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '柏举之战': {
    narratives: [
      { year: -506, title: '吴师远征', description: '吴王阖闾亲率伍子胥、孙武倾国伐楚', tag: '背景' },
      { year: -506, title: '五战五捷', description: '吴军避开强军，先败汉水之楚师，柏举决战而胜', tag: '进兵' },
      { year: -506, title: '攻破郢都', description: '吴军乘胜攻破楚都郢，楚昭王出奔', tag: '破都' },
      { year: -506, title: '鞭尸雪恨', description: '伍子胥掘楚平王墓鞭尸，以报父兄之仇', tag: '复仇' }
    ],
    background: { political: '楚国内政腐败，君臣失和，为吴所乘。', geographic: '柏举在楚腹地，吴军千里奔袭。' },
    impacts: [
      { name: '政治影响', score: 96, description: '吴国一举攻灭楚国郢都，威震天下' },
      { name: '军事影响', score: 95, description: '孙武《孙子兵法》军事思想的实战运用' },
      { name: '历史影响', score: 93, description: '吴强楚弱之势由此奠定，加速楚国转衰' }
    ],
    chain: [
      { title: '吴王阖闾即位', year: '前515年', type: 'cause', color: '#D8B26A' },
      { title: '柏举之战', year: '前506年', type: 'event', color: '#C34739' }
    ]
  },
  '吴军攻破郢都': {
    narratives: [
      { year: -506, title: '乘胜追逼', description: '柏举之捷后，吴军穷追楚昭王于郊野', tag: '背景' },
      { year: -506, title: '郢都破城', description: '吴军一举攻入楚国郢都，楚昭王仓皇出逃', tag: '破都' },
      { year: -506, title: '占有楚室', description: '吴军入郢后纵兵占据楚宫室，楚国几亡', tag: '占据' }
    ],
    background: { political: '楚都久无战备，一旦被袭即如摧枯拉朽。' },
    impacts: [
      { name: '政治影响', score: 95, description: '楚国险亡，幸得申包胥哭秦而救' },
      { name: '历史影响', score: 90, description: '吴破楚郢成为春秋攻伐史上的大事' }
    ],
    chain: [
      { title: '柏举之战', year: '前506年', type: 'cause', color: '#D8B26A' },
      { title: '吴军攻破郢都', year: '前506年', type: 'event', color: '#C34739' },
      { title: '申包胥哭秦庭', year: '前505年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '伍子胥复仇': {
    narratives: [
      { year: -522, title: '灭门之祸', description: '楚平王听谗言杀伍奢、伍尚，伍子胥只身逃奔吴国', tag: '背景' },
      { year: -515, title: '助阖闾立', description: '伍子胥助公子光（阖闾）夺位，得任行人', tag: '仕吴' },
      { year: -506, title: '率师入郢', description: '伍子胥佐吴王伐楚，攻克郢都', tag: '破郢' },
      { year: -506, title: '掘墓鞭尸', description: '寻获楚平王墓，鞭尸三百以雪父兄之仇', tag: '雪恨' }
    ],
    background: { political: '伍氏为楚忠良，惨遭灭门，其复仇之心至死弗移。' },
    impacts: [
      { name: '政治影响', score: 93, description: '吴国借此大仇一洗，楚国元气大伤' },
      { name: '文化影响', score: 92, description: '伍子胥成为忠孝复仇的悲剧人物典型' },
      { name: '历史影响', score: 90, description: '其事迹深入人心，被后世演绎不绝' }
    ],
    chain: [
      { title: '柏举之战', year: '前506年', type: 'cause', color: '#D8B26A' },
      { title: '伍子胥复仇', year: '前506年', type: 'event', color: '#C34739' }
    ]
  },
  '申包胥哭秦庭': {
    narratives: [
      { year: -506, title: '楚都陷落', description: '吴军破郢，楚昭王东保避难，楚国濒亡', tag: '背景' },
      { year: -506, title: '徒步入秦', description: '申包胥星夜奔秦都，哀求秦哀公发兵救楚', tag: '求救' },
      { year: -505, title: '哭秦庭七日', description: '申包胥依墙而哭七昼夜，水浆不入于口', tag: '哀请' },
      { year: -505, title: '秦师复楚', description: '秦哀公为之感动发兵，秦师败吴，楚国复国', tag: '复国' }
    ],
    background: { social: '申包胥与伍子胥曾约定"存之者吾也，亡之者吾也"。' },
    impacts: [
      { name: '政治影响', score: 94, description: '楚国得以复国，吴国被迫退兵' },
      { name: '文化影响', score: 95, description: '哭秦庭成为忠于祖国的忠贞典范' },
      { name: '历史影响', score: 92, description: '"倚墙而哭"成为哭秦的千古名典' }
    ],
    chain: [
      { title: '吴军攻破郢都', year: '前506年', type: 'cause', color: '#D8B26A' },
      { title: '申包胥哭秦庭', year: '前505年', type: 'event', color: '#C34739' },
      { title: '楚国复国', year: '前505年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '楚国复国': {
    narratives: [
      { year: -505, title: '秦师入楚', description: '秦哀公发兵救楚，与吴师交战', tag: '背景' },
      { year: -505, title: '吴溃退兵', description: '吴王阖闾之弟夫概奔归自立，吴师乱溃败还', tag: '转折' },
      { year: -505, title: '昭王复郢', description: '楚昭王返回郢都，楚国复国重整', tag: '复郢' },
      { year: -504, title: '修政图强', description: '楚国迁都若敖，整顿内政，逐渐重振', tag: '图治' }
    ],
    background: { political: '吴强楚弱的背景下，楚国赖秦援与内乱得以复存。' },
    impacts: [
      { name: '政治影响', score: 90, description: '楚国起死回生，免于亡国之祸' },
      { name: '历史影响', score: 86, description: '楚虽复国而元气大伤，由盛转衰' }
    ],
    chain: [
      { title: '申包胥哭秦庭', year: '前505年', type: 'cause', color: '#D8B26A' },
      { title: '楚国复国', year: '前505年', type: 'event', color: '#C34739' }
    ]
  },
  '吴越檇李之战': {
    narratives: [
      { year: -496, title: '越王新立', description: '越王允常卒，勾践新立，吴乘丧伐越', tag: '背景' },
      { year: -496, title: '檇李对阵', description: '吴越战于檇李，越军先以敢死肉搏致吴军乱', tag: '对垒' },
      { year: -496, title: '越大破吴', description: '勾践亲督战阵，大败吴军，阖闾中箭而亡', tag: '大捷' },
      { year: -496, title: '夫差立志', description: '夫差继位，厉志复仇，使人常呼"而忘越王之杀而父乎"', tag: '遗恨' }
    ],
    background: { political: '吴越世仇，檇李一战埋下两国征战不断的根苗。' },
    impacts: [
      { name: '政治影响', score: 90, description: '越国声威大振，吴越攻守之势初现' },
      { name: '历史影响', score: 88, description: '阖闾之死促成夫差立志，开启两国新仇' }
    ],
    chain: [
      { title: '吴越檇李之战', year: '前496年', type: 'event', color: '#C34739' },
      { title: '会稽之战与勾践受辱', year: '前494年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '会稽之战与勾践受辱': {
    narratives: [
      { year: -494, title: '夫差报怨', description: '吴王夫差为报父仇大举伐越，越军不敌', tag: '背景' },
      { year: -494, title: '夫椒大败', description: '越军大败于夫椒，溃退会稽山', tag: '溃败' },
      { year: -494, title: '屈身请和', description: '勾践遣文种卑辞厚礼请和，愿臣于吴', tag: '请和' },
      { year: -494, title: '入吴为质', description: '勾践携范蠡入吴为奴，忍辱负重，受尽屈辱', tag: '为质' }
    ],
    background: { political: '越弱吴强，勾践战败后选择隐忍图存。' },
    impacts: [
      { name: '政治影响', score: 90, description: '越国沦为吴之属国，勾践忍辱求和' },
      { name: '历史影响', score: 92, description: '会稽之耻成为勾践发愤图强的起点' }
    ],
    chain: [
      { title: '吴越檇李之战', year: '前496年', type: 'cause', color: '#D8B26A' },
      { title: '会稽之战与勾践受辱', year: '前494年', type: 'event', color: '#C34739' },
      { title: '勾践卧薪尝胆', year: '前486年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '勾践卧薪尝胆': {
    narratives: [
      { year: -494, title: '质于吴宫', description: '勾践为奴于吴，卧薪尝胆，恭谨事吴', tag: '背景' },
      { year: -490, title: '归国图治', description: '得释归国后，与范蠡、文种共谋富国强兵', tag: '归国' },
      { year: -486, title: '十年生聚', description: '励精图治、发展生产，暗中积蓄复国之力', tag: '图强' },
      { year: -473, title: '灭吴雪耻', description: '乘吴国北上争霸之机，一举灭吴，报会稽之仇', tag: '雪耻' }
    ],
    background: { social: '勾践布衣牛马、亲耕妻织，与民共苦，深得民心。' },
    impacts: [
      { name: '政治影响', score: 96, description: '越国由弱转强，最终吞并吴国' },
      { name: '文化影响', score: 95, description: '卧薪尝胆成为发愤图强的励志典范' },
      { name: '历史影响', score: 94, description: '越国强盛成就勾践春秋末代霸主地位' }
    ],
    chain: [
      { title: '会稽之战与勾践受辱', year: '前494年', type: 'cause', color: '#D8B26A' },
      { title: '勾践卧薪尝胆', year: '前486年', type: 'event', color: '#C34739' },
      { title: '勾践灭吴', year: '前473年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '黄池之会': {
    narratives: [
      { year: -482, title: '夫差北上', description: '吴王夫差为图霸中原，率师北上会诸侯', tag: '背景' },
      { year: -482, title: '会盟黄池', description: '吴、晋二霸会于黄池，相争盟主之位', tag: '争盟' },
      { year: -482, title: '吴强争长', description: '吴国恃强与晋争长，终得主盟', tag: '争长' },
      { year: -482, title: '越袭吴都', description: '吴国后方空虚，越王勾践乘虚袭吴，吴为之衰', tag: '转折' }
    ],
    background: { political: '夫差沉迷于争霸，忽视了越国的威胁。' },
    impacts: [
      { name: '政治影响', score: 90, description: '吴虽主盟黄池，然因越袭而元气大伤' },
      { name: '历史影响', score: 92, description: '吴国称霸中原的同时已埋下灭亡之祸' }
    ],
    chain: [
      { title: '勾践卧薪尝胆', year: '前486年', type: 'cause', color: '#D8B26A' },
      { title: '黄池之会', year: '前482年', type: 'event', color: '#C34739' },
      { title: '勾践灭吴', year: '前473年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '勾践灭吴': {
    narratives: [
      { year: -478, title: '越攻姑苏', description: '越军大举攻吴，败吴军于笠泽', tag: '背景' },
      { year: -473, title: '吴都失守', description: '越国攻打吴都姑苏，吴王夫差兵败被围', tag: '围吴' },
      { year: -473, title: '夫差自刎', description: '夫差乞降不得，自刎而死，吴国灭亡', tag: '灭亡' },
      { year: -473, title: '勾践称霸', description: '越王勾践成春秋最后一位霸主，号令诸侯', tag: '称霸' }
    ],
    background: { political: '吴国连年用兵、猜忌贤臣，国力空虚，为越所乘。' },
    impacts: [
      { name: '政治影响', score: 97, description: '吴亡越兴，越国成为春秋末季南方霸主' },
      { name: '历史影响', score: 95, description: '勾践灭吴为"十年生聚、十年教训"画上句号' }
    ],
    chain: [
      { title: '勾践卧薪尝胆', year: '前486年', type: 'cause', color: '#D8B26A' },
      { title: '勾践灭吴', year: '前473年', type: 'event', color: '#C34739' }
    ]
  },
  '晋阳之战': {
    narratives: [
      { year: -455, title: '智伯索地', description: '智伯瑶向赵、魏、韩索地，赵襄子不从', tag: '背景' },
      { year: -454, title: '围困晋阳', description: '智伯率韩魏之师围攻赵氏晋阳，久攻不下', tag: '围城' },
      { year: -453, title: '水灌晋阳', description: '智伯引晋水灌晋阳，城危在旦夕', tag: '灌城' },
      { year: -453, title: '三家灭智', description: '赵韩魏反戈，决水反攻智伯，智氏被灭', tag: '逆转' }
    ],
    background: { political: '六卿兼并至智、赵、魏、韩四家，智氏最强而骄横。' },
    impacts: [
      { name: '政治影响', score: 96, description: '智氏灭亡，赵魏韩瓜分晋国实权' },
      { name: '历史影响', score: 95, description: '晋阳之战为三家分晋揭开序幕' }
    ],
    chain: [
      { title: '晋国六卿崛起', year: '前490年', type: 'cause', color: '#D8B26A' },
      { title: '晋阳之战', year: '前455年', type: 'event', color: '#C34739' },
      { title: '三家分晋', year: '前453年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '智氏灭亡': {
    narratives: [
      { year: -455, title: '智伯逞强', description: '智伯瑶贪图无厌，威逼韩魏赵割地', tag: '背景' },
      { year: -453, title: '三家结盟', description: '赵韩魏三家密谋连手，共图智氏', tag: '结盟' },
      { year: -453, title: '韩魏反水', description: '智伯军水灌晋阳之际，韩魏反戈相向', tag: '反水' },
      { year: -453, title: '智族覆灭', description: '赵襄子杀智伯，灭其族，尽分其地', tag: '覆灭' }
    ],
    background: { political: '智氏最强却众叛亲离，骄横招致灭族。' },
    impacts: [
      { name: '政治影响', score: 94, description: '晋国实权尽归赵魏韩三家' },
      { name: '历史影响', score: 93, description: '智氏灭亡标志卿族兼并进入最终阶段' }
    ],
    chain: [
      { title: '晋阳之战', year: '前455年', type: 'cause', color: '#D8B26A' },
      { title: '智氏灭亡', year: '前453年', type: 'event', color: '#C34739' },
      { title: '三家分晋', year: '前453年', type: 'consequence', color: '#355C5A' }
    ]
  },
  '三家分晋': {
    narratives: [
      { year: -453, title: '瓜分智地', description: '赵魏韩三分智氏之田，晋君名存实亡', tag: '背景' },
      { year: -452, title: '三家专政', description: '晋公室无尺土之封，实权尽归三家', tag: '专政' },
      { year: -403, title: '周王册封', description: '周威烈王正式册命韩赵魏为诸侯', tag: '封建' },
      { year: -403, title: '战国开启', description: '三家分晋标志着春秋结束，战国拉开序幕', tag: '变革' }
    ],
    background: { political: '卿族长期兼并，君权削亡，分晋势成必然。' },
    impacts: [
      { name: '政治影响', score: 98, description: '晋国一分为三，形成韩赵魏三国' },
      { name: '历史影响', score: 99, description: '被史学界视为春秋战国分界的重要标志' }
    ],
    chain: [
      { title: '晋阳之战', year: '前455年', type: 'cause', color: '#D8B26A' },
      { title: '三家分晋', year: '前453年', type: 'event', color: '#C34739' }
    ]
  },
  '鲁国三桓专政': {
    narratives: [
      { year: -590, title: '三桓始盛', description: '鲁国孟孙、叔孙、季孙三家卿族势力日益坐大', tag: '背景' },
      { year: -562, title: '三分公室', description: '三桓瓜分鲁国公室军权、赋税', tag: '分权' },
      { year: -517, title: '逼走昭公', description: '季氏等驱逐鲁昭公，公室名存实亡', tag: '逐君' },
      { year: -505, title: '三桓专政', description: '鲁国政由三桓把持，国君形同傀儡', tag: '专权' }
    ],
    background: { political: '鲁国宗法关系浓厚，卿族依托宗族势力逐步篡权。' },
    impacts: [
      { name: '政治影响', score: 90, description: '鲁国君权瓦解，三桓长期把持国政' },
      { name: '历史影响', score: 88, description: '三桓专政是春秋卿族专权的典型缩影' }
    ],
    chain: [
      { title: '鲁国三桓专政', year: '前505年', type: 'event', color: '#C34739' }
    ]
  },
  '孔子周游列国': {
    narratives: [
      { year: -497, title: '去鲁出行', description: '孔子因见信于君而不用于政，率弟子离开鲁国', tag: '背景' },
      { year: -496, title: '厄于陈蔡', description: '在陈蔡之间被围绝粮，弦歌不辍，志节不改', tag: '困厄' },
      { year: -489, title: '楚郊受讥', description: '为楚所用之议终沮，孔子"明知其不可为而为之"', tag: '受挫' },
      { year: -484, title: '归鲁修书', description: '周游十四年终返鲁，专心著书立说、教授弟子', tag: '归来' }
    ],
    background: { political: '诸侯各务争霸，孔子仁政主张无人赏识。' },
    impacts: [
      { name: '文化影响', score: 97, description: '周游促成孔子思想成熟，伟大典籍得以传世' },
      { name: '历史影响', score: 96, description: '"述而不作"与弟子论学成就儒家学说之完型' }
    ],
    chain: [
      { title: '孔子周游列国', year: '前497年', type: 'event', color: '#C34739' }
    ]
  },
  '季札让国': {
    narratives: [
      { year: -561, title: '季札让位', description: '吴王寿梦欲传位于贤季札，季札坚决不受', tag: '背景' },
      { year: -544, title: '出使列国', description: '季札历访鲁、齐、郑、卫、晋，观礼知政，声誉极高', tag: '出使' },
      { year: -525, title: '再让君位', description: '哀公欲以国授季札，季札复辞，退居延陵', tag: '再让' },
      { year: -500, title: '岩盟让国', description: '季札终生不争君位，为让德之典范', tag: '成德' }
    ],
    background: { cultural: '周礼熏陶下的吴国宗室难得之贤者，谦让闻名诸侯。' },
    impacts: [
      { name: '文化影响', score: 90, description: '季札让国成为千古让德与礼仪的象征' },
      { name: '历史影响', score: 88, description: '其观乐时常引之为乐官之师，影响深远' }
    ],
    chain: [
      { title: '季札让国', year: '前544年', type: 'event', color: '#C34739' }
    ]
  }
};

module.exports = { PERSON_ENRICHMENT, EVENT_ENRICHMENT };