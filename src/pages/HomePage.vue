<script setup lang="ts">
import ContactForm from '@/components/ContactForm.vue'
import GroupSortPanel from '@/components/GroupSortPanel.vue'
import CardLayout from '@/components/CardLayout.vue'
import PrintPreview from '@/components/PrintPreview.vue'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import DrillDrill from '@/components/DrillDrill.vue'
import PackageList from '@/components/PackageList.vue'
import PackageEditor from '@/components/PackageEditor.vue'
import PackageViewer from '@/components/PackageViewer.vue'
import FollowUpPanel from '@/components/FollowUpPanel.vue'
import FamilyShare from '@/components/FamilyShare.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import EmergencyItemList from '@/components/EmergencyItemList.vue'
import EmergencyItemDetail from '@/components/EmergencyItemDetail.vue'
import EmergencyItemEditor from '@/components/EmergencyItemEditor.vue'
import ElderlyFindMode from '@/components/ElderlyFindMode.vue'
import LeavingChecklistList from '@/components/LeavingChecklistList.vue'
import LeavingChecklistEditor from '@/components/LeavingChecklistEditor.vue'
import ElderlyLeavingMode from '@/components/ElderlyLeavingMode.vue'
import ReturnConfirm from '@/components/ReturnConfirm.vue'
import NightCarePlanList from '@/components/NightCarePlanList.vue'
import NightCarePlanEditor from '@/components/NightCarePlanEditor.vue'
import ElderlyNightCareMode from '@/components/ElderlyNightCareMode.vue'
import NightCareTimeline from '@/components/NightCareTimeline.vue'
import NightCareStats from '@/components/NightCareStats.vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BookOpen, Layers, LayoutGrid, Printer, Zap, PhoneCall,
  BookMarked, ClipboardList, Users, BarChart3, MapPin, Search,
  DoorOpen, ListChecks, Moon, Clock, History
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

type TabKey = 'input' | 'group' | 'layout' | 'print' | 'scenario' | 'drill' | 'packages' | 'emergency' | 'leaving' | 'nightcare' | 'followups' | 'share' | 'stats'

const activeTab = ref<TabKey>((route.query.tab as TabKey) || 'input')

const packageView = ref<'list' | 'edit' | 'view'>('list')
const currentPackageId = ref('')

const emergencyView = ref<'list' | 'detail' | 'edit' | 'elderly'>('list')
const currentEmergencyItemId = ref('')

const leavingView = ref<'list' | 'edit' | 'elderly' | 'return-confirm'>('list')
const currentLeavingChecklistId = ref('')

const nightCareView = ref<'list' | 'edit' | 'elderly' | 'timeline' | 'stats'>('list')
const currentNightCarePlanId = ref('')

const tabs = [
  { key: 'input' as const, label: '联系人录入', icon: BookOpen },
  { key: 'group' as const, label: '分组排序', icon: Layers },
  { key: 'layout' as const, label: '卡片排版', icon: LayoutGrid },
  { key: 'print' as const, label: '打印预览', icon: Printer },
  { key: 'scenario' as const, label: '场景预演', icon: Zap },
  { key: 'drill' as const, label: '应急演练', icon: PhoneCall },
  { key: 'packages' as const, label: '回听资料包', icon: BookMarked },
  { key: 'emergency' as const, label: '物品索引', icon: MapPin },
  { key: 'leaving' as const, label: '离家清单', icon: DoorOpen },
  { key: 'nightcare' as const, label: '夜间照护', icon: Moon },
  { key: 'followups' as const, label: '待跟进事项', icon: ClipboardList },
  { key: 'share' as const, label: '家庭共享', icon: Users },
  { key: 'stats' as const, label: '数据统计', icon: BarChart3 },
]

watch(activeTab, (val) => {
  router.replace({ query: { ...route.query, tab: val } })
  if (val === 'packages') {
    packageView.value = 'list'
  }
  if (val === 'emergency') {
    emergencyView.value = 'list'
  }
  if (val === 'leaving') {
    leavingView.value = 'list'
  }
  if (val === 'nightcare') {
    nightCareView.value = 'list'
  }
})

watch(() => route.query.tab, (val) => {
  if (val && typeof val === 'string') {
    activeTab.value = val as TabKey
  }
})

function handleEditPackage(id: string) {
  currentPackageId.value = id
  packageView.value = 'edit'
}

function handleViewPackage(id: string) {
  currentPackageId.value = id
  packageView.value = 'view'
}

function handleBackPackageList() {
  packageView.value = 'list'
}

function handleViewEmergencyItem(id: string) {
  currentEmergencyItemId.value = id
  emergencyView.value = 'detail'
}

function handleEditEmergencyItem(id: string) {
  currentEmergencyItemId.value = id
  emergencyView.value = 'edit'
}

function handleBackEmergencyList() {
  emergencyView.value = 'list'
}

function handleSavedEmergencyItem(id: string) {
  currentEmergencyItemId.value = id
  emergencyView.value = 'detail'
}

function handleEditLeavingChecklist(id: string) {
  currentLeavingChecklistId.value = id
  leavingView.value = 'edit'
}

function handleBackLeavingList() {
  leavingView.value = 'list'
}

function handleGoElderlyLeavingMode() {
  leavingView.value = 'elderly'
}

function handleGoReturnConfirm() {
  leavingView.value = 'return-confirm'
}

function handleLeavingCompleted() {
  leavingView.value = 'list'
}

function handleFromElderlyBackToElderly() {
  leavingView.value = 'elderly'
}

function handleEditNightCarePlan(id: string) {
  currentNightCarePlanId.value = id
  nightCareView.value = 'edit'
}

function handleBackNightCareList() {
  nightCareView.value = 'list'
}

function handleGoElderlyNightCareMode() {
  nightCareView.value = 'elderly'
}

function handleGoNightCareTimeline() {
  nightCareView.value = 'timeline'
}

function handleGoNightCareStats() {
  nightCareView.value = 'stats'
}

function handleNightCareCompleted() {
  nightCareView.value = 'list'
}
</script>

<template>
  <div class="min-h-screen" style="background: #FFF8F0;">
    <header class="sticky top-0 z-40 border-b" style="background: rgba(255,248,240,0.92); backdrop-filter: blur(12px); border-color: #F0E0D0;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #E8652B;">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-bold" style="font-family: 'Noto Serif SC', serif; color: #3D2C2C;">
                家庭电话本
              </h1>
              <p class="text-xs" style="color: #9C8B7A;">大字应急联系卡生成器</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <nav class="sticky top-16 z-30 border-b no-print" style="background: rgba(255,248,240,0.92); backdrop-filter: blur(12px); border-color: #F0E0D0;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-1 overflow-x-auto py-2 scrollbar-thin">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'text-white shadow-md'
              : 'hover:bg-white/50'"
            :style="activeTab === tab.key ? { background: '#E8652B' } : { color: '#8B7355' }"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div class="lg:grid lg:grid-cols-12 lg:gap-8">
        <div class="lg:col-span-5 space-y-6" v-show="activeTab === 'input' || activeTab === 'group'">
          <div v-show="activeTab === 'input'">
            <ContactForm />
          </div>
          <div v-show="activeTab === 'group'">
            <GroupSortPanel />
          </div>
        </div>

        <div class="lg:col-span-7 space-y-6" v-show="activeTab === 'input' || activeTab === 'group'">
          <CardLayout />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'layout'">
          <CardLayout />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'print'">
          <PrintPreview />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'scenario'">
          <ScenarioPreview />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'drill'">
          <DrillDrill />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'packages'">
          <PackageList
            v-if="packageView === 'list'"
            @edit="handleEditPackage"
            @play="handleViewPackage"
          />
          <PackageEditor
            v-else-if="packageView === 'edit'"
            :package-id="currentPackageId"
            @back="handleBackPackageList"
            @play="handleViewPackage"
          />
          <PackageViewer
            v-else-if="packageView === 'view'"
            :package-id="currentPackageId"
            @back="handleBackPackageList"
            @edit="handleEditPackage"
          />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'emergency'">
          <div class="flex items-center gap-2 mb-4" v-if="emergencyView !== 'list'">
            <button
              @click="handleBackEmergencyList"
              class="flex items-center gap-1 text-sm text-warm-500 hover:text-[#E8652B] transition-colors"
            >
              ← 返回列表
            </button>
            <span class="text-warm-300">|</span>
            <button
              @click="emergencyView = 'elderly'"
              class="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              :style="emergencyView === 'elderly'
                ? { backgroundColor: '#E8652B', color: 'white' }
                : { color: '#E8652B', backgroundColor: '#FFF8F0' }"
            >
              <Search class="h-4 w-4" />
              我要找东西
            </button>
          </div>
          <div v-if="emergencyView === 'list'" class="space-y-4">
            <div class="flex items-center gap-2">
              <button
                @click="emergencyView = 'elderly'"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
                style="background: #E8652B;"
              >
                <Search class="h-5 w-5" />
                我要找东西
              </button>
              <span class="text-sm text-warm-400">老人大字版快速查找模式</span>
            </div>
            <EmergencyItemList
              @view="handleViewEmergencyItem"
              @edit="handleEditEmergencyItem"
            />
          </div>
          <EmergencyItemDetail
            v-else-if="emergencyView === 'detail'"
            :item-id="currentEmergencyItemId"
            @back="handleBackEmergencyList"
            @edit="handleEditEmergencyItem"
          />
          <EmergencyItemEditor
            v-else-if="emergencyView === 'edit'"
            :item-id="currentEmergencyItemId"
            @back="handleBackEmergencyList"
            @saved="handleSavedEmergencyItem"
          />
          <ElderlyFindMode
            v-else-if="emergencyView === 'elderly'"
          />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'leaving'">
          <div class="flex items-center gap-2 mb-4" v-if="leavingView !== 'list'">
            <button
              @click="handleBackLeavingList"
              class="flex items-center gap-1 text-sm text-warm-500 hover:text-[#E8652B] transition-colors"
            >
              ← 返回列表
            </button>
            <span class="text-warm-300">|</span>
            <button
              @click="handleGoElderlyLeavingMode"
              class="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              :style="leavingView === 'elderly'
                ? { backgroundColor: '#E8652B', color: 'white' }
                : { color: '#E8652B', backgroundColor: '#FFF8F0' }"
            >
              <DoorOpen class="h-4 w-4" />
              出门模式
            </button>
            <span class="text-warm-300">|</span>
            <button
              @click="handleGoReturnConfirm"
              class="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              :style="leavingView === 'return-confirm'
                ? { backgroundColor: '#E8652B', color: 'white' }
                : { color: '#E8652B', backgroundColor: '#FFF8F0' }"
            >
              <ListChecks class="h-4 w-4" />
              回家确认
            </button>
          </div>
          <div v-if="leavingView === 'list'" class="space-y-4">
            <div class="flex items-center gap-2">
              <button
                @click="handleGoElderlyLeavingMode"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
                style="background: #E8652B;"
              >
                <DoorOpen class="h-5 w-5" />
                我要出门
              </button>
              <button
                @click="handleGoReturnConfirm"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
                style="background: #4A8C5C;"
              >
                <ListChecks class="h-5 w-5" />
                我回家了
              </button>
              <span class="text-sm text-warm-400">老人大字版离家检查清单</span>
            </div>
            <LeavingChecklistList
              @edit="handleEditLeavingChecklist"
            />
          </div>
          <LeavingChecklistEditor
            v-else-if="leavingView === 'edit'"
            :checklist-id="currentLeavingChecklistId"
            @back="handleBackLeavingList"
            @saved="handleBackLeavingList"
          />
          <ElderlyLeavingMode
            v-else-if="leavingView === 'elderly'"
            @completed="handleLeavingCompleted"
            @back="handleBackLeavingList"
            @go-return-confirm="handleGoReturnConfirm"
          />
          <ReturnConfirm
            v-else-if="leavingView === 'return-confirm'"
            @completed="handleLeavingCompleted"
            @back="handleBackLeavingList"
            @go-elderly="handleFromElderlyBackToElderly"
          />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'nightcare'">
          <div class="flex items-center gap-2 mb-4" v-if="nightCareView !== 'list'">
            <button
              @click="handleBackNightCareList"
              class="flex items-center gap-1 text-sm text-warm-500 hover:text-[#E8652B] transition-colors"
            >
              ← 返回列表
            </button>
            <span class="text-warm-300">|</span>
            <button
              @click="handleGoElderlyNightCareMode"
              class="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              :style="nightCareView === 'elderly'
                ? { backgroundColor: '#7B68EE', color: 'white' }
                : { color: '#7B68EE', backgroundColor: '#FFF8F0' }"
            >
              <Moon class="h-4 w-4" />
              今晚照护
            </button>
            <span class="text-warm-300">|</span>
            <button
              @click="handleGoNightCareTimeline"
              class="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              :style="nightCareView === 'timeline'
                ? { backgroundColor: '#5B9BD5', color: 'white' }
                : { color: '#5B9BD5', backgroundColor: '#FFF8F0' }"
            >
              <History class="h-4 w-4" />
              巡查时间线
            </button>
            <span class="text-warm-300">|</span>
            <button
              @click="handleGoNightCareStats"
              class="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              :style="nightCareView === 'stats'
                ? { backgroundColor: '#E8652B', color: 'white' }
                : { color: '#E8652B', backgroundColor: '#FFF8F0' }"
            >
              <BarChart3 class="h-4 w-4" />
              数据统计
            </button>
          </div>
          <div v-if="nightCareView === 'list'" class="space-y-4">
            <div class="flex items-center gap-2 flex-wrap">
              <button
                @click="handleGoElderlyNightCareMode"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#6a5acd]"
                style="background: #7B68EE;"
              >
                <Moon class="h-5 w-5" />
                今晚照护
              </button>
              <button
                @click="handleGoNightCareTimeline"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#4a8bc5]"
                style="background: #5B9BD5;"
              >
                <History class="h-5 w-5" />
                巡查记录
              </button>
              <button
                @click="handleGoNightCareStats"
                class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
                style="background: #E8652B;"
              >
                <BarChart3 class="h-5 w-5" />
                数据统计
              </button>
              <span class="text-sm text-warm-400">家属配置夜间照护计划，老人使用大字版确认</span>
            </div>
            <NightCarePlanList
              @edit="handleEditNightCarePlan"
              @elderly="handleGoElderlyNightCareMode"
            />
          </div>
          <NightCarePlanEditor
            v-else-if="nightCareView === 'edit'"
            :plan-id="currentNightCarePlanId"
            @back="handleBackNightCareList"
            @elderly="handleGoElderlyNightCareMode"
          />
          <ElderlyNightCareMode
            v-else-if="nightCareView === 'elderly'"
            @back="handleBackNightCareList"
            @timeline="handleGoNightCareTimeline"
          />
          <NightCareTimeline
            v-else-if="nightCareView === 'timeline'"
          />
          <NightCareStats
            v-else-if="nightCareView === 'stats'"
          />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'followups'">
          <FollowUpPanel />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'share'">
          <FamilyShare />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'stats'">
          <StatsPanel />
        </div>
      </div>
    </main>

    <footer class="border-t py-6 text-center text-sm no-print" style="border-color: #F0E0D0; color: #B8A08A;">
      家庭电话本 · 大字应急联系卡生成器 — 让紧急联系信息一目了然
    </footer>
  </div>
</template>
