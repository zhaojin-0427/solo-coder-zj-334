<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNightCarePlanStore, useNightCareSessionStore, useFollowUpStore } from '@/stores'
import {
  Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Users, Eye,
  ChevronDown, ChevronUp, MessageSquare, RefreshCw, ListChecks,
  UserCheck, AlertCircle, Shield, Moon, Lamp, Pill, ShieldCheck, Sunrise
} from 'lucide-vue-next'
import { NIGHT_CARE_FEEDBACK_LABELS, NIGHT_CARE_FEEDBACK_COLORS, NIGHT_CARE_DEFAULT_PLANS } from '@/types'
import type { NightCareHistory, NightExecutingStep, NightCareFeedback } from '@/types'

const planStore = useNightCarePlanStore()
const sessionStore = useNightCareSessionStore()
const followUpStore = useFollowUpStore()

const expandedHistoryId = ref<string | null>(null)
const noteInput = ref('')
const noteForStep = ref<{ historyId: string; stepIndex: number } | null>(null)
const rescheduleForStep = ref<{ historyId: string; stepIndex: number } | null>(null)
const rescheduleTime = ref('')

const ICON_MAP: Record<string, typeof Moon> = {
  'moon': Moon,
  'lamp': Lamp,
  'pill': Pill,
  'shield-check': ShieldCheck,
  'sunrise': Sunrise,
}

function getPlanIcon(iconName: string) {
  return ICON_MAP[iconName] || Moon
}

function getPlanColor(iconName: string) {
  const match = NIGHT_CARE_DEFAULT_PLANS.find(p => p.icon === iconName)
  if (match) {
    const colorMap: Record<string, string> = {
      'bedtime-check': '#7B68EE',
      'midnight-check': '#E8A838',
      'medicine-reminder': '#D94F4F',
      'safety-confirm': '#5C9460',
      'morning-visit': '#E8652B',
    }
    return colorMap[match.id] || '#E8652B'
  }
  return '#E8652B'
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
}

function isStepAbnormal(status: NightCareFeedback) {
  return status && status !== 'confirmed' && status !== null && status !== undefined && (status as any) !== 'pending'
}

const todayHistory = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return sessionStore.history.filter(h => h.startedAt >= today.getTime())
})

const pendingSteps = computed(() => {
  const result: { history: NightCareHistory; step: NightExecutingStep; stepIndex: number }[] = []
  for (const h of sessionStore.history) {
    h.steps.forEach((step, idx) => {
      if (isStepAbnormal(step.status)) {
        result.push({ history: h, step, stepIndex: idx })
      }
    })
  }
  return result
})

function toggleExpand(historyId: string) {
  expandedHistoryId.value = expandedHistoryId.value === historyId ? null : historyId
}

function startNote(historyId: string, stepIndex: number) {
  noteForStep.value = { historyId, stepIndex }
  noteInput.value = ''
}

function submitNote() {
  if (!noteForStep.value || !noteInput.value.trim()) return
  const { historyId, stepIndex } = noteForStep.value
  const history = sessionStore.history.find(h => h.id === historyId)
  if (history) {
    const step = history.steps[stepIndex]
    if (step) {
      followUpStore.addItem({
        title: `夜间照护补充备注：${step.itemName}`,
        description: `计划"${history.planName}"第${stepIndex + 1}项"${step.itemName}"补充备注：${noteInput.value}`,
        priority: 'low',
        sourceItemId: step.linkedEmergencyItemId,
        sourceItemName: step.linkedEmergencyItemName,
        contactId: step.linkedContactId,
        contactName: step.linkedContactName,
      })
    }
  }
  noteForStep.value = null
  noteInput.value = ''
}

function markHandled(historyId: string, stepIndex: number) {
  const history = sessionStore.history.find(h => h.id === historyId)
  if (history) {
    const step = history.steps[stepIndex]
    if (step) {
      followUpStore.addItem({
        title: `夜间照护异常已处理：${step.itemName}`,
        description: `计划"${history.planName}"第${stepIndex + 1}项"${step.itemName}"（${NIGHT_CARE_FEEDBACK_LABELS[step.status]}）已由家属手动标记为已处理。`,
        priority: step.isKeyPoint ? 'high' : 'medium',
        status: 'done',
        sourceItemId: step.linkedEmergencyItemId,
        sourceItemName: step.linkedEmergencyItemName,
        contactId: step.linkedContactId,
        contactName: step.linkedContactName,
      })
      step.note = (step.note ? step.note + ' | ' : '') + '家属已标记处理'
    }
  }
}

function startReschedule(historyId: string, stepIndex: number) {
  rescheduleForStep.value = { historyId, stepIndex }
  rescheduleTime.value = ''
}

function submitReschedule() {
  if (!rescheduleForStep.value || !rescheduleTime.value.trim()) return
  const { historyId, stepIndex } = rescheduleForStep.value
  const history = sessionStore.history.find(h => h.id === historyId)
  if (history) {
    const step = history.steps[stepIndex]
    if (step) {
      followUpStore.addItem({
        title: `重新提醒：${step.itemName}`,
        description: `计划"${history.planName}"第${stepIndex + 1}项"${step.itemName}"已重新安排提醒时间：${rescheduleTime.value}。`,
        priority: step.isKeyPoint ? 'high' : 'medium',
        sourceItemId: step.linkedEmergencyItemId,
        sourceItemName: step.linkedEmergencyItemName,
        contactId: step.linkedContactId,
        contactName: step.linkedContactName,
      })
      step.note = (step.note ? step.note + ' | ' : '') + `重新安排提醒：${rescheduleTime.value}`
    }
  }
  rescheduleForStep.value = null
  rescheduleTime.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-serif text-2xl font-bold text-warm-900">夜间照护巡查时间线</h2>
        <p class="text-sm text-warm-500 mt-1">查看每晚的巡查记录和异常情况</p>
      </div>
    </div>

    <div class="grid sm:grid-cols-3 gap-4">
      <div class="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-5 border-2 border-emerald-200">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle class="h-6 w-6 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-3xl font-bold text-emerald-700">{{ todayHistory.length }}</p>
            <p class="text-sm text-emerald-600 mt-0.5">今晚巡查次数</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 p-5 border-2 border-red-200">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle class="h-6 w-6 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-3xl font-bold text-red-700">{{ pendingSteps.length }}</p>
            <p class="text-sm text-red-600 mt-0.5">待处理异常</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 border-2 border-orange-200">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <ListChecks class="h-6 w-6 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-3xl font-bold text-orange-700">{{ sessionStore.history.length }}</p>
            <p class="text-sm text-orange-600 mt-0.5">历史巡查记录</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="pendingSteps.length > 0" class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="font-bold text-warm-800 flex items-center gap-2">
        <AlertCircle class="h-5 w-5 text-red-500" />
        未确认项目与处理状态
      </h3>

      <div class="space-y-3">
        <div
          v-for="item in pendingSteps.slice(0, 5)"
          :key="`${item.history.id}-${item.stepIndex}`"
          class="rounded-xl border-2 p-4"
          :class="item.step.status === 'need-family' ? 'border-blue-200 bg-blue-50' : item.step.status === 'remind-later' ? 'border-amber-200 bg-amber-50' : 'border-warm-200 bg-warm-50'"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                :style="{ backgroundColor: NIGHT_CARE_FEEDBACK_COLORS[item.step.status] + '20' }"
              >
                <component
                  :is="item.step.status === 'need-family' ? Users : item.step.status === 'remind-later' ? Clock : item.step.status === 'not-clear' ? Eye : AlertTriangle"
                  class="h-5 w-5"
                  :style="{ color: NIGHT_CARE_FEEDBACK_COLORS[item.step.status] }"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-bold text-warm-900">{{ item.step.itemName }}</h4>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    :style="{ backgroundColor: NIGHT_CARE_FEEDBACK_COLORS[item.step.status] + '15', color: NIGHT_CARE_FEEDBACK_COLORS[item.step.status] }"
                  >
                    {{ NIGHT_CARE_FEEDBACK_LABELS[item.step.status] }}
                  </span>
                  <span v-if="item.step.isKeyPoint" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                    重点项
                  </span>
                </div>
                <p class="text-sm text-warm-500 mt-0.5">
                  {{ item.history.planName }} · {{ formatDate(item.history.startedAt) }} {{ formatTime(item.history.startedAt) }}
                </p>
                <p v-if="item.step.note" class="text-sm text-warm-600 mt-1">
                  <MessageSquare class="inline-block h-3.5 w-3.5 mr-1" />
                  {{ item.step.note }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="startNote(item.history.id, item.stepIndex)"
                class="p-2 rounded-lg hover:bg-warm-100 transition-colors"
                title="补充备注"
              >
                <MessageSquare class="h-4 w-4 text-warm-500" />
              </button>
              <button
                @click="startReschedule(item.history.id, item.stepIndex)"
                class="p-2 rounded-lg hover:bg-warm-100 transition-colors"
                title="重新安排提醒"
              >
                <RefreshCw class="h-4 w-4 text-warm-500" />
              </button>
              <button
                @click="markHandled(item.history.id, item.stepIndex)"
                class="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
                title="标记已处理"
              >
                <UserCheck class="h-4 w-4 text-emerald-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="font-bold text-warm-800 flex items-center gap-2">
        <Calendar class="h-5 w-5 text-[#7B68EE]" />
        巡查时间线
      </h3>

      <div v-if="sessionStore.history.length === 0" class="text-center py-12">
        <Moon class="mx-auto mb-3 h-12 w-12 text-warm-300" />
        <p class="text-warm-400">暂无巡查记录</p>
        <p class="text-sm text-warm-300 mt-1">老人使用"今晚照护"后会在这里显示巡查记录</p>
      </div>

      <div v-else class="relative">
        <div class="absolute left-6 top-2 bottom-2 w-0.5 bg-warm-200" />

        <div class="space-y-6">
          <div
            v-for="history in sessionStore.history.slice(0, 10)"
            :key="history.id"
            class="relative pl-14"
          >
            <div
              class="absolute left-0 top-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              :style="{ backgroundColor: getPlanColor(planStore.getPlanById(history.planId)?.icon || 'moon') }"
            >
              <component
                :is="getPlanIcon(planStore.getPlanById(history.planId)?.icon || 'moon')"
                class="h-6 w-6 text-white"
              />
            </div>

            <div class="rounded-2xl border-2 border-warm-100 p-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-bold text-warm-900">{{ history.planName }}</h4>
                  <span class="text-sm text-warm-400">{{ formatDate(history.startedAt) }}</span>
                  <span class="text-sm text-warm-500">{{ formatTime(history.startedAt) }} - {{ formatTime(history.finishedAt) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    :class="history.abnormalCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'"
                  >
                    <component :is="history.abnormalCount > 0 ? AlertTriangle : Shield" class="h-3.5 w-3.5" />
                    {{ history.abnormalCount > 0 ? `异常 ${history.abnormalCount} 项` : '全部正常' }}
                  </span>
                  <button
                    @click="toggleExpand(history.id)"
                    class="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                  >
                    <component
                      :is="expandedHistoryId === history.id ? ChevronUp : ChevronDown"
                      class="h-4 w-4 text-warm-500"
                    />
                  </button>
                </div>
              </div>

              <p class="text-sm text-warm-600 mt-2">{{ history.summary }}</p>

              <div v-if="expandedHistoryId === history.id" class="mt-4 space-y-2 pt-3 border-t border-warm-100">
                <h5 class="text-sm font-bold text-warm-700 mb-2">老人反馈详情</h5>
                <div
                  v-for="(step, stepIdx) in history.steps"
                  :key="stepIdx"
                  class="flex items-start gap-3 p-3 rounded-xl"
                  :class="isStepAbnormal(step.status) ? 'bg-red-50' : 'bg-warm-50'"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
                    :style="{
                      backgroundColor: (step.status && (step.status as any) !== 'pending') ? NIGHT_CARE_FEEDBACK_COLORS[step.status] + '20' : '#F0E0D0',
                      color: (step.status && (step.status as any) !== 'pending') ? NIGHT_CARE_FEEDBACK_COLORS[step.status] : '#B8A08A',
                    }"
                  >
                    {{ stepIdx + 1 }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-medium text-warm-800">{{ step.itemName }}</span>
                      <span
                        v-if="step.status && (step.status as any) !== 'pending'"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        :style="{ backgroundColor: NIGHT_CARE_FEEDBACK_COLORS[step.status] + '15', color: NIGHT_CARE_FEEDBACK_COLORS[step.status] }"
                      >
                        {{ NIGHT_CARE_FEEDBACK_LABELS[step.status] }}
                      </span>
                      <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warm-100 text-warm-500">
                        待确认
                      </span>
                      <span v-if="step.isKeyPoint" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                        重点
                      </span>
                    </div>
                    <div v-if="step.timestamp > 0" class="text-xs text-warm-400 mt-0.5">
                      {{ formatTime(step.timestamp) }} 反馈
                    </div>
                    <p v-if="step.note" class="text-sm text-warm-600 mt-1">
                      <MessageSquare class="inline-block h-3.5 w-3.5 mr-1" />
                      {{ step.note }}
                    </p>
                  </div>
                  <div v-if="isStepAbnormal(step.status)" class="flex items-center gap-1 shrink-0">
                    <button
                      @click="startNote(history.id, stepIdx)"
                      class="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                      title="补充备注"
                    >
                      <MessageSquare class="h-3.5 w-3.5 text-warm-500" />
                    </button>
                    <button
                      @click="startReschedule(history.id, stepIdx)"
                      class="p-1.5 rounded-lg hover:bg-warm-100 transition-colors"
                      title="重新提醒"
                    >
                      <RefreshCw class="h-3.5 w-3.5 text-warm-500" />
                    </button>
                    <button
                      @click="markHandled(history.id, stepIdx)"
                      class="p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                      title="标记处理"
                    >
                      <UserCheck class="h-3.5 w-3.5 text-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="noteForStep" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="bg-gradient-to-r from-[#E8652B] to-orange-500 p-5 text-white">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <MessageSquare class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-xl font-bold">补充备注</h3>
                <p class="text-orange-100 text-sm">为检查项添加补充说明</p>
              </div>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-bold text-warm-700 mb-2">备注内容</label>
              <textarea
                v-model="noteInput"
                rows="3"
                class="w-full rounded-xl border-2 border-warm-200 focus:border-orange-400 focus:outline-none px-4 py-3 text-base"
                placeholder="请输入备注内容..."
              />
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <button
                @click="noteForStep = null; noteInput = ''"
                class="py-3 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 font-bold transition-colors"
              >
                取消
              </button>
              <button
                @click="submitNote"
                :disabled="!noteInput.trim()"
                class="py-3 rounded-xl bg-[#E8652B] hover:bg-[#d45a24] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="rescheduleForStep" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="bg-gradient-to-r from-[#5B9BD5] to-blue-500 p-5 text-white">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <RefreshCw class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-xl font-bold">重新安排提醒</h3>
                <p class="text-blue-100 text-sm">设置新的提醒时间</p>
              </div>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-sm font-bold text-warm-700 mb-2">提醒时间</label>
              <input
                v-model="rescheduleTime"
                type="text"
                class="w-full rounded-xl border-2 border-warm-200 focus:border-blue-400 focus:outline-none px-4 py-3 text-base"
                placeholder="如：明天早上 8:00"
              />
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2">
              <button
                @click="rescheduleForStep = null; rescheduleTime = ''"
                class="py-3 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 font-bold transition-colors"
              >
                取消
              </button>
              <button
                @click="submitReschedule"
                :disabled="!rescheduleTime.trim()"
                class="py-3 rounded-xl bg-[#5B9BD5] hover:bg-[#4a8bc5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认安排
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
