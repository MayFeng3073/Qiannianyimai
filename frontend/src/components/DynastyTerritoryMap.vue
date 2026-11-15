<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Props {
  dynastyId: number
  dynastyName: string
}
const props = defineProps<Props>()

interface GeoFeature {
  properties: { name?: string }
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
}

const features = ref<GeoFeature[]>([])
const loadFailed = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/data/china-provinces.json')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    features.value = (json.features || []).filter((f: GeoFeature) => f.geometry && f.properties?.name)
  } catch {
    loadFailed.value = true
  }
})

/* ---------------- 统一投影：墨卡托投影（避免高纬被压扁） ---------------- */
const LON_MIN = 73.5
const LON_MAX = 135.5
const LAT_MAX = 53.8
const W = 560
const PAD_X = 12
const PAD_Y = 12

const mercLat = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const MERC_TOP = mercLat(LAT_MAX)
const SX = (W - PAD_X * 2) / (LON_MAX - LON_MIN)
// 墨卡托纵坐标以弧度计，换算成同一像素比例，保证经纬比例不失真
const S_RAD = (SX * 180) / Math.PI

const projX = (lon: number) => PAD_X + (lon - LON_MIN) * SX
const projY = (lat: number) => PAD_Y + (MERC_TOP - mercLat(lat)) * S_RAD

const ringPath = (ring: number[][]) => {
  let d = ''
  for (let i = 0; i < ring.length; i++) {
    const x = projX(ring[i][0]).toFixed(1)
    const y = projY(ring[i][1]).toFixed(1)
    d += (i === 0 ? 'M' : 'L') + x + ' ' + y
  }
  return d + 'Z'
}

const featurePath = (f: GeoFeature) => {
  const g = f.geometry
  const polys = (g.type === 'Polygon' ? [g.coordinates] : g.coordinates) as number[][][][]
  return polys.map((poly) => poly.map(ringPath).join('')).join('')
}

const provinceName = (f: GeoFeature) =>
  (f.properties.name || '')
    .replace(/维吾尔|壮族|回族|特别行政区|自治区|省|市/g, '')
    .trim()

/* ---------------- 控制等级：2 直接统治 / 1 羁縻·都护 / 0 未及 ---------------- */
type Level = 0 | 1 | 2
type LevelTable = Record<string, Level>

const LEVELS: Record<number, LevelTable> = {
  // 唐（高宗极盛）：羁縻与都护府不画成直辖，避免把势力范围当成版图
  112: {
    陕西: 2, 河南: 2, 山西: 2, 河北: 2, 山东: 2, 安徽: 2, 江苏: 2, 浙江: 2, 江西: 2,
    福建: 2, 湖北: 2, 湖南: 2, 广东: 2, 广西: 2, 海南: 2, 四川: 2, 重庆: 2, 贵州: 2,
    甘肃: 2, 宁夏: 2, 北京: 2, 天津: 2, 上海: 2,
    新疆: 1, 内蒙古: 1, 辽宁: 1, 吉林: 1, 青海: 1,
    西藏: 0, 云南: 0, 黑龙江: 0, 台湾: 0, 香港: 2, 澳门: 2
  },
  // 宋（北宋）：燕云未得、河西与西域未及，西南仅羁縻
  113: {
    河南: 2, 山东: 2, 安徽: 2, 江苏: 2, 浙江: 2, 江西: 2, 福建: 2, 湖北: 2, 湖南: 2,
    广东: 2, 广西: 2, 海南: 2, 四川: 2, 重庆: 2, 陕西: 2, 上海: 2, 香港: 2, 澳门: 2,
    河北: 1, 山西: 1, 贵州: 1, 北京: 1, 天津: 1,
    内蒙古: 0, 辽宁: 0, 吉林: 0, 黑龙江: 0, 新疆: 0, 西藏: 0, 青海: 0, 云南: 0,
    宁夏: 0, 甘肃: 0, 台湾: 0
  },
  // 元（忽必烈时期）：漠北、东北、青藏并入，西域为宗藩，澎湖设巡检司
  114: {
    内蒙古: 2, 辽宁: 2, 吉林: 2, 黑龙江: 2, 河北: 2, 山西: 2, 山东: 2, 河南: 2,
    陕西: 2, 甘肃: 2, 宁夏: 2, 安徽: 2, 江苏: 2, 浙江: 2, 江西: 2, 福建: 2,
    湖北: 2, 湖南: 2, 广东: 2, 广西: 2, 海南: 2, 四川: 2, 重庆: 2, 贵州: 2,
    云南: 2, 西藏: 2, 青海: 2, 北京: 2, 天津: 2, 上海: 2, 香港: 2, 澳门: 2,
    新疆: 1, 台湾: 1
  }
}

const FILL: Record<Level, string> = {
  2: '#DEBB76',
  1: '#EFD9A8',
  0: '#E7E3DA'
}
// 填色与描边同色：相邻同色省份拼缝自然消失，不再出现「一块块拼贴/重复描边」
const STROKE: Record<Level, string> = {
  2: '#DEBB76',
  1: '#EFD9A8',
  0: '#E7E3DA'
}

const levelOf = (name: string): Level => {
  const table = LEVELS[props.dynastyId] || {}
  return table[name] ?? 0
}

const shapes = computed(() => {
  return features.value
    .map((f) => {
      const name = provinceName(f)
      const level = levelOf(name)
      return { name, level, d: featurePath(f) }
    })
    .sort((a, b) => a.level - b.level)
})

/* ---------------- 关键城市（经纬度） ---------------- */
interface City {
  name: string
  lon: number
  lat: number
  capital?: boolean
}

const CITIES: Record<number, City[]> = {
  112: [
    { name: '长安', lon: 108.94, lat: 34.34, capital: true },
    { name: '洛阳', lon: 112.45, lat: 34.62 },
    { name: '扬州', lon: 119.42, lat: 32.39 },
    { name: '成都', lon: 104.07, lat: 30.66 },
    { name: '广州', lon: 113.26, lat: 23.13 },
    { name: '龟兹', lon: 82.96, lat: 41.72 },
    { name: '北庭', lon: 89.19, lat: 43.99 },
    { name: '安东', lon: 125.75, lat: 39.03 }
  ],
  113: [
    { name: '开封', lon: 114.31, lat: 34.8, capital: true },
    { name: '临安', lon: 120.16, lat: 30.27 },
    { name: '江宁', lon: 118.8, lat: 32.06 },
    { name: '成都', lon: 104.07, lat: 30.66 },
    { name: '泉州', lon: 118.59, lat: 24.91 },
    { name: '广州', lon: 113.26, lat: 23.13 },
    { name: '秦州', lon: 105.72, lat: 34.58 }
  ],
  114: [
    { name: '大都', lon: 116.4, lat: 39.9, capital: true },
    { name: '上都', lon: 116.18, lat: 42.36 },
    { name: '西安', lon: 108.94, lat: 34.34 },
    { name: '成都', lon: 104.07, lat: 30.66 },
    { name: '杭州', lon: 120.16, lat: 30.27 },
    { name: '广州', lon: 113.26, lat: 23.13 },
    { name: '昆明', lon: 102.83, lat: 24.88 },
    { name: '拉萨', lon: 91.11, lat: 29.65 },
    { name: '平壤', lon: 125.75, lat: 39.03 }
  ]
}

const cities = computed(() =>
  (CITIES[props.dynastyId] || []).map((c) => ({
    ...c,
    x: projX(c.lon),
    y: projY(c.lat)
  }))
)

const legend = [
  { label: '直接统治', fill: FILL[2], stroke: '#B08A3E' },
  { label: '羁縻 / 都护府', fill: FILL[1], stroke: '#C9AC74' },
  { label: '未及', fill: FILL[0], stroke: '#D3D0C8' }
]
</script>

<template>
  <div>
    <div class="bg-white/40 rounded-md border border-[#D8B26A]/20 p-4">
      <svg viewBox="0 0 560 470" class="block w-full h-auto max-w-[600px] mx-auto">
        <rect x="0" y="0" width="560" height="470" fill="#F7F4EE" />

        <g v-if="shapes.length">
          <path
            v-for="s in shapes"
            :key="s.name"
            :d="s.d"
            :fill="FILL[s.level]"
            :stroke="STROKE[s.level]"
            stroke-width="0.8"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          >
            <title>{{ s.name }}</title>
          </path>
        </g>

        <g v-for="c in cities" :key="c.name">
          <circle
            :cx="c.x"
            :cy="c.y"
            :r="c.capital ? 4.5 : 3"
            :fill="c.capital ? '#C34739' : '#355C5A'"
            :stroke="c.capital ? '#C34739' : '#4A6F7A'"
            stroke-width="1.2"
            opacity="0.9"
          />
          <circle v-if="c.capital" :cx="c.x" :cy="c.y" r="9" fill="#C34739" opacity="0.15" />
          <text
            :x="c.x"
            :y="c.y + (c.capital ? 15 : 12)"
            text-anchor="middle"
            :font-size="c.capital ? 11 : 9"
            :fill="c.capital ? '#C34739' : '#4A4A3A'"
            :font-weight="c.capital ? 'bold' : 'normal'"
            font-family="serif"
          >{{ c.name }}</text>
        </g>

        <text
          v-if="loadFailed"
          x="280"
          y="235"
          text-anchor="middle"
          font-size="12"
          fill="#C34739"
        >地图数据加载失败</text>

        <g transform="translate(16, 436)">
          <g v-for="(l, i) in legend" :key="l.label" :transform="`translate(${i * 116}, 0)`">
            <rect
              x="0"
              y="0"
              width="13"
              height="9"
              :fill="l.fill"
              :stroke="l.stroke"
              stroke-width="1"
              rx="1"
            />
            <text x="17" y="8" font-size="8" fill="#4A4A3A" opacity="0.75">{{ l.label }}</text>
          </g>
        </g>
      </svg>

      <div class="text-center mt-2">
        <p class="text-xs text-[#4A4A3A]/50">{{ dynastyName }}疆域势力范围 · 现代省界底图 · 不代表精确边界</p>
      </div>
    </div>
  </div>
</template>
