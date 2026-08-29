/**
 * 为 dynasty_202.json 中 18 个「单节点」（仅核心人物、无关系连线）的二级人物补齐 narrative_relations。
 *
 * 设计遵循「因缘际会」叙事关系图规则：
 *   1 个核心人物（center，朱砂红最大）+ 3~4 个关键外围节点（top/bottom/left/right）；
 *   连线标签使用叙事性动词短语（如「谗害」「拥立」「酿成」），可直接读懂人物因缘；
 *   少节点、高信息量，不把连续动作拆成节点。
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'frontend', 'public', 'data', 'dynasty_202.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

// id -> { nodes, edges }
const enrich = {
  202102: {
    nodes: [
      { id: 'qxg', name: '齐僖公', type: 'person', size: 'large', pos: 'center' },
      { id: 'lg', name: '鲁桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'wj', name: '文姜', type: 'person', size: 'medium', pos: 'left' },
      { id: 'qlyh', name: '齐鲁联姻', type: 'story', size: 'medium', pos: 'right' },
      { id: 'wjzh', name: '文姜之祸', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'qxg', target: 'lg', label: '嫁女于', direction: 'forward' },
      { source: 'qxg', target: 'wj', label: '爱女', direction: 'forward' },
      { source: 'wj', target: 'wjzh', label: '引发', direction: 'forward' },
      { source: 'qlyh', target: 'wjzh', label: '埋下祸端', direction: 'forward' }
    ]
  },
  202103: {
    nodes: [
      { id: 'qzg', name: '齐昭公', type: 'person', size: 'large', pos: 'center' },
      { id: 'qhg', name: '齐桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'qgby', name: '齐国霸业', type: 'story', size: 'medium', pos: 'left' },
      { id: 'zhhm', name: '诸侯会盟', type: 'event', size: 'medium', pos: 'right' },
      { id: 'jwdd', name: '君位动荡', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'qhg', target: 'qgby', label: '肇基', direction: 'forward' },
      { source: 'qgby', target: 'qzg', label: '承继', direction: 'forward' },
      { source: 'qzg', target: 'zhhm', label: '参与', direction: 'forward' },
      { source: 'qzg', target: 'jwdd', label: '身后', direction: 'forward' }
    ]
  },
  202115: {
    nodes: [
      { id: 'sd', name: '竖刁', type: 'person', size: 'large', pos: 'center' },
      { id: 'qhg', name: '齐桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'gz', name: '管仲', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wgz', name: '五公子争位', type: 'story', size: 'medium', pos: 'right' },
      { id: 'qhgs', name: '齐桓公之死', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'sd', target: 'qhg', label: '自宫事君', direction: 'forward' },
      { source: 'gz', target: 'qhg', label: '劝谏远佞', direction: 'forward' },
      { source: 'sd', target: 'wgz', label: '专权', direction: 'forward' },
      { source: 'sd', target: 'qhgs', label: '致其困死', direction: 'forward' }
    ]
  },
  202116: {
    nodes: [
      { id: 'yy', name: '易牙', type: 'person', size: 'large', pos: 'center' },
      { id: 'qhg', name: '齐桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'gz', name: '管仲', type: 'person', size: 'medium', pos: 'left' },
      { id: 'sd', name: '竖刁', type: 'person', size: 'medium', pos: 'bottom' },
      { id: 'wgz', name: '五公子争位', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'yy', target: 'qhg', label: '烹子献媚', direction: 'forward' },
      { source: 'gz', target: 'qhg', label: '临终劝谏', direction: 'forward' },
      { source: 'yy', target: 'sd', label: '伙同', direction: 'forward' },
      { source: 'yy', target: 'wgz', label: '参与', direction: 'forward' }
    ]
  },
  202117: {
    nodes: [
      { id: 'kf', name: '开方', type: 'person', size: 'large', pos: 'center' },
      { id: 'qhg', name: '齐桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'gz', name: '管仲', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wg', name: '卫国', type: 'person', size: 'medium', pos: 'bottom' },
      { id: 'wgz', name: '五公子争位', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'kf', target: 'qhg', label: '弃父事齐', direction: 'forward' },
      { source: 'gz', target: 'qhg', label: '劝谏远佞', direction: 'forward' },
      { source: 'kf', target: 'wg', label: '弃国', direction: 'forward' },
      { source: 'kf', target: 'wgz', label: '助乱', direction: 'forward' }
    ]
  },
  202118: {
    nodes: [
      { id: 'gzwk', name: '公子无亏', type: 'person', size: 'large', pos: 'center' },
      { id: 'qhg', name: '齐桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'yy', name: '易牙', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wgz', name: '五公子争位', type: 'story', size: 'medium', pos: 'right' },
      { id: 'bysl', name: '霸业衰落', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'qhg', target: 'gzwk', label: '身后无主', direction: 'forward' },
      { source: 'yy', target: 'gzwk', label: '拥立', direction: 'forward' },
      { source: 'gzwk', target: 'wgz', label: '挑起', direction: 'forward' },
      { source: 'wgz', target: 'bysl', label: '导致', direction: 'forward' }
    ]
  },
  202119: {
    nodes: [
      { id: 'gp', name: '齐昭公子潘', type: 'person', size: 'large', pos: 'center' },
      { id: 'qhg', name: '齐桓公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'gzwk', name: '公子无亏', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wgz', name: '五公子争位', type: 'story', size: 'medium', pos: 'right' },
      { id: 'bysl', name: '霸业衰落', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'qhg', target: 'wgz', label: '身后', direction: 'forward' },
      { source: 'gp', target: 'wgz', label: '参与', direction: 'forward' },
      { source: 'gzwk', target: 'gp', label: '同室相争', direction: 'forward' },
      { source: 'wgz', target: 'bysl', label: '导致', direction: 'forward' }
    ]
  },
  202120: {
    nodes: [
      { id: 'qlg', name: '齐灵公', type: 'person', size: 'large', pos: 'center' },
      { id: 'tzg', name: '太子光', type: 'person', size: 'medium', pos: 'top' },
      { id: 'gzy', name: '公子牙', type: 'person', size: 'medium', pos: 'left' },
      { id: 'cz', name: '崔杼', type: 'person', size: 'medium', pos: 'bottom' },
      { id: 'qgzl', name: '齐国政乱', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'qlg', target: 'tzg', label: '废黜', direction: 'forward' },
      { source: 'qlg', target: 'gzy', label: '改立', direction: 'forward' },
      { source: 'cz', target: 'tzg', label: '拥立复位', direction: 'forward' },
      { source: 'qlg', target: 'qgzl', label: '遗祸', direction: 'forward' }
    ]
  },
  202122: {
    nodes: [
      { id: 'lj', name: '骊姬', type: 'person', size: 'large', pos: 'center' },
      { id: 'jxg', name: '晋献公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'ss', name: '太子申生', type: 'person', size: 'medium', pos: 'left' },
      { id: 'xq', name: '奚齐', type: 'person', size: 'medium', pos: 'bottom' },
      { id: 'jgdl', name: '晋国大乱', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'lj', target: 'jxg', label: '受宠', direction: 'forward' },
      { source: 'lj', target: 'ss', label: '谗害', direction: 'forward' },
      { source: 'lj', target: 'xq', label: '欲立', direction: 'forward' },
      { source: 'lj', target: 'jgdl', label: '酿成', direction: 'forward' }
    ]
  },
  202123: {
    nodes: [
      { id: 'xq', name: '奚齐', type: 'person', size: 'large', pos: 'center' },
      { id: 'jxg', name: '晋献公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'lj', name: '骊姬', type: 'person', size: 'medium', pos: 'left' },
      { id: 'lk', name: '里克', type: 'person', size: 'medium', pos: 'right' },
      { id: 'cwjg', name: '重耳归国', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'jxg', target: 'xq', label: '欲立', direction: 'forward' },
      { source: 'lj', target: 'xq', label: '扶立', direction: 'forward' },
      { source: 'lk', target: 'xq', label: '政变诛杀', direction: 'forward' },
      { source: 'xq', target: 'cwjg', label: '之死促成', direction: 'forward' }
    ]
  },
  202148: {
    nodes: [
      { id: 'cww', name: '楚文王', type: 'person', size: 'large', pos: 'center' },
      { id: 'cww2', name: '楚武王', type: 'person', size: 'medium', pos: 'top' },
      { id: 'cck', name: '楚成王', type: 'person', size: 'medium', pos: 'bottom' },
      { id: 'msx', name: '灭申息', type: 'event', size: 'medium', pos: 'left' },
      { id: 'zg', name: '郑国', type: 'person', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'cww2', target: 'cww', label: '开创基业', direction: 'forward' },
      { source: 'cww', target: 'msx', label: '灭国拓疆', direction: 'forward' },
      { source: 'cww', target: 'zg', label: '伐郑北进', direction: 'forward' },
      { source: 'cww', target: 'cck', label: '奠基', direction: 'forward' }
    ]
  },
  202165: {
    nodes: [
      { id: 'qxg2', name: '秦宣公', type: 'person', size: 'large', pos: 'center' },
      { id: 'qmg', name: '秦穆公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'jg', name: '晋国', type: 'person', size: 'medium', pos: 'left' },
      { id: 'hxzz', name: '河西之争', type: 'event', size: 'medium', pos: 'right' },
      { id: 'qgqs', name: '秦国强盛', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'jg', target: 'hxzz', label: '争夺', direction: 'forward' },
      { source: 'qxg2', target: 'hxzz', label: '主政', direction: 'forward' },
      { source: 'hxzz', target: 'qgqs', label: '奠定', direction: 'forward' },
      { source: 'qgqs', target: 'qmg', label: '传承', direction: 'forward' }
    ]
  },
  202167: {
    nodes: [
      { id: 'qkg', name: '秦康公', type: 'person', size: 'large', pos: 'center' },
      { id: 'jwg', name: '晋文公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'qmg', name: '秦穆公', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wysj', name: '渭阳送舅', type: 'story', size: 'medium', pos: 'right' },
      { id: 'qjgb', name: '秦晋交兵', type: 'event', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'qkg', target: 'jwg', label: '送舅归国', direction: 'forward' },
      { source: 'qmg', target: 'qkg', label: '父辈', direction: 'forward' },
      { source: 'qkg', target: 'wysj', label: '感念', direction: 'forward' },
      { source: 'qkg', target: 'qjgb', label: '继位交兵', direction: 'forward' }
    ]
  },
  202177: {
    nodes: [
      { id: 'yh', name: '医和', type: 'person', size: 'large', pos: 'center' },
      { id: 'jjg', name: '晋景公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'ylzy', name: '医理之言', type: 'story', size: 'medium', pos: 'right' },
      { id: 'zzjl', name: '左传载录', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'yh', target: 'jjg', label: '诊治', direction: 'forward' },
      { source: 'yh', target: 'ylzy', label: '阐发', direction: 'forward' },
      { source: 'ylzy', target: 'zzjl', label: '见录', direction: 'forward' }
    ]
  },
  202179: {
    nodes: [
      { id: 'lhg', name: '鲁桓公', type: 'person', size: 'large', pos: 'center' },
      { id: 'qxg3', name: '齐襄公', type: 'person', size: 'medium', pos: 'top' },
      { id: 'wj', name: '文姜', type: 'person', size: 'medium', pos: 'left' },
      { id: 'qljw', name: '齐鲁交恶', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'lhg', target: 'qxg3', label: '会盟', direction: 'forward' },
      { source: 'qxg3', target: 'lhg', label: '谋害', direction: 'forward' },
      { source: 'wj', target: 'lhg', label: '牵连', direction: 'forward' },
      { source: 'lhg', target: 'qljw', label: '身后', direction: 'forward' }
    ]
  },
  202210: {
    nodes: [
      { id: 'bl', name: '被离', type: 'person', size: 'large', pos: 'center' },
      { id: 'wzx', name: '伍子胥', type: 'person', size: 'medium', pos: 'top' },
      { id: 'whhl', name: '吴王阖闾', type: 'person', size: 'medium', pos: 'bottom' },
      { id: 'wgjq', name: '吴国崛起', type: 'story', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'wzx', target: 'bl', label: '荐贤', direction: 'forward' },
      { source: 'bl', target: 'whhl', label: '效力', direction: 'forward' },
      { source: 'whhl', target: 'wgjq', label: '开创', direction: 'forward' }
    ]
  },
  202212: {
    nodes: [
      { id: 'gsx', name: '公孙雄', type: 'person', size: 'large', pos: 'center' },
      { id: 'whhl', name: '吴王阖闾', type: 'person', size: 'medium', pos: 'top' },
      { id: 'cg', name: '楚国', type: 'person', size: 'medium', pos: 'left' },
      { id: 'wczz', name: '吴楚之战', type: 'event', size: 'medium', pos: 'right' },
      { id: 'wgby', name: '吴国霸业', type: 'story', size: 'medium', pos: 'bottom' }
    ],
    edges: [
      { source: 'gsx', target: 'wczz', label: '从征', direction: 'forward' },
      { source: 'whhl', target: 'wczz', label: '兴兵', direction: 'forward' },
      { source: 'cg', target: 'wczz', label: '敌国', direction: 'forward' },
      { source: 'wczz', target: 'wgby', label: '开创', direction: 'forward' }
    ]
  },
  202214: {
    nodes: [
      { id: 'fg', name: '夫概', type: 'person', size: 'large', pos: 'center' },
      { id: 'whhl', name: '吴王阖闾', type: 'person', size: 'medium', pos: 'top' },
      { id: 'bjzj', name: '柏举之捷', type: 'event', size: 'medium', pos: 'left' },
      { id: 'zlww', name: '自立为王', type: 'story', size: 'medium', pos: 'bottom' },
      { id: 'cg', name: '楚国', type: 'person', size: 'medium', pos: 'right' }
    ],
    edges: [
      { source: 'fg', target: 'bjzj', label: '率军', direction: 'forward' },
      { source: 'fg', target: 'zlww', label: '自立', direction: 'forward' },
      { source: 'whhl', target: 'fg', label: '回师讨伐', direction: 'forward' },
      { source: 'fg', target: 'cg', label: '败奔', direction: 'forward' }
    ]
  }
}

let updated = 0
data.persons.forEach(p => {
  if (enrich[p.id]) {
    p.narrative_relations = enrich[p.id]
    updated++
  }
})

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
console.log(`已补齐 ${updated} 位春秋二级人物的 narrative_relations`)
