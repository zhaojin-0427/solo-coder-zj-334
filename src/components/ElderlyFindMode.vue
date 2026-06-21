<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmergencyStore, useFollowUpStore } from '@/stores'
import type { FindFeedback, ElderlyScenario } from '@/types'
import { FIND_FEEDBACK_LABELS, FIND_FEEDBACK_COLORS, ELDERLY_SCENARIOS, EMERGENCY_ITEM_TYPE_LABELS, EMERGENCY_ITEM_TYPE_COLORS, EMERGENCY_URGENCY_LABELS, EMERGENCY_URGENCY_COLORS } from '@/types'
import { HeartPulse, ZapOff, DoorOpen, Wrench, Search, MapPin, CheckCircle2, XCircle, HelpCircle, Shield, ChevronRight, ArrowLeft, Eye } from 'lucide-vue-next'

const emergencyStore = useEmergencyStore()
const followUpStore = useFollowUpStore()

const selectedScenario = ref<ElderlyScenario | null>(null)
const showAll = ref(false)
const toastMessage = ref('')
const toastTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const SCENARIO_ICONS: Record<string, typeof HeartPulse> = {
  'heart-pulse': HeartPulse,
  'zap-off': ZapOff,
  'door-open': DoorOpen,
  'wrench': Wrench,
}

const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

const filteredItems = computed(() => {
  if (showAll.value) {
    return [...emergencyStore.items].sort((a, b) => {
      if (URGENCY_ORDER[a.urgency] !== URGENCY_ORDER[b.urgency]) {
        return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
      }
      return 0
    })
  }

  if (!selectedScenario.value) return []

  const scenario = selectedScenario.value
  const result = emergencyStore.items.filter(item => {
    if (scenario.itemTypes.includes(item.type)) return true
    const nameAndHint = (item.name + item.findHint).toLowerCase()
    return scenario.itemKeywords.some(kw => nameAndHint.includes(kw.toLowerCase()))
  })

  result.sort((a, b) => {
    const aMatchType = scenario.itemTypes.includes(a.type) ? 0 : 1
    const bMatchType = scenario.itemTypes.includes(b.type) ? 0 : 1
    if (URGENCY_ORDER[a.urgency] !== URGENCY_ORDER[b.urgency]) {
      return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
    }
    return aMatchType - bMatchType
  })

  return result
})

function selectScenario(scenario: ElderlyScenario) {
  selectedScenario.value = scenario
  showAll.value = false
}

function viewAllItems() {
  showAll.value = true
  selectedScenario.value = null
}

function goBack() {
  selectedScenario.value = null
  showAll.value = false
}

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer.value) clearTimeout(toastTimer.value)
  toastTimer.value = setTimeout(() => {
    toastMessage.value = ''
    toastTimer.value = null
  }, 2000)
}

function handleFeedback(itemId: string, feedback: FindFeedback) {
  emergencyStore.setFindFeedback(itemId, feedback, '')
  showToast(FIND_FEEDBACK_LABELS[feedback] + ' ✓')
}

const FEEDBACK_OPTIONS: { value: FindFeedback; icon: typeof CheckCircle2 }[] = [
  { value: 'found', icon: CheckCircle2 },
  { value: 'not-found', icon: XCircle },
  { value: 'unclear-location', icon: HelpCircle },
  { value: 'need-family-confirm', icon: Shield },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-warm-50 to-white p-4 sm:p-6">
    <div v-if="toastMessage" class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-warm-800 px-8 py-4 text-xl font-bold text-white shadow-lg">
      {{ toastMessage }}
    </div>

    <div class="mx-auto max-w-2xl">
      <div v-if="!selectedScenario && !showAll" class="space-y-6">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-warm-900 sm:text-5xl">我要找东西</h1>
          <p class="mt-3 text-xl text-warm-500">请选择您的情况，帮您快速找到需要的物品</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <button
            v-for="scenario in ELDERLY_SCENARIOS"
            :key="scenario.id"
            @click="selectScenario(scenario)"
            class="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-2 border-transparent hover:border-[#E8652B]/30 min-h-[100px]"
          >
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
              :style="{ backgroundColor: '#E8652B' + '15' }"
            >
              <component
                :is="SCENARIO_ICONS[scenario.icon] || Search"
                class="h-9 w-9"
                :style="{ color: '#E8652B' }"
              />
            </div>
            <div class="text-left">
              <h2 class="text-2xl font-bold text-warm-900">{{ scenario.name }}</h2>
              <p class="mt-1 text-lg text-warm-500">{{ scenario.description }}</p>
            </div>
            <ChevronRight class="ml-auto h-8 w-8 shrink-0 text-warm-300" />
          </button>
        </div>

        <button
          @click="viewAllItems"
          class="flex w-full items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-warm-300 bg-white/50 p-5 text-xl font-semibold text-warm-600 transition-all hover:bg-white hover:border-[#E8652B]/40 hover:text-warm-800 min-h-[64px]"
        >
          <Eye class="h-7 w-7" />
          查看全部物品
        </button>
      </div>

      <div v-else class="space-y-5">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xl font-semibold text-warm-700 shadow-sm transition-all hover:shadow-md min-h-[48px]"
          >
            <ArrowLeft class="h-6 w-6" />
            返回
          </button>
          <h2 class="text-3xl font-bold text-warm-900">
            {{ showAll ? '全部物品' : selectedScenario?.name }}
          </h2>
        </div>

        <p v-if="!showAll && selectedScenario" class="text-xl text-warm-500">
          {{ selectedScenario.description }}
        </p>

        <div v-if="filteredItems.length === 0" class="rounded-3xl bg-white/70 py-16 text-center shadow-sm">
          <Search class="mx-auto mb-4 h-16 w-16 text-warm-300" />
          <p class="text-2xl text-warm-400">没有找到匹配的物品</p>
          <p class="mt-2 text-xl text-warm-300">可以试试"查看全部物品"</p>
          <button
            @click="viewAllItems"
            class="mt-6 rounded-2xl px-8 py-3 text-xl font-semibold text-white shadow-md transition-all hover:shadow-lg min-h-[48px]"
            style="background: #E8652B"
          >
            查看全部物品
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="rounded-3xl bg-white shadow-md overflow-hidden"
          >
            <div class="flex items-stretch">
              <div
                class="w-2 shrink-0"
                :style="{ backgroundColor: EMERGENCY_ITEM_TYPE_COLORS[item.type] }"
              />
              <div class="flex-1 p-5">
                <div class="flex items-center gap-3 flex-wrap">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold text-white"
                    :style="{ backgroundColor: EMERGENCY_ITEM_TYPE_COLORS[item.type] }"
                  >
                    {{ EMERGENCY_ITEM_TYPE_LABELS[item.type] }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold text-white"
                    :style="{ backgroundColor: EMERGENCY_URGENCY_COLORS[item.urgency] }"
                  >
                    {{ EMERGENCY_URGENCY_LABELS[item.urgency] }}
                  </span>
                  <span
                    v-if="item.findFeedback"
                    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-semibold"
                    :style="{
                      backgroundColor: FIND_FEEDBACK_COLORS[item.findFeedback] + '20',
                      color: FIND_FEEDBACK_COLORS[item.findFeedback],
                    }"
                  >
                    {{ FIND_FEEDBACK_LABELS[item.findFeedback] }}
                  </span>
                </div>

                <h3 class="mt-3 text-2xl font-bold text-warm-900">{{ item.name }}</h3>

                <div v-if="item.location" class="mt-2 flex items-start gap-2 text-xl text-warm-700">
                  <MapPin class="mt-0.5 h-6 w-6 shrink-0 text-[#E8652B]" />
                  <span>{{ item.location }}</span>
                </div>

                <div v-if="item.findHint" class="mt-2 rounded-2xl bg-warm-50 p-4">
                  <p class="text-xl text-warm-600">
                    <span class="font-semibold text-warm-800">查找提示：</span>{{ item.findHint }}
                  </p>
                </div>

                <div class="mt-4">
                  <p class="mb-2 text-lg font-semibold text-warm-700">这件东西找到了吗？</p>
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="opt in FEEDBACK_OPTIONS"
                      :key="opt.value"
                      @click="handleFeedback(item.id, opt.value)"
                      class="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-lg font-bold transition-all min-h-[48px] border-2"
                      :class="item.findFeedback === opt.value ? 'scale-[1.02] shadow-md' : 'hover:scale-[1.01]'"
                      :style="{
                        backgroundColor: item.findFeedback === opt.value ? FIND_FEEDBACK_COLORS[opt.value] + '20' : 'transparent',
                        borderColor: item.findFeedback === opt.value ? FIND_FEEDBACK_COLORS[opt.value] : FIND_FEEDBACK_COLORS[opt.value] + '40',
                        color: FIND_FEEDBACK_COLORS[opt.value],
                      }"
                    >
                      <component :is="opt.icon" class="h-6 w-6" />
                      {{ FIND_FEEDBACK_LABELS[opt.value] }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 text-center">
          <p class="text-xl text-warm-400">
            共 {{ filteredItems.length }} 件物品
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
