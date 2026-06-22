<script setup lang="ts">
import { computed } from 'vue'
import { useNightCarePlanStore, useNightCareSessionStore } from '@/stores'
import {
  Plus, Edit2, Trash2, Star, StarOff, ChevronRight, Clock,
  Users, AlertTriangle, Moon, Lamp, Pill, ShieldCheck, Sunrise,
  Play, ListChecks, AlertCircle
} from 'lucide-vue-next'
import { NIGHT_CARE_DEFAULT_PLANS, NIGHT_CARE_PLAN_COLORS } from '@/types'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'elderly'): void
}>()

const planStore = useNightCarePlanStore()
const sessionStore = useNightCareSessionStore()

const PLAN_ICONS: Record<string, typeof Moon> = {
  'moon': Moon,
  'lamp': Lamp,
  'pill': Pill,
  'shield-check': ShieldCheck,
  'sunrise': Sunrise,
}

function getPlanIcon(iconName: string) {
  return PLAN_ICONS[iconName] || Moon
}

function getPlanColor(iconName: string) {
  const match = NIGHT_CARE_DEFAULT_PLANS.find(p => p.icon === iconName)
  if (match) {
    return NIGHT_CARE_PLAN_COLORS[match.id] || '#E8652B'
  }
  return '#E8652B'
}

function handleCreate() {
  const newPlan = planStore.createPlan()
  emit('edit', newPlan.id)
}

function handleDelete(id: string) {
  const plan = planStore.getPlanById(id)
  if (plan && confirm(`确定要删除夜间照护计划"${plan.name}"吗？`)) {
    planStore.deletePlan(id)
  }
}

function handleStartElderly(id: string) {
  const plan = planStore.getPlanById(id)
  if (plan) {
    sessionStore.startSession(plan)
    emit('elderly')
  }
}

function splitKeyRisks(risks: string) {
  if (!risks) return []
  return risks.split(/[、,，]/).filter(Boolean).slice(0, 4)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-serif text-2xl font-bold text-warm-900">夜间照护计划管理</h2>
        <p class="text-sm text-warm-500 mt-1">为夜间不同时段定制照护检查清单</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="handleCreate"
          class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white bg-[#E8652B] hover:bg-[#d45a24] transition-all shadow-sm hover:shadow-md"
        >
          <Plus class="h-4 w-4" />
          <span>新建计划</span>
        </button>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-orange-50 p-5 border-2 border-[#E8652B]/20">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#E8652B] flex items-center justify-center shrink-0">
          <Moon class="h-6 w-6 text-white" />
        </div>
        <div class="flex-1">
          <p class="font-bold text-warm-900">为什么需要夜间照护计划？</p>
          <p class="text-sm text-warm-600 mt-1 leading-relaxed">
            夜间是老人意外高发时段。定制个性化的夜间巡查清单，
            涵盖睡前检查、起夜安全、服药提醒、门窗确认等关键环节，
            让老人安心，让家属放心。
          </p>
        </div>
      </div>
    </div>

    <div v-if="NIGHT_CARE_DEFAULT_PLANS.length > 0" class="space-y-3">
      <div class="flex items-center gap-2">
        <Moon class="h-5 w-5 text-[#7B68EE]" />
        <h3 class="font-bold text-warm-800">全部照护计划</h3>
        <span class="text-sm text-warm-400">({{ planStore.sortedPlans.length }})</span>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div
          v-for="plan in planStore.sortedPlans"
          :key="plan.id"
          class="rounded-2xl bg-white shadow-sm p-5 transition-all hover:shadow-md border-2"
          :class="plan.isHighlighted ? 'border-orange-200' : 'border-transparent'"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-start gap-3 min-w-0">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                :style="{ backgroundColor: getPlanColor(plan.icon) + '20' }"
              >
                <component
                  :is="getPlanIcon(plan.icon)"
                  class="h-5 w-5"
                  :style="{ color: getPlanColor(plan.icon) }"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-bold text-warm-900 truncate">{{ plan.name }}</h4>
                  <Star
                    v-if="plan.isHighlighted"
                    class="h-4 w-4 text-orange-500 fill-orange-500 shrink-0"
                  />
                </div>
                <div class="flex items-center gap-2 text-sm text-warm-500 mt-0.5">
                  <Clock class="h-3.5 w-3.5" />
                  <span>{{ plan.startTime }} - {{ plan.endTime }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="planStore.toggleHighlight(plan.id)"
                class="p-2 rounded-lg transition-colors hover:bg-warm-50"
                :title="plan.isHighlighted ? '取消置顶' : '置顶'"
              >
                <component
                  :is="plan.isHighlighted ? Star : StarOff"
                  class="h-4 w-4"
                  :class="plan.isHighlighted ? 'text-orange-500 fill-orange-500' : 'text-warm-400'"
                />
              </button>
              <button
                @click="emit('edit', plan.id)"
                class="p-2 rounded-lg transition-colors hover:bg-warm-50"
                title="编辑"
              >
                <Edit2 class="h-4 w-4 text-warm-500" />
              </button>
              <button
                @click="handleDelete(plan.id)"
                class="p-2 rounded-lg transition-colors hover:bg-red-50"
                title="删除"
              >
                <Trash2 class="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>

          <div v-if="plan.keyRisks" class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="(risk, idx) in splitKeyRisks(plan.keyRisks)"
              :key="idx"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-600"
            >
              <AlertTriangle class="h-3 w-3" />
              {{ risk }}
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs text-warm-400 mb-4 flex-wrap">
            <div class="flex items-center gap-1">
              <ListChecks class="h-3.5 w-3.5" />
              <span>{{ plan.checkItems.length }} 项检查</span>
            </div>
            <div v-if="plan.linkedContactNames" class="flex items-center gap-1">
              <Users class="h-3.5 w-3.5" />
              <span class="truncate max-w-[120px]">{{ plan.linkedContactNames }}</span>
            </div>
            <div v-if="plan.needsRepeatReminder" class="flex items-center gap-1">
              <AlertCircle class="h-3.5 w-3.5 text-orange-500" />
              <span class="text-orange-500">重复提醒</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="handleStartElderly(plan.id)"
              class="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md"
              :style="{ backgroundColor: getPlanColor(plan.icon) }"
            >
              <Play class="h-4 w-4 fill-white" />
              开始今晚照护
            </button>
            <button
              @click="emit('edit', plan.id)"
              class="flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors border"
              style="border-color: #F0E0D0; color: #8B7355;"
            >
              编辑计划
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="planStore.plans.length === 0"
      class="rounded-2xl bg-white/60 px-6 py-16 text-center"
    >
      <Moon class="mx-auto mb-4 h-14 w-14 text-warm-300" />
      <p class="text-xl text-warm-400">还没有夜间照护计划</p>
      <p class="text-sm text-warm-300 mt-2">点击上方"新建计划"按钮，创建您的第一个夜间照护计划</p>
    </div>
  </div>
</template>
