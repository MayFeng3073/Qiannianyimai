/**
 * 补全夏商西周事件数据
 * 确保所有事件都有完整的 person_groups, impacts, person_relations
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_201.json');

// ========== 全面的事件人物配置 ==========
const EVENT_PERSON_CONFIG = {
  '太康失国': {
    leaders: [{ name: '后羿', role: '夺权者' }],
    participants: [
      { name: '寒浞', role: '后羿部下' },
      { name: '有穷氏', role: '支持部落' },
      { name: '太康', role: '失国之君' }
    ],
    opponents: [{ name: '太康', role: '失国之君' }],
    affected: [
      { name: '少康', role: '夏朝遗孤' },
      { name: '夏王族', role: '被迫流亡' }
    ]
  },
  '少康中兴': {
    leaders: [{ name: '少康', role: '中兴之主' }],
    participants: [
      { name: '有虞氏', role: '支持部落' },
      { name: '有鬲氏', role: '支持部落' },
      { name: '伯靡', role: '将领' },
      { name: '姒杼', role: '少康之子' }
    ],
    opponents: [
      { name: '寒浞', role: '篡政者' },
      { name: '浇', role: '寒浞之子' },
      { name: '豷', role: '寒浞次子' }
    ],
    affected: [{ name: '夏王族', role: '恢复统治' }]
  },
  '夏桀暴政': {
    leaders: [{ name: '夏桀', role: '亡国之君' }],
    participants: [
      { name: '妺喜', role: '宠妃' },
      { name: '赵梁', role: '佞臣' },
      { name: '干辛', role: '佞臣' }
    ],
    opponents: [
      { name: '关龙逄', role: '忠臣' },
      { name: '商汤', role: '讨伐者' },
      { name: '伊尹', role: '辅佐商汤' }
    ],
    affected: [
      { name: '有缗氏', role: '反叛部落' },
      { name: '夏王族', role: '亡国' }
    ]
  },
  '商汤灭夏': {
    leaders: [{ name: '商汤', role: '开国之君' }],
    participants: [
      { name: '伊尹', role: '军师' },
      { name: '仲虺', role: '辅佐大臣' },
      { name: '葛伯', role: '盟友' },
      { name: '鸣条', role: '决战之地' }
    ],
    opponents: [
      { name: '夏桀', role: '亡国之君' },
      { name: '韦顾昆吾', role: '夏之属国' }
    ],
    affected: [
      { name: '夏王族', role: '亡国' },
      { name: '商朝贵族', role: '新贵' }
    ]
  },
  '盘庚迁殷': {
    leaders: [{ name: '盘庚', role: '迁都之君' }],
    participants: [
      { name: '商朝贵族', role: '反对者→支持者' },
      { name: '平民', role: '被迁者' },
      { name: '傅说', role: '后续支持者' }
    ],
    opponents: [
      { name: '旧贵族', role: '反对迁都' }
    ],
    affected: [
      { name: '武丁', role: '后继之君' },
      { name: '殷民', role: '新定居者' }
    ]
  },
  '武丁中兴': {
    leaders: [{ name: '武丁', role: '盛世之王' }],
    participants: [
      { name: '傅说', role: '名相' },
      { name: '甘盘', role: '贤臣' },
      { name: '妇好', role: '王后/将领' },
      { name: '祖己', role: '贤臣' }
    ],
    opponents: [
      { name: '鬼方', role: '征伐对象' },
      { name: '羌方', role: '征伐对象' },
      { name: '土方', role: '征伐对象' }
    ],
    affected: [{ name: '商朝百姓', role: '受益者' }]
  },
  '妇好征伐': {
    leaders: [{ name: '妇好', role: '女将/王后' }],
    participants: [
      { name: '武丁', role: '商王/丈夫' },
      { name: '沚𣬐', role: '将领' },
      { name: '巴方', role: '征伐对象' }
    ],
    opponents: [
      { name: '羌方', role: '征伐对象' },
      { name: '土方', role: '征伐对象' },
      { name: '夷方', role: '征伐对象' }
    ],
    affected: [{ name: '商朝俘虏', role: '被带回' }]
  },
  '商王对外征伐': {
    leaders: [{ name: '商王', role: '征伐之君' }],
    participants: [
      { name: '妇好', role: '将领' },
      { name: '师般', role: '将领' },
      { name: '沚𣬐', role: '将领' }
    ],
    opponents: [
      { name: '羌方', role: '主要敌人' },
      { name: '土方', role: '敌人' },
      { name: '鬼方', role: '敌人' }
    ],
    affected: [{ name: '方国', role: '被征服' }]
  },
  '商末政治危机': {
    leaders: [{ name: '商纣王', role: '失政之君' }],
    participants: [
      { name: '妲己', role: '宠妃' },
      { name: '费仲', role: '佞臣' },
      { name: '恶来', role: '佞臣' }
    ],
    opponents: [
      { name: '比干', role: '忠臣' },
      { name: '微子', role: '庶兄' },
      { name: '箕子', role: '王叔' }
    ],
    affected: [
      { name: '周族', role: '趁机扩张' },
      { name: '商朝百姓', role: '受苦' }
    ]
  },
  '牧野之战': {
    leaders: [{ name: '周武王', role: '伐纣之君' }],
    participants: [
      { name: '姜子牙', role: '军师' },
      { name: '周公旦', role: '辅臣' },
      { name: '召公奭', role: '辅臣' },
      { name: '南宫括', role: '将领' },
      { name: '史佚', role: '史官' }
    ],
    opponents: [
      { name: '商纣王', role: '亡国之君' },
      { name: '妲己', role: '宠妃' },
      { name: '飞廉', role: '佞臣' },
      { name: '恶来', role: '佞臣' }
    ],
    affected: [
      { name: '微子', role: '投降者' },
      { name: '胶鬲', role: '内应' },
      { name: '商朝奴隶', role: '倒戈者' },
      { name: '商军', role: '溃败者' }
    ]
  },
  '周公东征': {
    leaders: [{ name: '周公旦', role: '摄政/东征主帅' }],
    participants: [
      { name: '周成王', role: '年幼天子' },
      { name: '召公奭', role: '辅臣' },
      { name: '姜子牙', role: '太师' }
    ],
    opponents: [
      { name: '管叔', role: '叛乱首领' },
      { name: '蔡叔', role: '叛乱者' },
      { name: '霍叔', role: '叛乱者' },
      { name: '武庚', role: '商纣之子' },
      { name: '奄国', role: '支持叛乱' }
    ],
    affected: [
      { name: '商朝遗民', role: '被迁至洛邑' },
      { name: '周公', role: '摄政' }
    ]
  },
  '成康之治': {
    leaders: [
      { name: '周成王', role: '成王' },
      { name: '周康王', role: '康王' }
    ],
    participants: [
      { name: '周公旦', role: '摄政(前期)' },
      { name: '召公奭', role: '太保' },
      { name: '毕公高', role: '太傅' },
      { name: '姜太公', role: '太师' }
    ],
    opponents: [],
    affected: [
      { name: '诸侯', role: '受封' },
      { name: '百姓', role: '受益者' }
    ]
  },
  '制礼作乐': {
    leaders: [{ name: '周公旦', role: '礼乐之祖' }],
    participants: [
      { name: '周成王', role: '继承者' },
      { name: '召公奭', role: '参与者' },
      { name: '史佚', role: '史官' }
    ],
    opponents: [],
    affected: [
      { name: '诸侯', role: '受约束者' },
      { name: '后世儒家', role: '继承者' },
      { name: '中国社会', role: '受影响者' }
    ]
  },
  '分封制': {
    leaders: [
      { name: '周武王', role: '分封之君' },
      { name: '周公旦', role: '制定者' }
    ],
    participants: [
      { name: '召公奭', role: '被封于燕' },
      { name: '姜子牙', role: '被封于齐' },
      { name: '毕公高', role: '被封于毕' }
    ],
    opponents: [],
    affected: [
      { name: '姬姓宗室', role: '被封者' },
      { name: '功臣', role: '被封者' },
      { name: '古圣王后裔', role: '被封者' }
    ]
  },
  '国人暴动': {
    leaders: [{ name: '周厉王', role: '失政之君' }],
    participants: [
      { name: '荣夷公', role: '专利倡导者' },
      { name: '卫巫', role: '弭谤执行者' },
      { name: '虢公长父', role: '支持者' }
    ],
    opponents: [
      { name: '召公奭', role: '劝谏者' },
      { name: '周公', role: '共和行政' }
    ],
    affected: [
      { name: '周宣王', role: '后继之君' },
      { name: '国人', role: '暴动者' }
    ]
  },
  '宣王中兴': {
    leaders: [{ name: '周宣王', role: '中兴之主' }],
    participants: [
      { name: '仲山甫', role: '贤臣' },
      { name: '尹吉甫', role: '将领' },
      { name: '南仲', role: '将领' },
      { name: '方叔', role: '将领' },
      { name: '虢文公', role: '贤臣' }
    ],
    opponents: [{ name: '猃狁', role: '征伐对象' }],
    affected: [
      { name: '周幽王', role: '后继之君' },
      { name: '诸侯', role: '受号令者' }
    ]
  },
  '犬戎攻周': {
    leaders: [{ name: '周幽王', role: '亡国之君' }],
    participants: [
      { name: '虢石父', role: '佞臣' },
      { name: '褒姒', role: '宠妃' },
      { name: '姬宜臼', role: '废太子' }
    ],
    opponents: [
      { name: '犬戎', role: '入侵者' },
      { name: '申侯', role: '联合进攻者' },
      { name: '缯侯', role: '联合进攻者' }
    ],
    affected: [
      { name: '周平王', role: '东迁之君' },
      { name: '郑桓公', role: '战死' },
      { name: '西周贵族', role: '被迫东迁' }
    ]
  },
  '西周灭亡': {
    leaders: [{ name: '周幽王', role: '亡国之君' }],
    participants: [
      { name: '虢石父', role: '佞臣' },
      { name: '褒姒', role: '被俘' },
      { name: '伯服', role: '幼子' }
    ],
    opponents: [
      { name: '犬戎', role: '入侵者' },
      { name: '申侯', role: '联合进攻者' },
      { name: '缯侯', role: '联合进攻者' }
    ],
    affected: [
      { name: '周平王', role: '东迁之君' },
      { name: '西周贵族', role: '被迫东迁' },
      { name: '郑桓公', role: '战死' }
    ]
  },
  '启建夏朝': {
    leaders: [{ name: '启', role: '开国之君' }],
    participants: [
      { name: '大禹', role: '前任首领' },
      { name: '伯益', role: '竞争者' },
      { name: '皋陶', role: '支持者' }
    ],
    opponents: [{ name: '有扈氏', role: '反对者' }],
    affected: [
      { name: '太康', role: '继位者' },
      { name: '夏王族', role: '受益' }
    ]
  },
  '国人暴动与共和行政': {
    leaders: [
      { name: '周厉王', role: '失政之君' },
      { name: '召公奭', role: '辅政大臣' }
    ],
    participants: [
      { name: '周公', role: '辅政大臣' },
      { name: '荣夷公', role: '专利倡导者' },
      { name: '卫巫', role: '弭谤执行者' }
    ],
    opponents: [{ name: '国人', role: '暴动民众' }],
    affected: [
      { name: '周宣王', role: '后继之君' },
      { name: '诸侯', role: '关注者' }
    ]
  },
  '烽火戏诸侯': {
    leaders: [{ name: '周幽王', role: '亡国之君' }],
    participants: [
      { name: '褒姒', role: '宠妃' },
      { name: '虢石父', role: '佞臣' },
      { name: '申后', role: '废后' },
      { name: '姬宜臼', role: '废太子' }
    ],
    opponents: [
      { name: '犬戎', role: '入侵者' },
      { name: '申侯', role: '联合进攻者' }
    ],
    affected: [
      { name: '周平王', role: '继位者' },
      { name: '诸侯', role: '被戏弄者' }
    ]
  }
};

// ========== 丰富 impacts 数据 ==========
const IMPACT_POOL = {
  '太康失国': [
    { name: '政治影响', score: 85, description: '夏朝进入约四十年的无王之世' },
    { name: '社会影响', score: 75, description: '夏朝嫡系子孙被迫流亡' },
    { name: '历史影响', score: 82, description: '暴露世袭制初期的脆弱性' }
  ],
  '少康中兴': [
    { name: '政治影响', score: 88, description: '恢复夏朝统治，开启百年稳定' },
    { name: '文化影响', score: 80, description: '确立中兴叙事传统' },
    { name: '历史影响', score: 85, description: '巩固世袭制和家天下格局' }
  ],
  '夏桀暴政': [
    { name: '政治影响', score: 92, description: '夏朝灭亡，商朝建立' },
    { name: '文化影响', score: 85, description: '"天命靡常"观念深入人心' },
    { name: '历史影响', score: 95, description: '夏桀成为千古昏君典型' }
  ],
  '商汤灭夏': [
    { name: '政治影响', score: 95, description: '夏朝灭亡，商朝建立' },
    { name: '文化影响', score: 88, description: '"天命靡常"改朝换代观念' },
    { name: '历史影响', score: 90, description: '商朝甲骨文、青铜文明兴起' }
  ],
  '盘庚迁殷': [
    { name: '政治影响', score: 86, description: '商朝此后再未迁都，稳定近三百年' },
    { name: '经济影响', score: 82, description: '殷地成为政治经济中心' },
    { name: '历史影响', score: 88, description: '殷墟成为中国考古学重要遗址' }
  ],
  '武丁中兴': [
    { name: '政治影响', score: 92, description: '商朝疆域空前辽阔' },
    { name: '文化影响', score: 88, description: '青铜文明达到鼎盛' },
    { name: '军事影响', score: 85, description: '武功赫赫，征服四方' }
  ],
  '妇好征伐': [
    { name: '军事影响', score: 80, description: '征伐羌方、土方等方国' },
    { name: '文化影响', score: 75, description: '体现商朝女性将领地位' },
    { name: '历史影响', score: 78, description: '妇好墓出土文物丰富' }
  ],
  '商王对外征伐': [
    { name: '军事影响', score: 82, description: '大规模征伐周边方国' },
    { name: '政治影响', score: 78, description: '扩大商朝疆域' },
    { name: '经济影响', score: 75, description: '获取大量俘虏和资源' }
  ],
  '商末政治危机': [
    { name: '政治影响', score: 90, description: '商朝统治根基动摇' },
    { name: '社会影响', score: 85, description: '诸侯离心，民不聊生' },
    { name: '历史影响', score: 92, description: '为周灭商创造条件' }
  ],
  '牧野之战': [
    { name: '政治影响', score: 98, description: '延续六百年的商朝灭亡' },
    { name: '文化影响', score: 92, description: '奠定中华礼乐文明根基' },
    { name: '历史影响', score: 95, description: '以少胜多战役经典' }
  ],
  '周公东征': [
    { name: '政治影响', score: 90, description: '稳定西周政权' },
    { name: '军事影响', score: 85, description: '三年东征平定叛乱' },
    { name: '历史影响', score: 88, description: '营建洛邑，控制东方' }
  ],
  '成康之治': [
    { name: '政治影响', score: 95, description: '西周最繁荣稳定时期' },
    { name: '文化影响', score: 90, description: '制度体系确立' },
    { name: '社会影响', score: 85, description: '天下太平，百姓安乐' }
  ],
  '制礼作乐': [
    { name: '文化影响', score: 98, description: '奠定中华礼乐文明根基' },
    { name: '政治影响', score: 92, description: '确立分封制、宗法制' },
    { name: '历史影响', score: 95, description: '影响中国两千年' }
  ],
  '分封制': [
    { name: '政治影响', score: 94, description: '建立周朝封建制度' },
    { name: '社会影响', score: 88, description: '形成宗法社会结构' },
    { name: '历史影响', score: 90, description: '影响中国数千年' }
  ],
  '国人暴动': [
    { name: '政治影响', score: 92, description: '西周王权衰落' },
    { name: '文化影响', score: 88, description: '"防民之口甚于防川"' },
    { name: '历史影响', score: 95, description: '开启中国历史确切纪年' }
  ],
  '宣王中兴': [
    { name: '政治影响', score: 85, description: '一度恢复周朝国力' },
    { name: '军事影响', score: 82, description: '征伐猃狁取得胜利' },
    { name: '历史影响', score: 80, description: '延缓西周灭亡' }
  ],
  '犬戎攻周': [
    { name: '政治影响', score: 95, description: '西周灭亡' },
    { name: '社会影响', score: 88, description: '周王室衰微' },
    { name: '历史影响', score: 92, description: '进入东周时代' }
  ],
  '西周灭亡': [
    { name: '政治影响', score: 98, description: '西周灭亡，平王东迁' },
    { name: '社会影响', score: 90, description: '周王室从此衰微' },
    { name: '历史影响', score: 95, description: '春秋战国群雄并起' }
  ],
  '启建夏朝': [
    { name: '政治影响', score: 96, description: '开创世袭制' },
    { name: '文化影响', score: 92, description: '"家天下"观念形成' },
    { name: '历史影响', score: 98, description: '开启中国王朝时代' }
  ],
  '国人暴动与共和行政': [
    { name: '政治影响', score: 92, description: '西周王权衰落' },
    { name: '文化影响', score: 90, description: '"防民之口甚于防川"' },
    { name: '历史影响', score: 95, description: '开启中国确切纪年' }
  ],
  '烽火戏诸侯': [
    { name: '政治影响', score: 94, description: '失信于天下，西周危亡' },
    { name: '文化影响', score: 88, description: '"烽火戏诸侯"成为典故' },
    { name: '历史影响', score: 92, description: '直接导致西周灭亡' }
  ]
};

// ========== 生成 person_relations ==========
function generatePersonRelations(event) {
  const g = EVENT_PERSON_CONFIG[event.name];
  if (!g) return event.person_relations || [];
  
  const relations = [];
  const leaders = g.leaders || [];
  const participants = g.participants || [];
  const opponents = g.opponents || [];
  const affected = g.affected || [];
  
  // 领导者与对手: 敌对
  leaders.forEach(l => {
    opponents.forEach(o => {
      relations.push({
        source: l.name,
        target: o.name,
        type: 'hostile',
        desc: `${l.name}与${o.name}为敌对关系`
      });
    });
    
    // 领导者与参与者: 君臣
    participants.forEach(p => {
      if (p.name !== l.name) {
        relations.push({
          source: l.name,
          target: p.name,
          type: 'lord_vassal',
          desc: `${p.name}辅佐${l.name}`
        });
      }
    });
  });
  
  // 参与者之间: 联盟
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      relations.push({
        source: participants[i].name,
        target: participants[j].name,
        type: 'alliance',
        desc: `${participants[i].name}与${participants[j].name}为同僚`
      });
    }
  }
  
  // 去重
  const seen = new Set();
  return relations.filter(r => {
    const key = `${r.source}-${r.target}-${r.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ========== 主流程 ==========
function main() {
  console.log('='.repeat(60));
  console.log('🔧 夏商西周事件数据补全脚本');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ 找不到文件: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  let events = raw.events || [];
  const persons = raw.persons || [];
  const dynasty = raw.dynasty;
  const keywords = raw.keywords || [];
  
  console.log(`\n📊 事件数量: ${events.length}`);
  
  // 补全每个事件
  events = events.map(event => {
    const enriched = { ...event };
    const config = EVENT_PERSON_CONFIG[event.name];
    
    // 1. 补全 person_groups
    if (config) {
      enriched.person_groups = {
        leaders: config.leaders || [],
        participants: config.participants || [],
        opponents: config.opponents || [],
        affected: config.affected || []
      };
    } else if (!enriched.person_groups) {
      enriched.person_groups = { leaders: [], participants: [], opponents: [], affected: [] };
    }
    
    // 2. 补全 impacts (确保是对象格式)
    const impactsConfig = IMPACT_POOL[event.name];
    if (impactsConfig) {
      enriched.impacts = impactsConfig;
    } else if (!enriched.impacts || (Array.isArray(enriched.impacts) && enriched.impacts.length === 0)) {
      enriched.impacts = [
        { name: '政治影响', score: 75, description: `${event.name}对当时政治格局产生了影响` },
        { name: '社会影响', score: 70, description: `${event.name}对社会层面产生了影响` },
        { name: '历史影响', score: 80, description: `${event.name}在中国历史上具有重要地位` }
      ];
    } else if (Array.isArray(enriched.impacts) && typeof enriched.impacts[0] === 'string') {
      // 字符串数组转换为对象数组
      enriched.impacts = enriched.impacts.map((imp, idx) => ({
        name: ['政治影响', '社会影响', '文化影响'][idx % 3],
        score: 75 + idx * 5,
        description: imp
      }));
    }
    
    // 3. 补全 person_relations
    enriched.person_relations = generatePersonRelations(enriched);
    
    // 4. 更新 related_persons
    const personNames = new Set();
    ['leaders', 'participants', 'opponents', 'affected'].forEach(key => {
      const arr = enriched.person_groups?.[key] || [];
      arr.forEach(p => personNames.add(p.name));
    });
    enriched.related_persons = Array.from(personNames);
    
    return enriched;
  });
  
  // 写入
  const output = {
    dynasty,
    persons,
    events,
    keywords,
    _meta: {
      ...raw._meta,
      enriched_at: new Date().toISOString(),
      enrichment_version: '4.0',
      stats: {
        persons: persons.length,
        events: events.length,
        person_relations: persons.reduce((sum, p) => sum + (p.related_people?.length || 0), 0),
        person_event_relations: persons.reduce((sum, p) => sum + (p.related_events?.length || 0), 0),
        keywords: keywords.length
      }
    }
  };
  
  fs.writeFileSync(INPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log(`\n📊 补全后的事件统计:`);
  events.forEach(e => {
    const g = e.person_groups || {};
    const total = (g.leaders?.length || 0) + (g.participants?.length || 0) + (g.opponents?.length || 0) + (g.affected?.length || 0);
    console.log(`  ${e.name} - 人物:${total} 影响:${e.impacts?.length || 0} 关系:${e.person_relations?.length || 0}`);
  });
  
  console.log(`\n✅ 完成！共 ${events.length} 个事件`);
}

main();