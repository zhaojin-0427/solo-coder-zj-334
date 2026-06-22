<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useNightCarePlanStore, useNightCareSessionStore } from '@/stores'
import {
  ArrowLeft, Check, Clock, HelpCircle, Users, AlertTriangle, ChevronLeft,
  ChevronRight, RefreshCw, Moon, Lamp, Pill, ShieldCheck, Sunrise, Star,
  CheckCircle2, Circle, Eye, XCircle
} from 'lucide-vue-next'
import { NIGHT_CARE_DEFAULT_PLANS, NIGHT_CARE_FEEDBACK_LABELS, NIGHT_CARE_FEEDBACK_COLORS } from '@/types'
import type { NightCareFeedback } from '@/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'timeline'): void
}>()

const planStore = useNightCarePlanStore()
const sessionStore = useNightCareSessionStore()

const mode = ref<'select' | 'executing'>('select')
const helpNote = ref('')

watch(() => sessionStore.session, (s) => {
  if (s) {
    mode.value = 'executing'
  } else {
    mode.value = 'select'
  }
}, { immediate: true })

const ICON_MAP: Record<string, typeof Moon> = {
  'moon': Moon,
  'lamp': Lamp,
  'pill': Pill,
  'shield-check': ShieldCheck,
  'sunrise': Sunrise,
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

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Moon
}

function handleStartPlan(planId: string) {
  const plan = planStore.getPlanById(planId)
  if (plan) {
    sessionStore.startSession(plan)
    mode.value = 'executing'
  }
}

function handleSetStatus(status: NightCareFeedback, note: string = '') {
  if (!sessionStore.session) return
  sessionStore.setStepStatus(sessionStore.session.currentStepIndex, status, note)
  helpNote.value = ''
}

const currentStep = computed(() => {
  if (!sessionStore.session) return null
  return sessionStore.session.steps[sessionStore.session.currentStepIndex]
})

const progress = computed(() => {
  if (!sessionStore.session) return 0
  const done = sessionStore.session.steps.filter(s => s.status === 'confirmed').length
  return Math.round((done / sessionStore.session.steps.length) * 100)
})

function goPrev() {
  sessionStore.prevStep()
}

function goNext() {
  if (!sessionStore.session) return
  const next = sessionStore.session.currentStepIndex + 1
  if (next < sessionStore.session.steps.length) {
    sessionStore.nextStep()
  } else {
    sessionStore.finishExecution()
    emit('timeline')
  }
}

function handleRecheck() {
  if (confirm('确定要重新检查所有项目吗？已确认的状态将被清除。')) {
    sessionStore.resetAllSteps()
  }
}

function handleFinish() {
  if (!sessionStore.session) return
  const pending = sessionStore.session.steps.filter(s => s.status !== 'confirmed').length
  if (pending > 0) {
    if (!confirm(`还有 ${pending} 项未确认，确定直接完成吗？`)) {
      return
    }
  }
  sessionStore.finishExecution()
  emit('timeline')
}

function handleBackToList() {
  if (sessionStore.session) {
    if (!confirm('确定要退出吗？当前检查进度将保留。')) return
    sessionStore.clearSession()
  }
  mode.value = 'select'
  emit('back')
}

function isStepPending(status: NightCareFeedback) {
  return !status || status === null || status === undefined || (status as any) === 'pending'
}
</script>

<template>
  <div class="min-h-[600px]">
    <div v-if="mode === 'select'" class="space-y-8">
      <div class="text-center py-6">
        <div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-400 to-orange-400 flex items-center justify-center shadow-lg">
          <Moon class="w-12 h-12 text-white" />
        </div>
        <h1 class="text-4xl font-black text-warm-900 mb-3" style="font-family: 'Noto Serif SC', serif;">
          今晚照护
        </h1>
        <p class="text-xl text-warm-500">请选择要确认的照护项目</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <button
          v-for="plan in planStore.sortedPlans"
          :key="plan.id"
          @click="handleStartPlan(plan.id)"
          class="group relative text-left rounded-3xl p-7 shadow-md transition-all hover:shadow-2xl border-4 border-transparent hover:scale-[1.02] active:scale-[0.99]"
          :style="{
            background: `linear-gradient(135deg, ${getPlanColor(plan.icon)}15 0%, white 50%)`,
            borderColor: getPlanColor(plan.icon) + '30',
          }"
        >
          <div
            class="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-md"
            :style="{ backgroundColor: getPlanColor(plan.icon) }"
          >
            <component
              :is="getIcon(plan.icon)"
              class="w-10 h-10 text-white"
            />
          </div>

          <h2 class="text-3xl font-black text-warm-900 mb-2">{{ plan.name }}</h2>
          <p class="text-lg text-warm-500 mb-4 leading-relaxed">{{ plan.keyRisks || '夜间安全确认' }}</p>

          <div class="flex items-center gap-3 mb-4 flex-wrap">
            <div class="flex items-center gap-1.5 text-base font-semibold px-3 py-1.5 rounded-full" :style="{ backgroundColor: getPlanColor(plan.icon) + '20', color: getPlanColor(plan.icon) }">
              <CheckCircle2 class="w-5 h-5" />
              {{ plan.checkItems.length }} 项确认
            </div>
            <div class="flex items-center gap-1.5 text-base text-warm-500">
              <Clock class="w-5 h-5" />
              {{ plan.startTime }} - {{ plan.endTime }}
            </div>
            <Star v-if="plan.isHighlighted" class="w-6 h-6 text-orange-500 fill-orange-500" />
          </div>

          <div
            class="mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl text-2xl font-black text-white transition-all group-hover:brightness-110"
            :style="{ backgroundColor: getPlanColor(plan.icon) }"
          >
            开始确认
            <ChevronRight class="w-7 h-7" />
          </div>
        </button>
      </div>

      <div
        v-if="planStore.plans.length === 0"
        class="rounded-3xl bg-warm-50 px-8 py-16 text-center"
      >
        <Moon class="mx-auto mb-4 h-20 w-20 text-warm-300" />
        <p class="text-2xl text-warm-400 font-bold mb-2">还没有夜间照护计划</p>
        <p class="text-lg text-warm-300">请先让家人帮您创建计划</p>
      </div>

      <div class="text-center">
        <button
          @click="handleBackToList"
          class="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-2xl font-bold text-warm-600 bg-white border-4 border-warm-100 hover:border-warm-200 transition-all"
        >
          <ArrowLeft class="w-7 h-7" />
          返回
        </button>
      </div>
    </div>

    <div v-else-if="mode === 'executing' && sessionStore.session" class="space-y-6">
      <div class="rounded-3xl p-6 shadow-lg" :style="{ background: `linear-gradient(135deg, ${getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon')}20 0%, white 60%)` }">
        <div class="flex items-center gap-4 mb-5">
          <button
            @click="handleBackToList"
            class="p-4 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <ArrowLeft class="w-8 h-8 text-warm-600" />
          </button>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 mb-1 flex-wrap">
              <div
                class="px-5 py-2 rounded-full text-xl font-black"
                :style="{ backgroundColor: getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon'), color: 'white' }"
              >
                {{ sessionStore.session.planName }}
              </div>
              <div class="flex items-center gap-2 text-xl text-warm-500">
                <Clock class="w-6 h-6" />
                {{ planStore.getPlanById(sessionStore.session.planId)?.startTime }} - {{ planStore.getPlanById(sessionStore.session.planId)?.endTime }}
              </div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end justify-between mb-3">
            <span class="text-2xl font-bold text-warm-700">完成进度</span>
            <span class="text-4xl font-black" :style="{ color: getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon') }">
              {{ progress }}%
            </span>
          </div>
          <div class="h-6 rounded-full bg-white shadow-inner overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :style="{
                width: progress + '%',
                background: `linear-gradient(90deg, ${getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon')}, ${getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon')}dd)`,
              } as any"
            />
          </div>
          <div class="flex items-center justify-between mt-3 text-lg">
            <div class="flex items-center gap-2 text-warm-500 font-semibold">
              <CheckCircle2 class="w-6 h-6 text-emerald-500" />
              已完成 {{ sessionStore.session.steps.filter(s => s.status === 'confirmed').length }} 项
            </div>
            <div class="flex items-center gap-2 font-bold" :class="sessionStore.session.steps.filter(s => isStepPending(s.status)).length > 0 ? 'text-red-500' : 'text-emerald-500'">
              <Circle class="w-6 h-6" />
              剩余 {{ sessionStore.session.steps.filter(s => isStepPending(s.status)).length }} 项
            </div>
          </div>
        </div>

        <div v-if="sessionStore.unconfirmedKeyPoints.length > 0" class="rounded-2xl border-4 border-red-300 bg-red-50 p-5 mb-2">
          <div class="flex items-start gap-3">
            <AlertTriangle class="w-8 h-8 text-red-500 shrink-0 animate-pulse" />
            <div class="flex-1">
              <p class="text-2xl font-black text-red-700 mb-2">重要提醒：还有重点项未确认！</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="kp in sessionStore.unconfirmedKeyPoints.slice(0, 5)"
                  :key="kp.itemId"
                  class="px-3 py-1.5 rounded-full bg-white border-2 border-red-200 text-lg font-bold text-red-600"
                >
                  {{ kp.itemName }}
                </span>
                <span
                  v-if="sessionStore.unconfirmedKeyPoints.length > 5"
                  class="px-3 py-1.5 rounded-full text-lg font-bold text-red-400"
                >
                  等{{ sessionStore.unconfirmedKeyPoints.length }}项
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep" class="rounded-3xl bg-white shadow-2xl p-8 border-4 border-warm-100">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md"
              :class="currentStep.isKeyPoint ? 'bg-red-500' : 'bg-[#E8652B]'"
            >
              {{ sessionStore.session.currentStepIndex + 1 }}
            </div>
            <div>
              <p class="text-xl text-warm-400 font-semibold">第 {{ sessionStore.session.currentStepIndex + 1 }} / {{ sessionStore.session.steps.length }} 项</p>
              <div class="flex items-center gap-2">
                <Star
                  v-if="currentStep.isKeyPoint"
                  class="w-7 h-7 text-red-500 fill-red-500"
                />
                <span v-if="currentStep.isKeyPoint" class="text-lg font-black text-red-500">重点项</span>
              </div>
            </div>
          </div>
          <div
            v-if="!isStepPending(currentStep.status)"
            class="px-5 py-3 rounded-2xl text-xl font-black text-white shadow-md"
            :style="{ backgroundColor: NIGHT_CARE_FEEDBACK_COLORS[currentStep.status] }"
          >
            {{ NIGHT_CARE_FEEDBACK_LABELS[currentStep.status] }}
          </div>
        </div>

        <div class="mb-8 p-6 rounded-2xl bg-orange-50">
          <h2 class="text-5xl font-black text-warm-900 mb-4 leading-tight">
            {{ currentStep.itemName }}？
          </h2>
          <p v-if="currentStep.itemId" class="text-2xl text-warm-500 leading-relaxed">
            💡 {{ (planStore.getPlanById(sessionStore.session.planId)?.checkItems.find(i => i.id === currentStep.itemId)?.reminder) || '请仔细确认' }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-5 mb-6">
          <button
            @click="handleSetStatus('confirmed'); goNext()"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Check class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">已确认</div>
            <div class="text-base text-emerald-100">确认无误</div>
          </button>

          <button
            @click="handleSetStatus('remind-later')"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Clock class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">稍后提醒</div>
            <div class="text-base text-amber-100">等会儿再看</div>
          </button>

          <button
            @click="handleSetStatus('not-clear')"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-warm-500 hover:bg-warm-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Eye class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">没看清</div>
            <div class="text-base text-warm-100">再仔细看看</div>
          </button>

          <button
            @click="handleSetStatus('need-family')"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Users class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">需要家人</div>
            <div class="text-base text-blue-100">自动通知家人</div>
          </button>
        </div>

        <div class="mb-6">
          <label class="block text-2xl font-bold text-warm-700 mb-3">
            <HelpCircle class="inline-block w-7 h-7 mr-2 -mt-1" />
            有什么想说的？（选填）
          </label>
          <textarea
            v-model="helpNote"
            rows="2"
            class="w-full rounded-2xl border-4 border-warm-100 focus:border-orange-400 focus:outline-none px-5 py-4 text-2xl text-warm-800 resize-none"
            placeholder="想对家人说的话..."
          />
        </div>

        <div class="flex items-center gap-4 pt-4 border-t-4 border-warm-100">
          <button
            @click="goPrev"
            :disabled="sessionStore.session.currentStepIndex === 0"
            class="flex items-center gap-2 px-6 py-4 rounded-2xl text-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            :class="sessionStore.session.currentStepIndex === 0 ? 'bg-warm-50 text-warm-400' : 'bg-warm-100 text-warm-700 hover:bg-warm-200 active:scale-95'"
          >
            <ChevronLeft class="w-7 h-7" />
            上一项
          </button>

          <div class="flex-1 flex items-center gap-2 justify-center overflow-x-auto py-1">
            <button
              v-for="(step, idx) in sessionStore.session.steps"
              :key="idx"
              @click="sessionStore.goToStep(idx)"
              class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 transition-all active:scale-90"
              :class="{
                'ring-4 ring-offset-2': idx === sessionStore.session.currentStepIndex,
              } as any"
              :style="{
                backgroundColor: isStepPending(step.status)
                  ? '#FFF8F0'
                  : NIGHT_CARE_FEEDBACK_COLORS[step.status],
                color: isStepPending(step.status) ? '#B8A08A' : 'white',
                '--tw-ring-color': idx === sessionStore.session.currentStepIndex
                  ? getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon')
                  : 'transparent',
                border: isStepPending(step.status) ? '2px solid #E8D8C8' : 'none',
              } as any"
              :title="`${idx + 1}. ${step.itemName}（${isStepPending(step.status) ? '待确认' : NIGHT_CARE_FEEDBACK_LABELS[step.status]}）`"
            >
              {{ isStepPending(step.status) ? idx + 1 : (step.status === 'confirmed' ? '✓' : step.status === 'remind-later' ? '⏰' : step.status === 'not-clear' ? '?' : '!') }}
            </button>
          </div>

          <button
            v-if="sessionStore.session.currentStepIndex < sessionStore.session.steps.length - 1"
            @click="goNext"
            class="flex items-center gap-2 px-6 py-4 rounded-2xl text-xl font-bold text-white transition-all shadow-lg active:scale-95 hover:shadow-xl"
            :style="{ backgroundColor: getPlanColor(planStore.getPlanById(sessionStore.session!.planId)?.icon || 'moon') }"
          >
            下一项
            <ChevronRight class="w-7 h-7" />
          </button>
          <button
            v-else
            @click="handleFinish"
            class="flex items-center gap-2 px-8 py-4 rounded-2xl text-2xl font-black text-white transition-all shadow-2xl active:scale-95 hover:shadow-3xl bg-gradient-to-r from-emerald-500 to-teal-500"
          >
            <CheckCircle2 class="w-8 h-8" />
            全部完成
          </button>
        </div>
      </div>

      <div class="rounded-3xl bg-white shadow-lg p-6 border-4 border-warm-100">
        <h3 class="text-2xl font-black text-warm-800 mb-4 flex items-center gap-2">
          <Clock class="w-7 h-7 text-orange-500" />
          快捷操作
        </h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <button
            @click="handleRecheck"
            class="flex items-center gap-3 px-6 py-4 rounded-2xl bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all text-left border-2 border-orange-100"
          >
            <div class="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
              <RefreshCw class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="text-xl font-bold text-warm-900">重新检查</div>
              <div class="text-base text-warm-500">清除所有确认，从头开始</div>
            </div>
          </button>
          <button
            @click="handleFinish"
            class="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all text-left border-2 border-emerald-100"
          >
            <div class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="text-xl font-bold text-warm-900">完成确认</div>
              <div class="text-base text-warm-500">完成今晚的照护检查</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
