<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLeavingChecklistStore, useLeavingSessionStore, useEmergencyStore } from '@/stores'
import {
  ArrowLeft, Check, X, HelpCircle, Users, AlertTriangle, ChevronLeft,
  ChevronRight, RefreshCw, MapPin, Clock, Phone, UserCheck, XCircle,
  SkipForward, HeartPulse, ShoppingBag, Building2, DoorOpen, Star,
  CheckCircle2, Circle, Package, KeyRound, ShieldCheck, Smartphone, ListChecks
} from 'lucide-vue-next'
import {
  LEAVING_SCENE_LABELS, LEAVING_SCENE_COLORS,
  CHECKLIST_ITEM_CATEGORY_LABELS, CHECKLIST_ITEM_CATEGORY_COLORS,
  CHECKLIST_STEP_STATUS_LABELS, CHECKLIST_STEP_STATUS_COLORS
} from '@/types'
import type { LeavingChecklistScene, ChecklistStepStatus, ChecklistItemCategory } from '@/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'return-confirm'): void
  (e: 'view-item', id: string): void
}>()

const checklistStore = useLeavingChecklistStore()
const sessionStore = useLeavingSessionStore()
const emergencyStore = useEmergencyStore()

const mode = ref<'select' | 'executing'>('select')
const helpNote = ref('')
const showNotFoundModal = ref(false)
const notFoundStepIndex = ref(-1)

watch(() => sessionStore.session, (s) => {
  if (s) {
    mode.value = 'executing'
  } else {
    mode.value = 'select'
  }
}, { immediate: true })

const SCENE_ICONS: Record<LeavingChecklistScene, typeof HeartPulse> = {
  'hospital-visit': HeartPulse,
  'family-visit': Users,
  'grocery': ShoppingBag,
  'community': Building2,
  'emergency-evac': AlertTriangle,
}

const CATEGORY_ICONS: Record<ChecklistItemCategory, typeof KeyRound> = {
  'contact-card': Users,
  'id': ListChecks,
  'medicine': HeartPulse,
  'key': KeyRound,
  'phone': Smartphone,
  'safety-check': ShieldCheck,
  'emergency-item': Package,
}

function handleStartChecklist(checklistId: string) {
  const cl = checklistStore.getChecklistById(checklistId)
  if (cl) {
    sessionStore.startSession(cl)
    mode.value = 'executing'
  }
}

function handleSetStatus(status: ChecklistStepStatus, note: string = '') {
  if (!sessionStore.session) return
  sessionStore.setStepStatus(sessionStore.session.currentStepIndex, status, note)
  helpNote.value = ''
}

function handleNotFound() {
  if (!sessionStore.session) return
  notFoundStepIndex.value = sessionStore.session.currentStepIndex
  showNotFoundModal.value = true
}

function confirmNotFound(withNote: boolean) {
  if (!sessionStore.session) return
  const step = sessionStore.session.steps[sessionStore.session.currentStepIndex]
  if (withNote && step?.linkedEmergencyItemId) {
    emit('view-item', step.linkedEmergencyItemId)
  }
  handleSetStatus('not-found', helpNote.value)
  showNotFoundModal.value = false
  goNext()
}

function handleNeedHelp() {
  handleSetStatus('need-help', helpNote.value)
}

const currentStep = computed(() => {
  if (!sessionStore.session) return null
  return sessionStore.session.steps[sessionStore.session.currentStepIndex]
})

const progress = computed(() => {
  if (!sessionStore.session) return 0
  const done = sessionStore.session.steps.filter(s => s.status !== 'pending').length
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
    emit('return-confirm')
  }
}

function handleRecheck() {
  if (confirm('确定要重新检查所有项目吗？已确认的状态将被清除。')) {
    sessionStore.resetAllSteps()
  }
}

function handleFinishToConfirm() {
  if (!sessionStore.session) return
  const pending = sessionStore.session.steps.filter(s => s.status === 'pending').length
  if (pending > 0) {
    if (!confirm(`还有 ${pending} 项未确认，确定直接进入返回确认吗？`)) {
      return
    }
  }
  sessionStore.finishExecution()
  emit('return-confirm')
}

function handleBackToList() {
  if (sessionStore.session) {
    if (!confirm('确定要退出吗？当前检查进度将保留。')) return
    sessionStore.clearSession()
  }
  mode.value = 'select'
  emit('back')
}
</script>

<template>
  <div class="min-h-[600px]">
    <div v-if="mode === 'select'" class="space-y-8">
      <div class="text-center py-6">
        <div class="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
          <DoorOpen class="w-12 h-12 text-white" />
        </div>
        <h1 class="text-4xl font-black text-warm-900 mb-3" style="font-family: 'Noto Serif SC', serif;">
          我要出门
        </h1>
        <p class="text-xl text-warm-500">请选择您要出门做什么</p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <button
          v-for="checklist in checklistStore.sortedChecklists"
          :key="checklist.id"
          @click="handleStartChecklist(checklist.id)"
          class="group relative text-left rounded-3xl p-7 shadow-md transition-all hover:shadow-2xl border-4 border-transparent hover:scale-[1.02] active:scale-[0.99]"
          :style="{
            background: `linear-gradient(135deg, ${LEAVING_SCENE_COLORS[checklist.scene]}15 0%, white 50%)`,
            borderColor: LEAVING_SCENE_COLORS[checklist.scene] + '30',
          }"
        >
          <div
            class="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-md"
            :style="{ backgroundColor: LEAVING_SCENE_COLORS[checklist.scene] }"
          >
            <component
              :is="SCENE_ICONS[checklist.scene]"
              class="w-10 h-10 text-white"
            />
          </div>

          <h2 class="text-3xl font-black text-warm-900 mb-2">{{ checklist.name }}</h2>
          <p class="text-lg text-warm-500 mb-4 leading-relaxed">{{ checklist.description }}</p>

          <div class="flex items-center gap-3 mb-4 flex-wrap">
            <div class="flex items-center gap-1.5 text-base font-semibold px-3 py-1.5 rounded-full" :style="{ backgroundColor: LEAVING_SCENE_COLORS[checklist.scene] + '20', color: LEAVING_SCENE_COLORS[checklist.scene] }">
              <ListChecks class="w-5 h-5" />
              {{ checklist.items.length }} 项检查
            </div>
            <div v-if="checklist.estimatedDuration" class="flex items-center gap-1.5 text-base text-warm-500">
              <Clock class="w-5 h-5" />
              {{ checklist.estimatedDuration }}
            </div>
            <Star v-if="checklist.isHighlighted" class="w-6 h-6 text-orange-500 fill-orange-500" />
          </div>

          <div
            class="mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl text-2xl font-black text-white transition-all group-hover:brightness-110"
            :style="{ backgroundColor: LEAVING_SCENE_COLORS[checklist.scene] }"
          >
            开始检查
            <ChevronRight class="w-7 h-7" />
          </div>
        </button>
      </div>

      <div
        v-if="checklistStore.checklists.length === 0"
        class="rounded-3xl bg-warm-50 px-8 py-16 text-center"
      >
        <Package class="mx-auto mb-4 h-20 w-20 text-warm-300" />
        <p class="text-2xl text-warm-400 font-bold mb-2">还没有离家清单</p>
        <p class="text-lg text-warm-300">请先让家人帮您创建清单</p>
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
      <div class="rounded-3xl p-6 shadow-lg" :style="{ background: `linear-gradient(135deg, ${LEAVING_SCENE_COLORS[sessionStore.session.scene]}20 0%, white 60%)` }">
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
                :style="{ backgroundColor: LEAVING_SCENE_COLORS[sessionStore.session.scene], color: 'white' }"
              >
                {{ LEAVING_SCENE_LABELS[sessionStore.session.scene] }}
              </div>
              <h1 class="text-3xl font-black text-warm-900 truncate">
                {{ sessionStore.session.checklistName }}
              </h1>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <div class="flex items-end justify-between mb-3">
            <span class="text-2xl font-bold text-warm-700">完成进度</span>
            <span class="text-4xl font-black" :style="{ color: LEAVING_SCENE_COLORS[sessionStore.session.scene] }">
              {{ progress }}%
            </span>
          </div>
          <div class="h-6 rounded-full bg-white shadow-inner overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :style="{
                width: progress + '%',
                background: `linear-gradient(90deg, ${LEAVING_SCENE_COLORS[sessionStore.session.scene]}, ${LEAVING_SCENE_COLORS[sessionStore.session.scene]}dd)`,
              } as any"
            />
          </div>
          <div class="flex items-center justify-between mt-3 text-lg">
            <div class="flex items-center gap-2 text-warm-500 font-semibold">
              <CheckCircle2 class="w-6 h-6 text-emerald-500" />
              已完成 {{ sessionStore.session.steps.filter(s => s.status !== 'pending').length }} 项
            </div>
            <div class="flex items-center gap-2 font-bold" :class="sessionStore.remainingSteps > 0 ? 'text-red-500' : 'text-emerald-500'">
              <Circle class="w-6 h-6" />
              剩余 {{ sessionStore.remainingSteps }} 项
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
              :style="{ backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[currentStep.category] }"
            >
              {{ sessionStore.session.currentStepIndex + 1 }}
            </div>
            <div>
              <p class="text-xl text-warm-400 font-semibold">第 {{ sessionStore.session.currentStepIndex + 1 }} / {{ sessionStore.session.steps.length }} 项</p>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-lg font-bold"
                  :style="{
                    backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[currentStep.category] + '20',
                    color: CHECKLIST_ITEM_CATEGORY_COLORS[currentStep.category],
                  } as any"
                >
                  <component
                    :is="CATEGORY_ICONS[currentStep.category]"
                    class="w-5 h-5"
                  />
                  {{ CHECKLIST_ITEM_CATEGORY_LABELS[currentStep.category] }}
                </span>
                <Star
                  v-if="currentStep.isKeyPoint"
                  class="w-7 h-7 text-red-500 fill-red-500"
                />
                <span v-if="currentStep.isKeyPoint" class="text-lg font-black text-red-500">重点项</span>
              </div>
            </div>
          </div>
          <div
            v-if="currentStep.status !== 'pending'"
            class="px-5 py-3 rounded-2xl text-xl font-black text-white shadow-md"
            :style="{ backgroundColor: CHECKLIST_STEP_STATUS_COLORS[currentStep.status] }"
          >
            {{ CHECKLIST_STEP_STATUS_LABELS[currentStep.status] }}
          </div>
        </div>

        <div class="mb-8 p-6 rounded-2xl" :style="{ backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[currentStep.category] + '10' }">
          <h2 class="text-5xl font-black text-warm-900 mb-4 leading-tight">
            带了 {{ currentStep.itemName }} 吗？
          </h2>
          <p v-if="currentStep.itemId" class="text-2xl text-warm-500 leading-relaxed">
            💡 {{ (checklistStore.getChecklistById(sessionStore.session.checklistId)?.items.find(i => i.id === currentStep.itemId)?.reminder) || '仔细确认一下' }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-5 mb-6">
          <button
            @click="handleSetStatus('done'); goNext()"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Check class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">已带上</div>
            <div class="text-base text-emerald-100">确认带好了</div>
          </button>

          <button
            @click="handleNotFound"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <MapPin class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">找不到</div>
            <div class="text-base text-red-100">查看位置详情</div>
          </button>

          <button
            @click="handleSetStatus('skip'); goNext()"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-warm-500 hover:bg-warm-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <SkipForward class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">不需要</div>
            <div class="text-base text-warm-100">这次不用带</div>
          </button>

          <button
            @click="handleNeedHelp()"
            class="group flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-3xl bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all shadow-xl hover:shadow-2xl"
          >
            <div class="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Users class="w-12 h-12 text-white" />
            </div>
            <div class="text-3xl font-black text-white">需要帮忙</div>
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
                backgroundColor: step.status === 'pending'
                  ? '#FFF8F0'
                  : CHECKLIST_STEP_STATUS_COLORS[step.status],
                color: step.status === 'pending' ? '#B8A08A' : 'white',
                '--tw-ring-color': idx === sessionStore.session.currentStepIndex
                  ? LEAVING_SCENE_COLORS[sessionStore.session.scene]
                  : 'transparent',
                border: step.status === 'pending' ? '2px solid #E8D8C8' : 'none',
              } as any"
              :title="`${idx + 1}. ${step.itemName}（${CHECKLIST_STEP_STATUS_LABELS[step.status]}）`"
            >
              {{ step.status === 'pending' ? idx + 1 : (step.status === 'done' ? '✓' : step.status === 'skip' ? '→' : step.status === 'not-found' ? '?' : '!') }}
            </button>
          </div>

          <button
            v-if="sessionStore.session.currentStepIndex < sessionStore.session.steps.length - 1"
            @click="goNext"
            :disabled="currentStep.status === 'pending'"
            class="flex items-center gap-2 px-6 py-4 rounded-2xl text-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl"
            :style="{ backgroundColor: LEAVING_SCENE_COLORS[sessionStore.session.scene] }"
          >
            下一项
            <ChevronRight class="w-7 h-7" />
          </button>
          <button
            v-else
            @click="handleFinishToConfirm"
            class="flex items-center gap-2 px-8 py-4 rounded-2xl text-2xl font-black text-white transition-all shadow-2xl active:scale-95 hover:shadow-3xl bg-gradient-to-r from-emerald-500 to-teal-500"
          >
            <UserCheck class="w-8 h-8" />
            检查完成
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
              <div class="text-xl font-bold text-warm-900">返回重新检查</div>
              <div class="text-base text-warm-500">清除所有确认，从头检查</div>
            </div>
          </button>
          <button
            @click="handleFinishToConfirm"
            class="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 transition-all text-left border-2 border-emerald-100"
          >
            <div class="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 class="w-6 h-6 text-white" />
            </div>
            <div>
              <div class="text-xl font-bold text-warm-900">完成并准备回家</div>
              <div class="text-base text-warm-500">回家后记得做安全确认</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showNotFoundModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5);">
        <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div class="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <XCircle class="w-10 h-10" />
              </div>
              <div>
                <h3 class="text-3xl font-black mb-1">找不到这个物品</h3>
                <p class="text-red-100 text-lg">别着急，我们来帮您</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-4">
            <div v-if="currentStep" class="rounded-2xl bg-warm-50 p-4">
              <p class="text-xl font-bold text-warm-800 mb-2">找不到的物品：</p>
              <p class="text-3xl font-black text-warm-900">{{ currentStep.itemName }}</p>
              <div
                v-if="currentStep.linkedEmergencyItemName"
                class="mt-3 flex items-center gap-2 text-lg text-warm-600"
              >
                <MapPin class="w-5 h-5" />
                已登记位置信息
              </div>
            </div>

            <div>
              <label class="block text-xl font-bold text-warm-700 mb-2">想对家人说什么？（选填）</label>
              <textarea
                v-model="helpNote"
                rows="2"
                class="w-full rounded-xl border-2 border-warm-200 focus:border-orange-400 focus:outline-none px-4 py-3 text-xl"
                placeholder="例如：好像忘记放在哪里了..."
              />
            </div>

            <div class="grid gap-3 pt-2">
              <button
                v-if="currentStep?.linkedEmergencyItemId"
                @click="confirmNotFound(true)"
                class="flex items-center justify-center gap-3 py-5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-2xl font-black active:scale-95 transition-all shadow-lg"
              >
                <MapPin class="w-8 h-8" />
                查看物品位置详情
              </button>
              <button
                @click="confirmNotFound(false)"
                class="flex items-center justify-center gap-3 py-4 rounded-2xl bg-warm-100 hover:bg-warm-200 text-warm-800 text-xl font-bold active:scale-95 transition-all"
              >
                直接标记"找不到"，通知家人
              </button>
              <button
                @click="showNotFoundModal = false"
                class="py-3 rounded-2xl text-warm-500 text-lg font-semibold hover:bg-warm-50 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
