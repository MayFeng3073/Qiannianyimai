<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoaded = ref(false)

// =======================
// 15 个朝代节点
// =======================
interface DynastyNode {
  id: number
  name: string
  display: string
  start_year: number
  end_year: number
  era: string
  available: boolean
}

const DYNASTY_NODES: DynastyNode[] = [
  { id: 100, name: '上古（传说时代）', display: '上古',     start_year: -3000, end_year: -2070, era: '华夏肇始，文明初光', available: true  },
  { id: 201, name: '夏商西周',         display: '夏商西周', start_year: -2070, end_year: -771,  era: '三代之治，礼乐奠基', available: true  },
  { id: 202, name: '春秋',             display: '春秋',     start_year: -770,  end_year: -476,  era: '五霸迭兴，礼崩乐坏', available: false },
  { id: 203, name: '战国',             display: '战国',     start_year: -475,  end_year: -221,  era: '七雄争霸，百家争鸣', available: false },
  { id: 106, name: '秦',               display: '秦',       start_year: -221,  end_year: -206,  era: '六合为一，百代秦制', available: false },
  { id: 107, name: '汉',               display: '汉',       start_year: -202,  end_year:  220,  era: '大汉雄风，丝路西通', available: true  },
  { id: 109, name: '三国',             display: '三国',     start_year:  220,  end_year:  280,  era: '群雄逐鹿，三足鼎立', available: false },
  { id: 110, name: '晋南北朝',         display: '晋南北朝', start_year:  265,  end_year:  589,  era: '衣冠南渡，民族融合', available: false },
  { id: 111, name: '隋',               display: '隋',       start_year:  581,  end_year:  618,  era: '南北重归，运河千里', available: false },
  { id: 112, name: '唐',               display: '唐',       start_year:  618,  end_year:  907,  era: '盛世风华，万国来朝', available: true  },
  { id: 113, name: '宋（北宋+南宋）',  display: '宋',       start_year:  960,  end_year: 1279,  era: '文化造极，雅韵千载', available: true  },
  { id: 114, name: '元',               display: '元',       start_year: 1271,  end_year: 1368,  era: '铁骑纵横，版图空前', available: false },
  { id: 115, name: '明',               display: '明',       start_year: 1368,  end_year: 1644,  era: '远迈汉唐，治隆唐宋', available: true  },
  { id: 116, name: '清',               display: '清',       start_year: 1644,  end_year: 1912,  era: '康乾盛世，百年转折', available: true  },
  { id: 117, name: '民国（1912–1949）',display: '民国',    start_year: 1912,  end_year: 1949,  era: '风云激荡，共和肇建', available: false },
]

// 分两行
const ROW1 = DYNASTY_NODES.slice(0, 8)
const ROW2 = DYNASTY_NODES.slice(8, 15)

const formatYearShort = (y: number) => y < 0 ? `前${Math.abs(y)}` : `${y}`
const hoveredId = ref<number | null>(null)

// ================================================================
// 两种独立波动：印章波 vs 背景水墨线波（不同频率不同相位 → 竖线有长有短）
// ================================================================
// ①印章波动：中频（8个点约走1个周期）+ 中幅（±14~16px）→ 节点视觉错落
const row1NodeOffset = (i: number) => Math.sin(i * 0.82 + 0.3) * 14
const row2NodeOffset = (i: number) => Math.cos(i * 0.90 + 0.6) * 16

// ②背景水墨线波动（圆点贴合这条）：**极低频、长波幅**
// 8/7个点只走约半个周期 → 视觉上是一条平滑的河流/水墨水墨线
// 与印章波错开相位和频率 → 有时你高我低（竖线长）、有时你低我高（竖线短）、有时同向中间
const row1LineOffset = (i: number) => Math.sin(i * 0.28 + 0.9) * 10
const row2LineOffset = (i: number) => Math.cos(i * 0.32 + 0.4) * 11

// 两行整体向下平移量
const ROW1_Y_SHIFT = 20
const ROW2_Y_SHIFT = 10

// 固定点基准 top
const DOT_BASE_TOP_ROW1 = 134 + ROW1_Y_SHIFT + 12
const DOT_BASE_TOP_ROW2 = 134 + ROW2_Y_SHIFT + 12

// 动态计算连接竖线高度
const CONNECTOR_GAP = 3
const row1ConnectorHeight = (i: number) => {
  const nodeBottom = (8 + ROW1_Y_SHIFT + row1NodeOffset(i)) + 78 + 10 + 28 + CONNECTOR_GAP
  const lineTop    = DOT_BASE_TOP_ROW1 + row1LineOffset(i)
  return Math.max(3, lineTop - nodeBottom)
}
const row2ConnectorHeight = (i: number) => {
  const nodeBottom = (8 + ROW2_Y_SHIFT + row2NodeOffset(i)) + 78 + 10 + 28 + CONNECTOR_GAP
  const lineTop    = DOT_BASE_TOP_ROW2 + row2LineOffset(i)
  return Math.max(3, lineTop - nodeBottom)
}

const handleNodeClick = (d: DynastyNode) => {
  if (d.available) router.push(`/dynasty/${d.id}`)
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => { isLoaded.value = true }, 80)
})
</script>

<template>
  <div class="min-h-screen relative overflow-hidden flex flex-col">

    <!-- ========================================================= -->
    <!-- 背景图：铺满全屏（包含导航栏区域） -->
    <!-- ========================================================= -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="
        background-color: #F5EFDF;
        background-image: url('/朝代选择背景图.png');
        background-size: cover;
        background-position: center 52%;
        background-repeat: no-repeat;
        filter: brightness(1.04) saturate(0.85) contrast(0.97) opacity(0.92);
      "
    ></div>

    <!-- ========================================================= -->
    <!-- 顶部导航栏：与详情页结构/位置完全统一；本页单独使用透明背景让背景图覆盖整页 -->
    <!-- ========================================================= -->
    <nav class="sticky top-0 z-50 bg-[#F8F6F2]/10 backdrop-blur-[2px] border-b border-[#D8B26A]/15">
      <div class="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
            <div class="w-8 h-8 rounded-full bg-[#C34739] flex items-center justify-center">
              <span class="font-calligraphy text-white text-lg">千</span>
            </div>
            <span class="font-calligraphy text-xl text-[#2C2C2C]">千年一脉</span>
          </div>
          <div class="h-5 w-px bg-[#D8B26A]/30"></div>
          <div class="text-sm text-[#4A4A3A]/60">
            <span class="hover:text-[#355C5A] cursor-pointer transition-colors" @click="router.push('/')">首页</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="text-[#2C2C2C] font-medium">中国历史</span>
          </div>
        </div>
        <!-- 右侧已移除「返回首页」按钮 -->
      </div>
    </nav>

    <!-- ========================================================= -->
    <!-- 主体内容区 -->
    <!-- ========================================================= -->
    <div class="relative flex-1 flex items-center justify-center py-2 px-1 md:px-2">
      <div
        class="relative z-10 w-full max-w-[1400px] mx-auto"
        :class="isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        style="transition: all 0.7s ease-out;"
      >

        <!-- ============ 标题区 ============ -->
        <div class="text-center mb-4 md:mb-6">
          <div class="flex items-center justify-center gap-3 mb-1.5">
            <span class="inline-block w-10 md:w-14 h-px" style="background: linear-gradient(to right, transparent, #8B5A2B/60);"></span>
            <span class="inline-block text-[#8B5A2B]/60" style="font-size: 10px;">❖</span>
            <span class="inline-block w-10 md:w-14 h-px" style="background: linear-gradient(to left, transparent, #8B5A2B/60);"></span>
          </div>
          <h1 class="font-calligraphy text-[36px] md:text-[48px] lg:text-[56px] text-[#2C2C2C] tracking-[0.12em] mb-1 leading-none">
            中 国 五 千 年 历 史
          </h1>
        </div>

        <!-- ============ 两行朝代节点区 ============ -->
        <div class="relative w-full px-1 sm:px-2 md:px-4 lg:px-6 xl:px-10 py-2 overflow-x-auto" style="scrollbar-width: thin; scrollbar-color: rgba(139,90,43,0.35) transparent;">
          <div class="min-w-max flex flex-col">

          <!-- ================= 第一行：8 个朝代（flex布局 + gap=85px 边缘净距） ================= -->
          <div class="relative w-full h-[272px] mb-0.5 md:mb-1 flex justify-center items-start" style="gap: 85px;">
            <div
              v-for="(d, i) in ROW1"
              :key="'wrap1-'+d.id"
              class="relative h-full w-[78px] flex-shrink-0"
            >
              <!-- 背景时间线贴合小点 + 竖线：圆点使用独立的背景线波动，竖线高度随差值动态变化（有长有短） -->
              <div
                class="absolute left-1/2 -translate-x-1/2"
                :style="{
                  top: `${DOT_BASE_TOP_ROW1 + row1LineOffset(i)}px`,
                }"
              >
                <div
                  class="w-px mx-auto"
                  :style="{
                    height: `${row1ConnectorHeight(i)}px`,
                    background: 'linear-gradient(to bottom, rgba(139,90,43,0.14), rgba(139,90,43,0.82))',
                  }"
                ></div>
                <div
                  class="w-3 h-3 rounded-full mx-auto -mt-0.5"
                  :style="{
                    background: hoveredId === d.id
                      ? 'radial-gradient(circle, #E05A4B 0%, #C34739 60%, #9B2E22 100%)'
                      : 'radial-gradient(circle, #A97342 0%, #8B5A2B 70%, #5C3A1E 100%)',
                    boxShadow: hoveredId === d.id
                      ? '0 0 0 3px rgba(195,71,57,0.22), 0 0 9px rgba(195,71,57,0.55)'
                      : '0 0 0 2px rgba(255,252,245,0.88), 0 1px 3px rgba(92,58,30,0.38)',
                    transition: 'all 0.25s ease',
                  }"
                ></div>
              </div>

              <!-- 节点印章 + 年份 + 悬停卡片（top 加 sin 波偏移，上下起伏） -->
              <div
                class="absolute left-1/2 -translate-x-1/2 cursor-pointer"
                :style="{
                  top: `${8 + ROW1_Y_SHIFT + row1NodeOffset(i)}px`,
                }"
                @mouseenter="hoveredId = d.id"
                @mouseleave="hoveredId = null"
                @click="handleNodeClick(d)"
              >
                <!-- 圆形印章（78px） -->
                <div
                  class="relative mx-auto flex items-center justify-center select-none"
                  :style="{
                    width: '78px',
                    height: '78px',
                    borderRadius: '50%',
                    background: hoveredId === d.id
                      ? 'radial-gradient(circle at 32% 28%, #E86253 0%, #C34739 48%, #9B2E22 100%)'
                      : (d.available
                          ? 'radial-gradient(circle at 32% 28%, #FFFBF2 0%, #F8F0DE 50%, #EEDFC5 100%)'
                          : 'radial-gradient(circle at 32% 28%, #F5EFDF 0%, #EBE3CC 52%, #DDD2B5 100%)'),
                    border: hoveredId === d.id
                      ? '2.5px solid #8B2519'
                      : (d.available
                          ? '2px solid #8B5A2B'
                          : '1.5px dashed #A08878'),
                    boxShadow: hoveredId === d.id
                      ? '0 8px 26px rgba(195,71,57,0.45), 0 0 0 4px rgba(195,71,57,0.11), inset 0 1px 2px rgba(255,255,255,0.35)'
                      : '0 3px 12px rgba(139,90,43,0.15), inset 0 1px 1.5px rgba(255,255,255,0.75)',
                    transform: hoveredId === d.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }"
                >
                  <!-- 内圈装饰线 -->
                  <div
                    class="absolute rounded-full pointer-events-none"
                    :style="{
                      inset: '5px',
                      border: hoveredId === d.id
                        ? '0.8px solid rgba(255,255,255,0.45)'
                        : (d.available
                            ? '0.8px solid rgba(139,90,43,0.45)'
                            : '0.6px dashed rgba(160,136,120,0.55)'),
                    }"
                  ></div>
                  <!-- 朝代文字 -->
                  <span
                    class="font-calligraphy font-bold leading-none text-center"
                    :style="{
                      fontSize: d.display.length >= 4 ? '15px' : (d.display.length >= 3 ? '18px' : '27px'),
                      letterSpacing: d.display.length >= 3 ? '0.3px' : '0.8px',
                      color: hoveredId === d.id
                        ? '#FFFBF2'
                        : (d.available ? '#5C3A1E' : '#9A8675'),
                      textShadow: hoveredId === d.id ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    }"
                  >{{ d.display }}</span>
                </div>

                <!-- 下方起止年份 -->
                <div class="mt-2.5 text-center leading-tight whitespace-nowrap">
                  <div
                    class="font-mono"
                    :style="{
                      fontSize: '12px',
                      color: hoveredId === d.id ? '#C34739' : '#6B5236',
                      letterSpacing: '0.2px',
                      transition: 'color 0.22s ease',
                    }"
                  >{{ formatYearShort(d.start_year) }}年</div>
                  <div
                    class="font-mono"
                    :style="{
                      fontSize: '12px',
                      color: hoveredId === d.id ? '#C34739' : '#6B5236',
                      letterSpacing: '0.2px',
                      transition: 'color 0.22s ease',
                    }"
                  >—{{ formatYearShort(d.end_year) }}年</div>
                </div>

                <!-- 悬停弹出卡片（距离缩短到 34px） -->
                <div
                  v-if="hoveredId === d.id"
                  class="absolute left-1/2 -translate-x-1/2 z-40"
                  style="top: calc(100% + 34px);"
                >
                  <div
                    class="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45"
                    style="
                      background: #FFFCF5;
                      border-left: 1px solid rgba(216,178,106,0.55);
                      border-top: 1px solid rgba(216,178,106,0.55);
                    "
                  ></div>
                  <div
                    class="relative rounded-md pt-2.5 pb-3 px-4 text-center min-w-[150px]"
                    style="
                      background: linear-gradient(180deg, #FFFCF5 0%, #FAF5E8 100%);
                      border: 1px solid rgba(216,178,106,0.55);
                      boxShadow: 0 10px 30px rgba(92,58,30,0.18), 0 2px 6px rgba(92,58,30,0.08);
                    "
                  >
                    <div
                      class="font-mono text-[12.5px] font-medium tracking-wide mb-1.5"
                      style="color: #C34739;"
                    >
                      {{ formatYearShort(d.start_year) }} — {{ formatYearShort(d.end_year) }}
                    </div>
                    <div
                      class="h-px w-10 mx-auto mb-1.5"
                      style="background: linear-gradient(to right, transparent, rgba(216,178,106,0.7), transparent);"
                    ></div>
                    <div
                      class="font-calligraphy text-[14.5px] tracking-[0.1em] leading-snug"
                      style="color: #2C2C2C;"
                    >
                      {{ d.era }}
                    </div>
                    <div class="mt-2">
                      <span
                        class="inline-block text-[10.5px] px-2.5 py-0.5 rounded-full"
                        :class="d.available
                          ? 'bg-[#C34739]/10 text-[#C34739] border border-[#C34739]/20'
                          : 'bg-[#4A4A3A]/6 text-[#4A4A3A]/55 border border-[#4A4A3A]/15'"
                      >
                        {{ d.available ? '点击进入 →' : 'Coming Soon' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= 第二行：7 个朝代（flex布局 + gap=110px 边缘净距） ================= -->
          <div class="relative w-full h-[272px] mt-0.5 md:mt-1 flex justify-center items-start" style="gap: 110px;">
            <div
              v-for="(d, i) in ROW2"
              :key="'wrap2-'+d.id"
              class="relative h-full w-[78px] flex-shrink-0"
            >
              <!-- 背景时间线贴合小点 + 竖线：圆点使用独立的背景线波动，竖线高度随差值动态变化（有长有短） -->
              <!-- 唐宋元（i=1,2,3）单独上移圆点及其引导线 15px -->
              <div
                class="absolute left-1/2 -translate-x-1/2"
                :style="{
                  top: `${DOT_BASE_TOP_ROW2 + row2LineOffset(i) - ([1, 2, 3].includes(i) ? 15 : 0)}px`,
                }"
              >
                <div
                  class="w-px mx-auto"
                  :style="{
                    height: `${row2ConnectorHeight(i)}px`,
                    background: 'linear-gradient(to bottom, rgba(139,90,43,0.14), rgba(139,90,43,0.82))',
                  }"
                ></div>
                <div
                  class="w-3 h-3 rounded-full mx-auto -mt-0.5"
                  :style="{
                    background: hoveredId === d.id
                      ? 'radial-gradient(circle, #E05A4B 0%, #C34739 60%, #9B2E22 100%)'
                      : 'radial-gradient(circle, #A97342 0%, #8B5A2B 70%, #5C3A1E 100%)',
                    boxShadow: hoveredId === d.id
                      ? '0 0 0 3px rgba(195,71,57,0.22), 0 0 9px rgba(195,71,57,0.55)'
                      : '0 0 0 2px rgba(255,252,245,0.88), 0 1px 3px rgba(92,58,30,0.38)',
                    transition: 'all 0.25s ease',
                  }"
                ></div>
              </div>

              <!-- 节点印章 + 年份 + 悬停卡片（top 加 cos 波偏移，上下起伏，与行1错相位） -->
              <div
                class="absolute left-1/2 -translate-x-1/2 cursor-pointer"
                :style="{
                  top: `${8 + ROW2_Y_SHIFT + row2NodeOffset(i)}px`,
                }"
                @mouseenter="hoveredId = d.id"
                @mouseleave="hoveredId = null"
                @click="handleNodeClick(d)"
              >
                <div
                  class="relative mx-auto flex items-center justify-center select-none"
                  :style="{
                    width: '78px',
                    height: '78px',
                    borderRadius: '50%',
                    background: hoveredId === d.id
                      ? 'radial-gradient(circle at 32% 28%, #E86253 0%, #C34739 48%, #9B2E22 100%)'
                      : (d.available
                          ? 'radial-gradient(circle at 32% 28%, #FFFBF2 0%, #F8F0DE 50%, #EEDFC5 100%)'
                          : 'radial-gradient(circle at 32% 28%, #F5EFDF 0%, #EBE3CC 52%, #DDD2B5 100%)'),
                    border: hoveredId === d.id
                      ? '2.5px solid #8B2519'
                      : (d.available
                          ? '2px solid #8B5A2B'
                          : '1.5px dashed #A08878'),
                    boxShadow: hoveredId === d.id
                      ? '0 8px 26px rgba(195,71,57,0.45), 0 0 0 4px rgba(195,71,57,0.11), inset 0 1px 2px rgba(255,255,255,0.35)'
                      : '0 3px 12px rgba(139,90,43,0.15), inset 0 1px 1.5px rgba(255,255,255,0.75)',
                    transform: hoveredId === d.id ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }"
                >
                  <div
                    class="absolute rounded-full pointer-events-none"
                    :style="{
                      inset: '5px',
                      border: hoveredId === d.id
                        ? '0.8px solid rgba(255,255,255,0.45)'
                        : (d.available
                            ? '0.8px solid rgba(139,90,43,0.45)'
                            : '0.6px dashed rgba(160,136,120,0.55)'),
                    }"
                  ></div>
                  <span
                    class="font-calligraphy font-bold leading-none text-center"
                    :style="{
                      fontSize: d.display.length >= 4 ? '15px' : (d.display.length >= 3 ? '18px' : '27px'),
                      letterSpacing: d.display.length >= 3 ? '0.3px' : '0.8px',
                      color: hoveredId === d.id
                        ? '#FFFBF2'
                        : (d.available ? '#5C3A1E' : '#9A8675'),
                      textShadow: hoveredId === d.id ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                    }"
                  >{{ d.display }}</span>
                </div>

                <!-- 下方起止年份 -->
                <div class="mt-2.5 text-center leading-tight whitespace-nowrap">
                  <div
                    class="font-mono"
                    :style="{
                      fontSize: '12px',
                      color: hoveredId === d.id ? '#C34739' : '#6B5236',
                      letterSpacing: '0.2px',
                      transition: 'color 0.22s ease',
                    }"
                  >{{ formatYearShort(d.start_year) }}年</div>
                  <div
                    class="font-mono"
                    :style="{
                      fontSize: '12px',
                      color: hoveredId === d.id ? '#C34739' : '#6B5236',
                      letterSpacing: '0.2px',
                      transition: 'color 0.22s ease',
                    }"
                  >—{{ formatYearShort(d.end_year) }}年</div>
                </div>

                <!-- 悬停弹出卡片（距离缩短） -->
                <div
                  v-if="hoveredId === d.id"
                  class="absolute left-1/2 -translate-x-1/2 z-40"
                  style="top: calc(100% + 34px);"
                >
                  <div
                    class="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45"
                    style="
                      background: #FFFCF5;
                      border-left: 1px solid rgba(216,178,106,0.55);
                      border-top: 1px solid rgba(216,178,106,0.55);
                    "
                  ></div>
                  <div
                    class="relative rounded-md pt-2.5 pb-3 px-4 text-center min-w-[150px]"
                    style="
                      background: linear-gradient(180deg, #FFFCF5 0%, #FAF5E8 100%);
                      border: 1px solid rgba(216,178,106,0.55);
                      boxShadow: 0 10px 30px rgba(92,58,30,0.18), 0 2px 6px rgba(92,58,30,0.08);
                    "
                  >
                    <div
                      class="font-mono text-[12.5px] font-medium tracking-wide mb-1.5"
                      style="color: #C34739;"
                    >
                      {{ formatYearShort(d.start_year) }} — {{ formatYearShort(d.end_year) }}
                    </div>
                    <div
                      class="h-px w-10 mx-auto mb-1.5"
                      style="background: linear-gradient(to right, transparent, rgba(216,178,106,0.7), transparent);"
                    ></div>
                    <div
                      class="font-calligraphy text-[14.5px] tracking-[0.1em] leading-snug"
                      style="color: #2C2C2C;"
                    >
                      {{ d.era }}
                    </div>
                    <div class="mt-2">
                      <span
                        class="inline-block text-[10.5px] px-2.5 py-0.5 rounded-full"
                        :class="d.available
                          ? 'bg-[#C34739]/10 text-[#C34739] border border-[#C34739]/20'
                          : 'bg-[#4A4A3A]/6 text-[#4A4A3A]/55 border border-[#4A4A3A]/15'"
                      >
                        {{ d.available ? '点击进入 →' : 'Coming Soon' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div><!-- /min-w-max flex-col 两行节点包装器 -->

          <!-- ============ 底部提示 ============ -->
          <div class="text-center mt-4 md:mt-6 pb-1">
            <div
              class="inline-flex items-center gap-2.5"
              :class="isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'"
              :style="{ transition: 'all 0.7s ease 0.22s' }"
            >
              <span
                class="w-6 h-px"
                style="background: linear-gradient(to right, transparent, #8B5A2B/55);"
              ></span>
              <svg style="color: #8B5A2B/70; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">
                <rect x="8.5" y="2.5" width="7" height="11" rx="3.5"/>
                <line x1="12" y1="6" x2="12" y2="8"/>
                <path d="M5 14.5 C8 18, 16 18, 19 14.5" stroke-linecap="round"/>
              </svg>
              <span
                class="font-calligraphy tracking-[0.2em]"
                style="font-size: 13.5px; color: #6B5236;"
              >鼠 标 悬 停 查 看 朝 代 信 息</span>
              <span
                class="w-6 h-px"
                style="background: linear-gradient(to left, transparent, #8B5A2B/55);"
              ></span>
            </div>
            <div
              class="mt-1 tracking-[0.3em]"
              style="font-size: 10px; color: #8B7A5F; opacity: 0.55;"
            >
              千年一脉 · 中国历史时间卷轴 · 共 {{ DYNASTY_NODES.length }} 个时代节点
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
