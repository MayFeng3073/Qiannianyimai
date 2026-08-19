// 夏商西周人物知识库 - 为每个人物提供详细的生平、作品、故事
const PERSON_ENRICHMENT = {
  '启': {
    works: [
      { name: '建立夏朝', excerpt: '世袭制之始', description: '继承大禹之位，破除禅让传统，建立中国第一个世袭制王朝夏朝，开启"家天下"时代。' },
      { name: '征伐有扈氏', excerpt: '甘之战', description: '出兵征伐反对世袭制的有扈氏，作《甘誓》确立战争誓言，巩固新生政权。' },
      { name: '确立王位传承', excerpt: '父死子继', description: '将王位传于子太康，确立王位世袭制度，影响中国政治数千年。' }
    ],
    life_events: [
      { year: -2070, title: '继承父位', description: '大禹去世后继承王位，成为夏朝第二任君主', importance: 9 },
      { year: -2069, title: '甘之战', description: '征伐有扈氏，作《甘誓》，确立世袭制合法性', importance: 10 },
      { year: -2060, title: '传位太康', description: '将王位传给其子太康，确立家天下体制', importance: 8 }
    ],
    story: {
      title: '启的故事——家天下之始',
      content: '大禹治水有功，受舜禅让而得天下。然而大禹死后，其子启并未遵循禅让传统，而是通过武力夺取政权，建立了中国历史上第一个世袭制王朝——夏朝。启在甘之战中击败反对他的有扈氏部落，发表《甘誓》宣告："有扈氏威侮五行，怠弃三正，天用剿绝其命。"从此，"公天下"变为"家天下"，王位由父子相传。这一制度变革深刻影响了中国此后四千年的政治格局。启在位九年，传位于子太康，正式确立了夏朝的统治秩序。'
    },
    narrative_relations: {
      nodes: [
        { id: 'qi', name: '启', type: 'person' },
        { id: 'dayu', name: '大禹', type: 'person' },
        { id: 'kang', name: '太康', type: 'person' },
        { id: 'gan', name: '甘之战', type: 'event' }
      ],
      edges: [
        { source: 'dayu', target: 'qi', label: '父子' },
        { source: 'qi', target: 'kang', label: '父子' },
        { source: 'qi', target: 'gan', label: '发动' }
      ]
    }
  },
  '太康': {
    works: [
      { name: '继位为夏王', excerpt: '荒淫无度', description: '继承夏王位，但沉迷田猎游乐，不理政事，导致夏朝衰落。' }
    ],
    life_events: [
      { year: -2060, title: '继位为王', description: '父启去世后继承夏朝王位', importance: 8 },
      { year: -2050, title: '游田无度', description: '沉迷田猎，不理朝政，导致诸侯离心', importance: 7 },
      { year: -2040, title: '失国流亡', description: '被后羿驱逐，流亡至斟鄩', importance: 10 }
    ],
    story: {
      title: '太康失国',
      content: '太康继位后，终日田猎，不理朝政。他带着家属和亲信外出打猎，竟百日不归。后羿趁夏都空虚，率军攻占斟鄩。太康被迫流亡，至死未能回到都城。太康失国标志着夏朝第一次严重危机，政权被后羿（有穷氏）篡夺，开启了夏朝"无王之世"的混乱局面，前后持续约四十年。'
    }
  },
  '少康': {
    works: [
      { name: '少康中兴', excerpt: '光复夏朝', description: '历经艰险复国成功，恢复夏朝统治，开创"少康中兴"盛世。' },
      { name: '治理浇之乱', excerpt: '除掉寒浞势力', description: '派兵消灭寒浞之子浇的势力，彻底结束后羿、寒浞的篡政时代。' }
    ],
    life_events: [
      { year: -2020, title: '出生流亡', description: '作为夏朝遗孤出生，自幼躲避追杀', importance: 7 },
      { year: -2000, title: '恢复夏朝', description: '联合有虞氏、有鬲氏等部落，击败寒浞光复夏朝', importance: 10 },
      { year: -1995, title: '开创中兴', description: '励精图治，夏朝复兴，史称"少康中兴"', importance: 9 }
    ],
    story: {
      title: '少康中兴——复国之君',
      content: '少康是夏朝第五任君王，太康失国后，夏朝被后羿、寒浞篡夺近四十年。少康作为夏朝遗孤，自幼历尽艰险，曾寄居有虞氏部落。他以"有田一成，有众一旅"的微薄力量起步，联合有虞氏、有鬲氏等忠于夏朝的部落，经过长期准备，终于攻破寒浞政权，光复夏朝。少康在位期间励精图治，兴修水利，发展农业，夏朝再度繁荣，史称"少康中兴"，成为中国历史上著名的中兴之主。'
    }
  },
  '商汤': {
    works: [
      { name: '灭夏建商', excerpt: '鸣条之战', description: '在鸣条之战中击败夏桀，建立商朝，开启中国第二个王朝。' },
      { name: '施德于民', excerpt: '网开一面', description: '以仁德著称，"网开一面"的典故体现其宽政爱民的思想。' },
      { name: '任用贤才', excerpt: '伊尹为相', description: '任用伊尹为相，整顿朝政，为灭夏奠定政治基础。' }
    ],
    life_events: [
      { year: -1600, title: '继任商侯', description: '成为商部落首领，施行仁政，深得民心', importance: 8 },
      { year: -1600, title: '鸣条之战', description: '率商军与夏桀决战于鸣条，夏军溃败', importance: 10 },
      { year: -1600, title: '建立商朝', description: '取代夏朝建立商朝，定都亳', importance: 10 }
    ],
    story: {
      title: '商汤灭夏——商朝开国之君',
      content: '商汤，姓子名履，是商朝的开国之君。夏桀暴虐无道，天怒人怨。商汤作为商部落首领，施行仁政，礼贤下士，深得民心。他任用伊尹为相，整顿内政，训练军队，先后灭掉葛、韦、顾、昆吾等夏朝属国，形成对夏都的包围之势。公元前1600年，商汤率大军与夏桀决战于鸣条之野，夏军溃败，夏桀逃亡南巢，夏朝灭亡。商汤建立商朝，定都亳（今河南商丘），开创了中国历史上的商朝，在位十三年而崩。'
    },
    narrative_relations: {
      nodes: [
        { id: 'tang', name: '商汤', type: 'person' },
        { id: 'jiec', name: '夏桀', type: 'person' },
        { id: 'yiyin', name: '伊尹', type: 'person' },
        { id: 'mingtiao', name: '鸣条之战', type: 'event' }
      ],
      edges: [
        { source: 'tang', target: 'jiec', label: '讨伐' },
        { source: 'tang', target: 'yiyin', label: '君臣' },
        { source: 'tang', target: 'mingtiao', label: '指挥' }
      ]
    }
  },
  '伊尹': {
    works: [
      { name: '辅佐商汤', excerpt: '开国贤相', description: '作为陪嫁奴隶来到商汤身边，后被破格任用为相，辅佐商汤灭夏。' },
      { name: '治理商朝', excerpt: '国之大任', description: '制定各种典章制度，整顿吏治，为商朝初期稳定做出重大贡献。' },
      { name: '放逐太甲', excerpt: '桐宫悔过', description: '放逐商王太甲于桐宫，待其悔过复位，开创"相权"与"君权"制衡的先例。' }
    ],
    life_events: [
      { year: -1600, title: '被商汤任用', description: '以庖厨身份被商汤赏识，后破格任用为相', importance: 9 },
      { year: -1600, title: '辅佐灭夏', description: '为商汤筹划灭夏战略，鸣条之战后制定治国方略', importance: 10 },
      { year: -1580, title: '放逐太甲', description: '因太甲失德，将其放逐桐宫，三年后迎回复位', importance: 9 },
      { year: -1570, title: '去世', description: '享年百岁，商朝以天子礼葬之', importance: 8 }
    ],
    story: {
      title: '伊尹——千古贤相第一人',
      content: '伊尹，名挚，是商朝开国名相，也是中国历史上第一位贤相。他出身卑微，原是有莘氏的陪嫁奴隶，以庖厨之身份来到商汤身边。伊尹以"治大国若烹小鲜"之道游说商汤，被破格任用为相。他辅佐商汤灭掉夏朝，建立商朝；又辅佐商汤之后的三位商王治理朝政。商王太甲继位后失德乱政，伊尹将其放逐于桐宫，令其悔过。三年后太甲改过自新，伊尹迎其复位，还政于王。伊尹治理商朝数十年，制定了一整套典章制度，使商朝政治清明，经济繁荣。伊尹享年百岁，去世时商朝以天子之礼安葬，可见其地位之尊崇。伊尹被后世奉为"商元圣"，是中国贤相政治的典范。'
    }
  },
  '盘庚': {
    works: [
      { name: '盘庚迁殷', excerpt: '迁都之举', description: '力排众议迁都于殷（今河南安阳），使商朝政治经济中心稳定下来。' },
      { name: '《盘庚》三篇', excerpt: '训诰之辞', description: '迁殷前后发表的三篇训诰，说服贵族与民众支持迁都。' }
    ],
    life_events: [
      { year: -1300, title: '继位商王', description: '成为商朝第十九任君王', importance: 7 },
      { year: -1298, title: '迁都于殷', description: '力排众议迁都殷，发表《盘庚》三篇训诰', importance: 10 },
      { year: -1290, title: '奠定基业', description: '在殷地整顿朝政，为武丁中兴奠定基础', importance: 8 }
    ],
    story: {
      title: '盘庚迁殷——商朝转折点',
      content: '商朝自商汤立国后，因王族内部纷争和自然灾害，曾五次迁都。到盘庚继位时，都城在奄（今山东曲阜），政治腐败，民生困苦。盘庚决心迁都于殷（今河南安阳），那里土地肥沃，地处中原中心，有利于控制四方。但迁都会触动贵族利益，遭到强烈反对。盘庚发表了著名的《盘庚》三篇训诰，晓以大义，恩威并施，最终说服各方，完成迁都。迁都后，商朝政治稳定，经济发展，为后来的武丁中兴打下了坚实基础。盘庚迁殷是商朝历史的转折点，此后商朝再未迁都，直至灭亡。'
    }
  },
  '武丁': {
    works: [
      { name: '武丁中兴', excerpt: '盛世之王', description: '在位五十九年，开创商朝鼎盛时期，史称"武丁中兴"。' },
      { name: '任用傅说', excerpt: '版筑求贤', description: '从版筑工中发现傅说之才，任用为相，成为千古求贤佳话。' },
      { name: '征服四方', excerpt: '武功赫赫', description: '先后征服鬼方、羌方、土方等方国，扩大商朝疆域。' }
    ],
    life_events: [
      { year: -1250, title: '继位为商王', description: '年少时曾在民间生活，深知民情', importance: 8 },
      { year: -1248, title: '任用傅说', description: '从傅岩版筑工地发现傅说，任命为相', importance: 10 },
      { year: -1230, title: '征伐四方', description: '大规模征伐方国，开拓疆土', importance: 9 },
      { year: -1200, title: '商朝鼎盛', description: '政治、经济、文化达到商朝巅峰', importance: 10 }
    ],
    story: {
      title: '武丁中兴——商朝盛世之王',
      content: '武丁是商朝第二十二任君王，在位五十九年，开创了商朝最辉煌的时代——"武丁中兴"。武丁年少时曾在民间生活，与平民同甘共苦，深知民生疾苦。继位后，他决心振兴商朝，一次在梦中见到一位圣人，醒来后便派人四处寻访，终于在傅岩（今山西平陆）的版筑工地找到了傅说。武丁不顾傅说奴隶身份，破格任用他为相。在傅说的辅佐下，武丁整顿内政，选贤任能，同时大规模征伐鬼方、羌方、土方等周边方国，将商朝疆域扩展到空前规模。武丁时期的青铜器、甲骨文、宫殿建筑都达到极高水平，是中国历史上少有的政治清明、武功赫赫、文化灿烂的黄金时代。'
    },
    narrative_relations: {
      nodes: [
        { id: 'wuding', name: '武丁', type: 'person' },
        { id: 'fuyue', name: '傅说', type: 'person' },
        { id: 'zhongxing', name: '武丁中兴', type: 'event' }
      ],
      edges: [
        { source: 'wuding', target: 'fuyue', label: '君臣' },
        { source: 'wuding', target: 'zhongxing', label: '开创' }
      ]
    }
  },
  '帝辛': {
    works: [
      { name: '荒政失国', excerpt: '众叛亲离', description: '沉迷酒色，严刑峻法，失去诸侯支持，导致商朝灭亡。' },
      { name: '营建朝歌', excerpt: '鹿台之建', description: '大规模营建朝歌宫殿鹿台，耗费民力财力。' }
    ],
    life_events: [
      { year: -1075, title: '继位为王', description: '以嫡长子身份继承商朝王位', importance: 8 },
      { year: -1060, title: '征伐东夷', description: '多次亲征东夷，虽胜但国力大耗', importance: 9 },
      { year: -1046, title: '牧野之战', description: '周武王伐纣，纣王兵败自焚，商朝灭亡', importance: 10 }
    ],
    story: {
      title: '商纣王——亡国之君的复杂形象',
      content: '帝辛，又称商纣王，是商朝最后一位君王。他天资聪颖，才力过人，能徒手与猛兽搏斗，又能言善辩。但继位后沉迷酒色，宠爱妲己，荒淫无道。他营建朝歌鹿台，"以酒为池，以肉为林"，严刑峻法，"炮烙之刑"令人发指。他囚禁西伯侯姬昌（周文王），杀害比干、梅伯等忠良，导致诸侯离心、大臣反叛。同时，他连年征伐东夷，虽获胜利却国力大耗。公元前1046年，周武王姬发趁商朝大军东征、朝歌空虚之际，率诸侯联军四千乘进攻牧野。纣王仓促应战，奴隶阵前倒戈，商军溃败。纣王逃回朝歌，登鹿台自焚而亡，延续六百年的商朝就此灭亡。纣王虽为亡国之君，但史载他"资辨捷疾，闻见甚敏；材力过人，手格猛兽"，是一个有才能但德行败坏的复杂历史人物。'
    }
  },
  '周文王': {
    works: [
      { name: '奠定周基', excerpt: '西伯之治', description: '作为西伯侯治理周族，施行仁政，使周族迅速崛起。' },
      { name: '演《周易》', excerpt: '羑里演易', description: '被纣王囚禁羑里期间，将八卦演为六十四卦，完成《周易》。' },
      { name: '渭水访贤', excerpt: '三顾茅庐', description: '听闻姜子牙贤名，三次亲赴渭水拜访，聘其为军师。' }
    ],
    life_events: [
      { year: -1100, title: '继位西伯', description: '继承西伯侯位，治理周族', importance: 8 },
      { year: -1075, title: '被囚羑里', description: '被商纣王囚禁于羑里，历时七年', importance: 9 },
      { year: -1070, title: '获释归周', description: '获释后更加励精图治，开始谋划灭商', importance: 9 },
      { year: -1060, title: '渭水访贤', description: '三顾渭水聘请姜子牙为军师', importance: 10 },
      { year: -1050, title: '三分天下有其二', description: '周族势力扩大，"三分天下有其二"', importance: 10 }
    ],
    story: {
      title: '周文王——仁德之君，周室奠基',
      content: '周文王，姓姬名昌，是周族的首领，周朝的奠基人。他作为西伯侯治理周族，施行仁政，敬老爱幼，礼贤下士，使周族在西岐迅速崛起，"三分天下有其二"。他曾被商纣王囚禁于羑里七年，在困境中将伏羲八卦演为六十四卦，完成了《周易》这部千古不朽的哲学巨著。获释后，他更加坚定灭商决心。他听说姜子牙（吕尚）有经天纬地之才，三次亲赴渭水之滨拜访，终于聘得这位千古奇才。周文王在位五十年，为周武王灭商建立周朝奠定了坚实的政治、军事基础，被后世儒家奉为"内圣外王"的典范。'
    },
    narrative_relations: {
      nodes: [
        { id: 'wenwang', name: '周文王', type: 'person' },
        { id: 'jiangziya', name: '姜子牙', type: 'person' },
        { id: 'wuwang', name: '周武王', type: 'person' },
        { id: 'zhouyi', name: '演《周易》', type: 'event' }
      ],
      edges: [
        { source: 'wenwang', target: 'jiangziya', label: '聘请' },
        { source: 'wenwang', target: 'wuwang', label: '父子' },
        { source: 'wenwang', target: 'zhouyi', label: '创作' }
      ]
    }
  },
  '周武王': {
    works: [
      { name: '武王伐纣', excerpt: '牧野之战', description: '率诸侯联军在牧野击败商军，建立周朝。' },
      { name: '分封诸侯', excerpt: '封建亲戚', description: '灭商后大规模分封诸侯，建立周朝封建制度。' },
      { name: '《牧誓》', excerpt: '战前誓师', description: '牧野之战前发表《牧誓》，历数纣王罪状，激励士气。' }
    ],
    life_events: [
      { year: -1050, title: '继位为西伯', description: '父周文王去世后继位', importance: 9 },
      { year: -1048, title: '盟津观兵', description: '率诸侯会盟于孟津，演练伐商', importance: 9 },
      { year: -1046, title: '牧野之战', description: '率四万五千人联军与商军决战于牧野', importance: 10 },
      { year: -1046, title: '建立周朝', description: '灭商后建立周朝，定都镐京', importance: 10 },
      { year: -1043, title: '分封诸侯', description: '大规模分封姬姓宗室和功臣为诸侯', importance: 9 },
      { year: -1042, title: '去世', description: '灭商后仅三年去世，传位于年幼的成王', importance: 8 }
    ],
    story: {
      title: '周武王——开国之君，牧野兴周',
      content: '周武王，姓姬名发，是周文王次子，周朝的开国之君。公元前1046年，他继承西伯侯位后不久，便率战车三百乘、精锐四万五千人，联合庸、蜀、羌、髳、微、卢、彭、濮等方国，东进伐商。在孟津（今河南孟州）与八百诸侯会盟后，率军直逼商都朝歌。牧野之战中，周武王发表著名的《牧誓》，历数纣王"听信妇言""不祀祖宗""不任宗亲""暴虐百姓"等罪状，激励士气。商军虽众，但奴隶阵前倒戈，周军势如破竹，一战击溃商军。纣王逃回朝歌自焚而亡，延续六百年的商朝灭亡。周武王建立周朝，定都镐京（今陕西西安），大规模分封诸侯，将姬姓宗室和功臣分封到各地，"封建亲戚，以藩屏周"。武王灭商后仅三年便去世，年仅四十余岁，传位给年幼的太子诵（周成王），由弟弟周公旦摄政。'
    },
    narrative_relations: {
      nodes: [
        { id: 'wuwang', name: '周武王', type: 'person' },
        { id: 'zhougong', name: '周公旦', type: 'person' },
        { id: 'jiangziya', name: '姜子牙', type: 'person' },
        { id: 'muye', name: '牧野之战', type: 'event' }
      ],
      edges: [
        { source: 'wuwang', target: 'zhougong', label: '兄弟' },
        { source: 'wuwang', target: 'jiangziya', label: '君臣' },
        { source: 'wuwang', target: 'muye', label: '指挥' }
      ]
    }
  },
  '周公旦': {
    works: [
      { name: '周公摄政', excerpt: '辅佐成王', description: '周武王去世后辅佐年幼的周成王摄政七年，稳定周朝政局。' },
      { name: '平定三监之乱', excerpt: '东征平叛', description: '率军平定管叔、蔡叔、霍叔与武庚勾结的叛乱，巩固周朝统治。' },
      { name: '营建洛邑', excerpt: '成周之建', description: '在洛阳营建东都洛邑，作为周朝控制东方的中心。' },
      { name: '制礼作乐', excerpt: '礼乐制度', description: '制定周朝的礼乐制度，奠定中国古代礼制基础。' }
    ],
    life_events: [
      { year: -1042, title: '开始摄政', description: '周武王去世，周成王年幼，周公旦开始摄政', importance: 10 },
      { year: -1041, title: '平定叛乱', description: '东征平定三监之乱，诛杀管叔，流放蔡叔', importance: 10 },
      { year: -1038, title: '营建洛邑', description: '在洛阳营建东都洛邑，建立成周', importance: 9 },
      { year: -1035, title: '还政成王', description: '摄政七年后还政于周成王', importance: 10 },
      { year: -1020, title: '去世', description: '去世后被尊为"元圣"，与文王、武王并列', importance: 8 }
    ],
    story: {
      title: '周公旦——一代圣贤，礼乐之祖',
      content: '周公旦，姓姬名旦，是周文王第四子，周武王之弟，周朝最杰出的政治家、思想家。周武王灭商后三年去世，太子诵（周成王）年仅十三岁，周公旦以王叔身份摄政。摄政期间，他面临巨大考验：管叔、蔡叔、霍叔（三监）勾结商纣之子武庚发动叛乱，东方大片土地失控。周公旦果断率军东征，历经三年苦战，平定叛乱，诛杀管叔，流放蔡叔，将商朝遗民迁至洛邑。之后他营建东都洛邑（成周），建立周朝对东方的有效统治。周公旦还制定了一整套礼乐制度，包括嫡长子继承制、分封制、宗法制、井田制等，以及吉、凶、军、宾、嘉五礼。周公摄政七年后还政于成王，自己北面就群臣之位。周公的品德与功业，使他成为孔子最崇敬的古代圣人之一，被尊为"元圣"。'
    },
    narrative_relations: {
      nodes: [
        { id: 'zhougong', name: '周公旦', type: 'person' },
        { id: 'wuwang', name: '周武王', type: 'person' },
        { id: 'chengwang', name: '周成王', type: 'person' },
        { id: 'sanjiam', name: '三监之乱', type: 'event' },
        { id: 'liyi', name: '制礼作乐', type: 'event' }
      ],
      edges: [
        { source: 'wuwang', target: 'zhougong', label: '兄弟' },
        { source: 'zhougong', target: 'chengwang', label: '叔侄/摄政' },
        { source: 'zhougong', target: 'sanjiam', label: '平定' },
        { source: 'zhougong', target: 'liyi', label: '制定' }
      ]
    }
  },
  '姜子牙': {
    works: [
      { name: '辅佐灭商', excerpt: '军师之勋', description: '作为周武王的军师，为牧野之战的胜利做出关键贡献。' },
      { name: '封于齐', excerpt: '齐国始祖', description: '灭商后被封为齐侯，成为齐国的开国之君。' },
      { name: '《六韬》', excerpt: '兵家之祖', description: '传说著有《六韬》兵法，被尊为中国兵家始祖。' }
    ],
    life_events: [
      { year: -1060, title: '渭水垂钓', description: '在渭水之滨垂钓，被周文王发现', importance: 10 },
      { year: -1046, title: '牧野之战', description: '辅佐周武王指挥牧野之战，一战灭商', importance: 10 },
      { year: -1043, title: '封于齐', description: '被封为齐侯，建都营丘（今淄博）', importance: 9 },
      { year: -1036, title: '去世', description: '享年百余岁，被尊为"太公望"', importance: 8 }
    ],
    story: {
      title: '姜子牙——兵家始祖，周室开国第一功臣',
      content: '姜子牙，姓姜名尚，字子牙，号飞熊，是周朝开国第一功臣，中国兵家之祖。他年轻时曾在商朝做过官，因不满纣王暴政而辞官隐居。晚年垂钓于渭水之滨，被周文王姬昌发现。周文王听他谈论治国之道，大为赞赏，说："吾太公望子久矣！"因此姜子牙又被称为"太公望"。姜子牙辅佐周文王、周武王两代君主，为周灭商立下盖世奇功。牧野之战中，他运筹帷幄，决胜千里，一战便击溃商军。灭商后，姜子牙被封为齐侯，建都营丘（今山东淄博），成为齐国的开国之君。姜子牙享年百余岁，传说著有《六韬》《阴符》等兵书，被后世兵家奉为始祖。'
    }
  },
  '周厉王': {
    works: [
      { name: '专利政策', excerpt: '与民争利', description: '实行"专利"政策，垄断山林川泽之利，激起民愤。' },
      { name: '弭谤事件', excerpt: '防民之口', description: '用卫巫监视国人，"防民之口，甚于防川"，引发国人暴动。' }
    ],
    life_events: [
      { year: -877, title: '继位为王', description: '继承周朝王位', importance: 8 },
      { year: -850, title: '实行专利', description: '推行专利政策，垄断资源', importance: 9 },
      { year: -845, title: '卫巫弭谤', description: '用卫巫监视批评者，杀戮敢言之士', importance: 10 },
      { year: -841, title: '国人暴动', description: '镐京国人暴动，厉王出逃彘地', importance: 10 }
    ],
    story: {
      title: '周厉王——防民之口，甚于防川',
      content: '周厉王姬胡是西周第十任君王，以贪暴著称。他任用荣夷公实行"专利"政策，将山林川泽之利全部收归王室，剥夺了平民和贵族的利益。国人议论纷纷，厉王便用卫国的巫者（卫巫）监视国人，只要有人批评朝政，就被立即处死。一时间镐京人人自危，"国人莫敢言，道路以目"。大臣召公奭劝谏说："防民之口，甚于防川。川壅而溃，伤人必多。民亦如之。"厉王不听。三年后，积怨已久的国人爆发暴动，围攻王宫。厉王仓皇出逃，奔至彘地（今山西霍县），至死未能回到镐京。厉王出逃后，由周公、召公二相共同执政，史称"共和行政"，这一年（前841年）是中国历史有确切纪年的开始。'
    }
  },
  '周宣王': {
    works: [
      { name: '宣王中兴', excerpt: '中兴之主', description: '在位期间整顿朝政，讨伐戎狄，开创"宣王中兴"。' },
      { name: '征伐猃狁', excerpt: '武功复振', description: '派尹吉甫、南仲等将领讨伐猃狁（犬戎），取得重大胜利。' }
    ],
    life_events: [
      { year: -827, title: '继位为王', description: '在共和行政后继位，决心中兴周朝', importance: 9 },
      { year: -820, title: '整顿朝政', description: '任用贤臣，整顿吏治，朝政清明', importance: 9 },
      { year: -810, title: '征伐戎狄', description: '派尹吉甫伐猃狁，取得胜利', importance: 10 },
      { year: -800, title: '中兴之世', description: '周朝国力恢复，史称"宣王中兴"', importance: 10 },
      { year: -782, title: '去世', description: '去世后周朝开始走向衰落', importance: 8 }
    ],
    story: {
      title: '周宣王——中兴之主，力挽周室',
      content: '周宣王姬静是西周第十一任君王，周厉王之子。厉王国人暴动后，宣王在共和行政十四年后继位。他决心整顿朝政，任用贤臣如仲山甫、尹吉甫、南仲等，削减冗员，整顿吏治，使周朝政治清明，国力恢复。宣王四年，他派尹吉甫率军征伐猃狁（犬戎），取得重大胜利，"薄伐猃狁，至于大原"；又派南仲屯兵朔方，修筑城防。宣王还"料民于太原"，统计人口，加强对民众的管理。在他的治理下，周朝一度出现复兴景象，史称"宣王中兴"。但宣王晚年也有失误，如干涉鲁国国君废立，导致诸侯不睦；千亩之战失利，南国之师尽丧。宣王去世后，周朝迅速衰落，其子周幽王即为亡国之君。'
    }
  },
  '周幽王': {
    works: [
      { name: '烽火戏诸侯', excerpt: '倾国倾城', description: '为博褒姒一笑，点燃烽火台戏弄诸侯，失信于天下。' },
      { name: '犬戎破镐京', excerpt: '西周灭亡', description: '犬戎攻入镐京，幽王被杀，西周灭亡。' }
    ],
    life_events: [
      { year: -782, title: '继位为王', description: '继位后不理朝政，沉迷女色', importance: 8 },
      { year: -779, title: '宠幸褒姒', description: '得到褒姒后倍加宠幸，废掉申后', importance: 9 },
      { year: -775, title: '烽火戏诸侯', description: '为博褒姒一笑，点燃烽火台', importance: 10 },
      { year: -771, title: '犬戎破京', description: '犬戎攻入镐京，幽王被杀，西周亡', importance: 10 }
    ],
    story: {
      title: '周幽王——烽火戏诸侯，西周亡',
      content: '周幽王姬宫湦是西周最后一位君王，以昏聩著称。他继位后不理朝政，重用虢石父等佞臣，沉迷酒色。幽王三年，他得到美女褒姒，倍加宠幸，甚至废掉申后和太子宜臼，改立褒姒之子伯服为太子。褒姒不爱笑，幽王想尽办法。虢石父献计，命人点燃烽火台（本为军事告警之用），诸侯见烽火，率大军赶来勤王，却发现并无敌情，只是幽王与褒姒在城楼上饮酒作乐。褒姒见诸侯狼狈模样，果然大笑。幽王很高兴，又多次点燃烽火。后来诸侯不再相信烽火，渐渐不来了。幽王十年，犬戎联合申侯进攻镐京，幽王再燃烽火，却无诸侯来救。犬戎攻破镐京，幽王被杀于骊山之下，褒姒被掳，西周灭亡。太子宜臼在诸侯支持下继位为周平王，迁都洛邑，开启东周时代。'
    }
  }
};

// 二级人物故事库
const STORY_ENRICHMENT = {
  '伯益': {
    title: '伯益——辅佐大禹，开嬴秦之源',
    content: '伯益，又作伯翳、柏翳，是上古至夏初的重要人物。他是大禹治水的重要功臣，被舜赐姓嬴氏，封为东夷部落首领。相传伯益擅长畜牧狩猎，发明了凿井技术。大禹晚年曾有意传位于伯益，大禹去世后伯益与启发生冲突，最终启继位建立夏朝，伯益则退守封地。伯益被尊为秦、赵、徐、梁等嬴姓诸国的共同祖先，是中华嬴姓的开派始祖。'
  },
  '皋陶': {
    title: '皋陶——狱神之祖，法制奠基',
    content: '皋陶，姓偃，是上古至夏初的重要政治家，与尧、舜、禹并称"上古四圣"。他担任大理（司法长官），制定刑法，被尊为中国法制文明的始祖。相传他"画地为牢"，创立了最早的监狱制度。皋陶主张"明刑弼教"，以教化为主、刑罚为辅，其法治思想影响了中华数千年。皋陶的后裔被封于英、六等地，是偃姓诸国的始祖。'
  },
  '傅说': {
    title: '傅说——版筑贤相，武丁重臣',
    content: '傅说，是商朝第二十二任君王武丁的名相。他出身微贱，原为傅岩（今山西平陆）的版筑工匠，在工地上被商王武丁发现。武丁不拘一格降人才，任命傅说为相，辅佐他治理商朝。傅说任职后，整顿吏治，选贤任能，辅佐武丁开创了"武丁中兴"的盛世。《孟子》中称"傅说举于版筑之间"，成为中国历史上"不拘一格用人才"的千古佳话。'
  },
  '比干': {
    title: '比干——千古忠臣，剖心殉道',
    content: '比干，是商朝末代君王帝辛（纣王）的叔父，官至少师。他生性耿直，见纣王荒淫无道，多次进谏。纣王宠爱妲己，荒废朝政，比干说："为人臣者，不得不以死争。"乃强谏三日不去。纣王大怒说："吾闻圣人之心有七窍，信有诸乎？"遂剖比干之心。比干是中国历史上最著名的忠臣之一，被后世尊为"文曲星"，其忠贞不屈的精神成为中华民族的重要品格象征。'
  },
  '微子': {
    title: '微子——殷之三仁，宋国始祖',
    content: '微子，姓子名启，是商纣王的庶兄。他与比干、箕子并称"殷之三仁"。见纣王无道，微子多次进谏无果，最终选择离开商朝。周武王灭商后，微子持祭器来到周军前，表示臣服。周武王恢复其爵位，后来周成王封微子于宋（今河南商丘），成为宋国的开国之君。微子的后裔以宋为姓，同时保留了商族的祭祀传统。'
  },
  '胶鬲': {
    title: '胶鬲——鱼盐之贾，周室内应',
    content: '胶鬲，是商朝末年的一位贤臣。他原本是隐于鱼盐市场的商贾，被周文王发现并推荐给纣王。胶鬲在商朝为官，暗中为周室传递情报。据说周武王伐纣前，曾派胶鬲与微子密约，约定灭商之日。胶鬲在牧野之战中起了重要的内应作用。周朝建立后，胶鬲被分封，其子孙以胶为姓。'
  },
  '吕尚': {
    title: '吕尚——太公望，兵家始祖',
    content: '吕尚，即姜子牙，是商朝末年至周初的杰出政治家、军事家。他出身微贱，年轻时曾做过屠夫、卖过酒，晚年才被周文王发现。他辅佐周文王、周武王，为周灭商立下首功。吕尚被封于齐，成为齐国开国之君。他著有《六韬》等兵书，被尊为"兵家始祖"。在民间传说中，姜子牙是神通广大的神仙人物，"姜太公钓鱼，愿者上钩"的典故家喻户晓。'
  },
  '召公奭': {
    title: '召公奭——周室太保，南国甘棠',
    content: '召公奭，姓姬名奭，是周文王之子，周武王、周公旦之弟。他与周公旦、太公望并称"周初三公"。武王灭商后，召公被封于燕（今北京地区），是燕国的开国之君。召公奭辅佐周成王治理西方，在陕地（今河南陕县）以南的地区宣扬文王之政，"蔽芾甘棠，勿剪勿伐，召伯所茇"，人们感念他的恩德，连他曾在下面休息过的甘棠树都不忍砍伐。召公奭是中华"甘棠遗爱"文化的源头。'
  },
  '毕公高': {
    title: '毕公高——周室重臣，魏国之祖',
    content: '毕公高，姓姬名高，是周文王第十五子。他辅佐周武王灭商，是"周初四圣"之一（与周公旦、召公奭、太公望并列）。灭商后被封于毕（今陕西咸阳），以毕为氏。毕公高在周成王时担任太保，与召公奭分治陕地。他的后裔毕万在春秋时为晋献公所重，封于魏地，后建立魏国。毕公高是中国毕、魏、冯、潘等姓的共同祖先。'
  },
  '散宜生': {
    title: '散宜生——周室贤臣，送礼救主',
    content: '散宜生，是周文王、周武王时期的重要贤臣。相传周文王被商纣王囚禁于羑里时，散宜生与闳夭等人一起，搜寻到有莘氏的美女、骊戎的骏马、有熊氏的良弓等奇珍异物，通过费仲献给纣王，才使得周文王获释。散宜生后辅佐周武王伐纣，在牧野之战中立下功劳。散宜生的后裔以散为姓，是散姓的重要来源。'
  },
  '太颠': {
    title: '太颠——周室贤臣，佐命元勋',
    content: '太颠，是周文王的重要贤臣，与散宜生、闳夭、辛甲、鬻熊并称"周初五臣"。他辅佐周文王治理周族，为周的崛起做出了重要贡献。周文王被囚羑里时，太颠与散宜生等人共同谋划营救方案。周灭商后，太颠的事迹在史书中记载不多，但他作为周室开国元勋的地位是确定的。'
  }
};

// 事件知识库
const EVENT_ENRICHMENT = {
  '太康失国': {
    narratives: [
      { year: -2055, title: '太康继位', description: '太康继承夏朝王位，但沉迷田猎，不理朝政', tag: '背景' },
      { year: -2050, title: '后羿夺权', description: '后羿（有穷氏首领）趁太康田猎不归，占据夏都斟鄩', tag: '转折' },
      { year: -2045, title: '太康流亡', description: '太康被迫流亡至斟鄩，至死未能返回都城', tag: '结局' }
    ],
    background: {
      political: '夏朝初建，世袭制尚不稳定。太康作为夏朝第三任君主，缺乏治国能力，导致王权旁落。',
      social: '太康沉迷田猎游乐，失去民心。有穷氏部落首领后羿觊觎夏王权位已久。',
      cultural: '夏朝时期部落联盟传统仍有较大影响，"家天下"观念尚未完全深入人心。'
    },
    impacts: [
      '夏朝进入约四十年的"无王之世"，政权被后羿、寒浞先后篡夺',
      '夏朝嫡系子孙被迫流亡，为后来少康中兴埋下伏笔',
      '暴露了世袭制初期的脆弱性，促使后来的君主加强王权建设'
    ],
    chain: [
      { title: '启建夏朝', year: '前2070年', type: 'cause', color: '#D8B26A' },
      { title: '太康失国', year: '前2050年', type: 'event', color: '#C34739' },
      { title: '少康中兴', year: '前2000年', type: 'consequence', color: '#355C5A' }
    ],
    significance: '太康失国是夏朝第一次严重政治危机，反映了世袭制初创时期的不稳定。'
  },
  '少康中兴': {
    narratives: [
      { year: -2020, title: '少康生于危难', description: '作为夏朝遗孤出生，自幼躲避寒浞追杀', tag: '背景' },
      { year: -2010, title: '寄居有虞氏', description: '投奔有虞氏，担任庖正，积蓄力量', tag: '蛰伏' },
      { year: -2000, title: '起兵复国', description: '联合有虞氏、有鬲氏等部落，击败寒浞', tag: '反攻' },
      { year: -1995, title: '光复夏朝', description: '回到夏都，恢复夏朝统治，开创中兴', tag: '中兴' }
    ],
    background: {
      political: '夏朝被后羿、寒浞篡夺近四十年，寒浞政权残暴无道，不得人心。',
      social: '寒浞诛杀夏朝王室，少康作为遗孤，自幼历经艰险，立志复国。',
      cultural: '夏朝正统观念在各部落中仍有影响，"天命在夏"的思想为复国提供了合法性。'
    },
    impacts: [
      '恢复夏朝统治，开启夏朝长达百年的稳定发展期',
      '确立"中兴"叙事传统，少康成为中国历史上第一个"中兴之主"',
      '巩固了世袭制和家天下的政治格局'
    ],
    chain: [
      { title: '太康失国', year: '前2050年', type: 'cause', color: '#C34739' },
      { title: '少康中兴', year: '前2000年', type: 'event', color: '#355C5A' },
      { title: '夏桀亡国', year: '前1600年', type: 'later', color: '#8B5A2B' }
    ],
    significance: '少康中兴是中国历史上第一个成功的复国事件，"少康中兴"成为后世描述王朝复兴的典范用语。'
  },
  '鸣条之战': {
    narratives: [
      { year: -1600, title: '商汤备战', description: '商汤任用伊尹为相，先后灭掉葛、韦、顾、昆吾等夏的属国', tag: '铺垫' },
      { year: -1600, title: '诸侯会盟', description: '商汤在景亳会盟诸侯，宣告伐桀', tag: '誓师' },
      { year: -1600, title: '鸣条决战', description: '商军与夏军决战于鸣条之野，夏军溃败', tag: '决战' },
      { year: -1600, title: '夏桀败亡', description: '夏桀逃亡南巢，死于途中，夏朝灭亡', tag: '结局' }
    ],
    background: {
      political: '夏桀暴虐无道，"率遏众力，率割夏邑"，失去诸侯和民心。',
      economic: '夏朝末年社会矛盾尖锐，商部落经济实力增强，形成对比。',
      social: '夏桀杀关龙逄、囚商汤，导致诸侯离心，许多部落叛夏归商。',
      cultural: '"天命靡常"的观念逐渐形成，为商汤代夏提供了思想依据。'
    },
    impacts: [
      '夏朝灭亡，商朝建立，中国历史进入青铜文明鼎盛期',
      '"天命靡常"的改朝换代观念深刻影响后世政治思想',
      '商朝的甲骨文、青铜文明成为中华文明的重要源头'
    ],
    chain: [
      { title: '太康失国', year: '前2050年', type: 'cause', color: '#C34739' },
      { title: '鸣条之战', year: '前1600年', type: 'event', color: '#355C5A' },
      { title: '盘庚迁殷', year: '前1300年', type: 'later', color: '#D8B26A' }
    ],
    significance: '鸣条之战是中国历史上第一次大规模改朝换代战争，"天命靡常"的观念从此深入人心。'
  },
  '盘庚迁殷': {
    narratives: [
      { year: -1300, title: '盘庚继位', description: '商朝迁都频繁，政治腐败，民生困苦', tag: '背景' },
      { year: -1298, title: '决意迁都', description: '盘庚力排众议，决定迁都于殷', tag: '决策' },
      { year: -1298, title: '发表训诰', description: '发布《盘庚》三篇，说服贵族与民众支持迁都', tag: '动员' },
      { year: -1295, title: '迁都完成', description: '迁都殷地，奠定商朝后期稳定基础', tag: '实施' }
    ],
    background: {
      political: '商朝自汤立国后五次迁都，王族内部纷争不断，政治不稳定。',
      geographic: '殷（安阳）地处中原中心，土地肥沃，四塞之固，有利于控制四方。'
    },
    impacts: [
      '商朝此后再未迁都，政治中心稳定近三百年',
      '为武丁中兴奠定了政治经济基础',
      '殷墟成为中国考古学的重要遗址'
    ],
    chain: [
      { title: '鸣条之战', year: '前1600年', type: 'cause', color: '#D8B26A' },
      { title: '盘庚迁殷', year: '前1298年', type: 'event', color: '#355C5A' },
      { title: '武丁中兴', year: '前1250年', type: 'consequence', color: '#C34739' }
    ],
    significance: '盘庚迁殷是商朝历史的转折点，此后商朝进入稳定发展期。'
  },
  '武丁中兴': {
    narratives: [
      { year: -1250, title: '武丁继位', description: '年少时生活于民间，继位后决心振兴商朝', tag: '背景' },
      { year: -1248, title: '任用傅说', description: '梦中得圣人，寻访傅说于傅岩版筑工地', tag: '求贤' },
      { year: -1240, title: '整顿内政', description: '在傅说辅佐下整顿吏治，政治清明', tag: '治政' },
      { year: -1230, title: '征伐四方', description: '大规模征伐鬼方、羌方、土方等方国', tag: '武功' },
      { year: -1200, title: '盛世鼎盛', description: '商朝政治、经济、文化达到鼎盛', tag: '鼎盛' }
    ],
    background: {
      political: '盘庚迁殷后商朝政治稳定，武丁继位前商朝处于恢复发展期。',
      economic: '中原地区农业生产发展，青铜铸造技术成熟，经济实力增强。'
    },
    impacts: [
      '商朝疆域空前辽阔，成为当时世界上最强大的国家之一',
      '青铜文明达到鼎盛，后母戊鼎、妇好墓等瑰宝均为武丁时期',
      '武丁中兴成为中国历史上"治世"的典范'
    ],
    chain: [
      { title: '盘庚迁殷', year: '前1298年', type: 'cause', color: '#D8B26A' },
      { title: '武丁中兴', year: '前1250年', type: 'event', color: '#C34739' },
      { title: '牧野之战', year: '前1046年', type: 'later', color: '#8B5A2B' }
    ],
    significance: '武丁中兴是商朝的黄金时代，奠定了中华文明的核心内涵。'
  },
  '牧野之战': {
    narratives: [
      { year: -1048, title: '孟津观兵', description: '周武王率八百诸侯会盟孟津，演练伐商', tag: '备战' },
      { year: -1046, title: '大军东进', description: '率战车三百乘、精锐四万五千人东进伐商', tag: '出征' },
      { year: -1046, title: '牧野誓师', description: '在牧野发表《牧誓》，历数纣王四大罪状', tag: '誓师' },
      { year: -1046, title: '商军倒戈', description: '商军奴隶阵前倒戈，周军势如破竹', tag: '决战' },
      { year: -1046, title: '纣王自焚', description: '纣王逃回朝歌登鹿台自焚，商朝灭亡', tag: '结局' }
    ],
    background: {
      political: '商纣王暴虐无道，微子、箕子、比干"殷之三仁"一去、一囚、一死。',
      economic: '纣王连年征伐东夷，国力大耗，而周族已"三分天下有其二"。',
      social: '纣王宠幸妲己，信任佞臣，导致王室内部矛盾激化。',
      geographic: '商朝大军东征，朝歌空虚，周军选择此时进攻，一举成功。'
    },
    impacts: [
      '延续六百年的商朝灭亡，周朝建立，中国进入西周时代',
      '"天命靡常"观念深入人心，为周朝"敬天保民"思想奠定基础',
      '周公旦摄政、制礼作乐，奠定中华礼乐文明的根基'
    ],
    chain: [
      { title: '武丁中兴', year: '前1250年', type: 'cause', color: '#D8B26A' },
      { title: '牧野之战', year: '前1046年', type: 'event', color: '#C34739' },
      { title: '周公摄政', year: '前1042年', type: 'consequence', color: '#355C5A' }
    ],
    significance: '牧野之战是中国历史上最著名的以少胜多战役之一，奠定了中华文明的礼乐根基。'
  },
  '周公摄政': {
    narratives: [
      { year: -1042, title: '武王去世', description: '周武王灭商后三年去世，太子诵年仅十三岁', tag: '危机' },
      { year: -1042, title: '周公摄政', description: '周公旦以王叔身份摄政，稳定周朝政局', tag: '摄政' },
      { year: -1041, title: '三监叛乱', description: '管叔、蔡叔、霍叔勾结武庚发动叛乱', tag: '叛乱' },
      { year: -1040, title: '东征平叛', description: '周公率军东征，三年平定叛乱', tag: '平叛' },
      { year: -1035, title: '还政成王', description: '摄政七年后还政于周成王', tag: '归政' }
    ],
    background: {
      political: '周武王灭商后不久去世，继位者周成王年幼，西周政权面临严重危机。',
      social: '三监（管叔、蔡叔、霍叔）不满周公摄政，勾结商朝遗民发动叛乱。'
    },
    impacts: [
      '稳定了西周政权，为成康之治奠定基础',
      '营建洛邑（成周），建立周朝对东方的有效统治',
      '制礼作乐，确立周朝礼乐制度，影响中华数千年'
    ],
    chain: [
      { title: '牧野之战', year: '前1046年', type: 'cause', color: '#D8B26A' },
      { title: '周公摄政', year: '前1042年', type: 'event', color: '#355C5A' },
      { title: '成康之治', year: '前1020年', type: 'consequence', color: '#C34739' }
    ],
    significance: '周公摄政是西周政治的核心事件，奠定了中国古代礼乐文明的根基。'
  },
  '国人暴动': {
    narratives: [
      { year: -850, title: '厉王专利', description: '周厉王实行"专利"政策，垄断山林川泽之利', tag: '背景' },
      { year: -845, title: '卫巫弭谤', description: '用卫巫监视国人，"防民之口，甚于防川"', tag: '暴政' },
      { year: -841, title: '暴动爆发', description: '镐京国人暴动，围攻王宫', tag: '爆发' },
      { year: -841, title: '厉王出逃', description: '厉王仓皇出逃彘地，共和行政开始', tag: '转折' }
    ],
    background: {
      political: '周厉王任用荣夷公，实行"专利"，剥夺贵族和平民的传统权益。',
      social: '镐京国人积累了大量不满情绪，"国人莫敢言，道路以目"。'
    },
    impacts: [
      '周厉王出逃至死未归，西周王权衰落',
      '周公、召公二相"共和行政"，开启中国历史有确切纪年',
      '"防民之口甚于防川"成为千古警示名言'
    ],
    chain: [
      { title: '成康之治', year: '前1000年', type: 'cause', color: '#D8B26A' },
      { title: '国人暴动', year: '前841年', type: 'event', color: '#C34739' },
      { title: '宣王中兴', year: '前827年', type: 'consequence', color: '#355C5A' }
    ],
    significance: '国人暴动是西周由盛转衰的转折点，"共和行政"开启了中国历史的精确纪年。'
  },
  '宣王中兴': {
    narratives: [
      { year: -827, title: '宣王继位', description: '在共和行政后继位，决心中兴周朝', tag: '背景' },
      { year: -820, title: '任用贤才', description: '任用仲山甫、尹吉甫、南仲等贤臣', tag: '治政' },
      { year: -810, title: '征伐戎狄', description: '派尹吉甫伐猃狁，取得重大胜利', tag: '武功' },
      { year: -800, title: '中兴之世', description: '周朝国力恢复，史称"宣王中兴"', tag: '鼎盛' }
    ],
    background: {
      political: '国人暴动后共和行政十四年，宣王继位面临百废待兴的局面。',
      social: '社会矛盾有所缓和，民众渴望安定。'
    },
    impacts: [
      '一度恢复周朝国力，延缓了西周灭亡的进程',
      '但宣王晚年政治失误，为幽王亡国埋下伏笔'
    ],
    chain: [
      { title: '国人暴动', year: '前841年', type: 'cause', color: '#C34739' },
      { title: '宣王中兴', year: '前827年', type: 'event', color: '#355C5A' },
      { title: '犬戎破京', year: '前771年', type: 'later', color: '#C34739' }
    ],
    significance: '宣王中兴是西周最后的辉煌，中兴之后周朝迅速走向衰落。'
  },
  '犬戎破镐京': {
    narratives: [
      { year: -782, title: '幽王继位', description: '继位后不理朝政，重用佞臣', tag: '背景' },
      { year: -779, title: '宠幸褒姒', description: '得到褒姒后倍加宠幸，废掉申后', tag: '导火索' },
      { year: -775, title: '烽火戏诸侯', description: '为博褒姒一笑，点燃烽火台，失信于诸侯', tag: '失信' },
      { year: -771, title: '犬戎进攻', description: '犬戎联合申侯进攻镐京', tag: '兵祸' },
      { year: -771, title: '西周灭亡', description: '幽王被杀，镐京陷落，西周灭亡', tag: '亡国' }
    ],
    background: {
      political: '周幽王荒废朝政，重用虢石父等佞臣，政治腐败。',
      social: '废掉申后和太子宜臼，引发王室内部矛盾。',
      geographic: '镐京地处关中平原，无险可守，易受游牧民族攻击。'
    },
    impacts: [
      '西周灭亡，平王东迁洛邑，开启东周时代',
      '"烽火戏诸侯"成为失信亡国的千古教训',
      '周王室从此衰微，春秋战国群雄并起'
    ],
    chain: [
      { title: '宣王中兴', year: '前827年', type: 'cause', color: '#D8B26A' },
      { title: '犬戎破镐京', year: '前771年', type: 'event', color: '#C34739' },
      { title: '平王东迁', year: '前770年', type: 'consequence', color: '#355C5A' }
    ],
    significance: '犬戎破镐京标志着西周的终结，中国进入东周（春秋战国）时代。'
  },
  '三监之乱': {
    narratives: [
      { year: -1042, title: '武王去世', description: '周武王灭商后三年去世，成王年幼', tag: '危机' },
      { year: -1041, title: '三监叛乱', description: '管叔、蔡叔、霍叔勾结武庚发动叛乱', tag: '叛乱' },
      { year: -1040, title: '周公东征', description: '周公旦率军东征，历经三年平定叛乱', tag: '平叛' },
      { year: -1038, title: '营建洛邑', description: '将商朝遗民迁至洛邑，加强控制', tag: '善后' }
    ],
    background: {
      political: '周武王去世后周成王年幼，周公旦以王叔身份摄政，引发管叔不满。',
      social: '三监（管蔡霍）对周公摄政不满，勾结商纣之子武庚叛乱。'
    },
    impacts: [
      '周公旦通过平叛巩固了周朝统治',
      '营建洛邑（成周），建立周朝对东方的控制',
      '为成康之治奠定了稳定基础'
    ],
    chain: [
      { title: '牧野之战', year: '前1046年', type: 'cause', color: '#D8B26A' },
      { title: '三监之乱', year: '前1041年', type: 'event', color: '#C34739' },
      { title: '周公摄政', year: '前1042年', type: 'consequence', color: '#355C5A' }
    ],
    significance: '三监之乱是西周初年最大的政治危机，周公东征平定叛乱，稳固了周朝统治。'
  },
  '成康之治': {
    narratives: [
      { year: -1035, title: '成王亲政', description: '周公还政后，周成王开始亲政', tag: '开启' },
      { year: -1030, title: '册封诸侯', description: '大规模分封诸侯，"封建亲戚，以藩屏周"', tag: '建制' },
      { year: -1020, title: '康王继位', description: '周康王继位，延续成王之治', tag: '延续' },
      { year: -1000, title: '天下太平', description: '成康时期天下安定，史称"成康之治"', tag: '盛世' }
    ],
    background: {
      political: '周公摄政奠定了政治基础，周成王、周康王励精图治。',
      economic: '井田制推行，农业生产发展，经济繁荣。'
    },
    impacts: [
      '西周进入最繁荣稳定的时期',
      '分封制、宗法制、礼乐制四大制度体系确立',
      '为后来的周厉王失政、宣王中兴埋下历史伏笔'
    ],
    chain: [
      { title: '周公摄政', year: '前1042年', type: 'cause', color: '#D8B26A' },
      { title: '成康之治', year: '前1035年', type: 'event', color: '#C34739' },
      { title: '国人暴动', year: '前841年', type: 'later', color: '#8B5A2B' }
    ],
    significance: '成康之治是西周最辉煌的时期，周朝的制度文明深刻塑造了此后两千年的中国社会。'
  }
};

module.exports = { PERSON_ENRICHMENT, STORY_ENRICHMENT, EVENT_ENRICHMENT };