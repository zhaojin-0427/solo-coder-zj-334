<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLeavingSessionStore } from '@/stores'
import {
  Home, AlertCircle, FileText, CheckCircle2, X, Plus, ArrowLeft,
  HeartPulse, ShoppingBag, Building2, Users, Clock, ListChecks, Star,
  CheckCircle, XCircle, HelpCircle
} from 'lucide-vue-next'
import {
  LEAVING_SCENE_LABELS, LEAVING_SCENE_COLORS,
  RETURN_CONFIRM_LABELS, RETURN_CONFIRM_COLORS,
  CHECKLIST_STEP_STATUS_LABELS, CHECKLIST_STEP_STATUS_COLORS
} from '@/types'
import type { ReturnConfirmType, LeavingChecklistScene, ChecklistStepStatus } from '@/types'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'back-to-elderly'): void
  (e: 'completed'): void
}>()

const sessionStore = useLeavingSessionStore()

const selectedType = ref<ReturnConfirmType | null>(null)
const forgotItemsInput = ref('')
const forgotItemsList = ref<string[]>([])
const notesText = ref('')

const session = computed(() => sessionStore.session)

const SCENE_ICONS: Record<LeavingChecklistScene, typeof HeartPulse> = {
  'hospital-visit': HeartPulse,
  'family-visit': Users,
  'grocery': ShoppingBag,
  'community': Building2,
  'emergency-evac': AlertCircle,
}

const executionSummary = computed(() => {
  if (!session.value) return null
  const steps = session.value.steps
  const counts: Record<ChecklistStepStatus, number> = {
    pending: 0, done: 0, 'not-found': 0, skip: 0, 'need-help': 0,
  }
  for (const s of steps) counts[s.status]++
  const abnormalItems: { name: string; status: ChecklistStepStatus; note: string }[] = []
  for (const s of steps) {
    if (s.status === 'not-found' || s.status === 'need-help') {
      abnormalItems.push({ name: s.itemName, status: s.status, note: s.note })
    }
  }
  const elapsedSec = steps.filter(s => s.timestamp > 0).length > 0
    ? Math.round((Math.max(...steps.filter(s => s.timestamp > 0).map(s => s.timestamp)) - session.value.startedAt) / 1000)
    : 0
  return { counts, abnormalItems, elapsedSec }
})

function formatElapsed(sec: number) {
  if (sec < 60) return sec + ' 秒'
  if (sec < 3600) return Math.floor(sec / 60) + ' 分钟'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h + ' 小时 ' + m + ' 分'
}

function selectType(t: ReturnConfirmType) {
  selectedType.value = t
}

function addForgotItem() {
  const item = forgotItemsInput.value.trim()
  if (item && !forgotItemsList.value.includes(item)) {
    forgotItemsList.value.push(item)
    forgotItemsInput.value = ''
  }
}

function removeForgotItem(item: string) {
  forgotItemsList.value = forgotItemsList.value.filter(i => i !== item)
}

function submitConfirm() {
  if (!selectedType.value) return
  if (selectedType.value === 'forgot-items' && forgotItemsList.value.length === 0) {
    alert('请至少填写一项忘带的物品')
    return
  }
  sessionStore.submitReturnConfirm(
    selectedType.value,
    [...forgotItemsList.value],
    notesText.value.trim()
  )
  emit('completed')
}

function handleBack() {
  if (session.value && session.value.status === 'return-confirm') {
    session.value.status = 'executing'
    emit('back-to-elderly')
  } else {
    emit('back')
  }
}
</script>

<template>
  <div class="space-y-6" v-if="session">
    <div class="flex items-center gap-3">
      <button
        @click="handleBack"
        class="p-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all active:scale-95"
      >
        <ArrowLeft class="w-7 h-7 text-warm-600" />
      </button>
      <div>
        <h1 class="text-3xl font-black text-warm-900" style="font-family: 'Noto Serif SC', serif;">
          回家确认
        </h1>
        <p class="text-lg text-warm-500">请告诉家人您是否安全到家了</p>
      </div>
    </div>

    <div class="rounded-3xl p-6 shadow-lg" :style="{ background: `linear-gradient(135deg, ${LEAVING_SCENE_COLORS[session.scene]}20 0%, white 60%)` }">
      <div class="flex items-center gap-4">
        <div
          class="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md"
          :style="{ backgroundColor: LEAVING_SCENE_COLORS[session.scene] }"
        >
          <component
            :is="SCENE_ICONS[session.scene]"
            class="w-10 h-10 text-white"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <h2 class="text-3xl font-black text-warm-900 truncate">{{ session.checklistName }}</h2>
            <span
              class="px-4 py-1.5 rounded-full text-lg font-bold"
              :style="{ backgroundColor: LEAVING_SCENE_COLORS[session.scene] + '20', color: LEAVING_SCENE_COLORS[session.scene] }"
            >
              {{ LEAVING_SCENE_LABELS[session.scene] }}
            </span>
          </div>
          <div class="flex items-center gap-5 mt-3 flex-wrap text-lg">
            <div class="flex items-center gap-1.5 text-warm-500 font-semibold">
              <Clock class="w-5 h-5" />
              出门时间：{{ new Date(session.startedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
            </div>
            <div class="flex items-center gap-1.5 text-warm-500 font-semibold">
              <ListChecks class="w-5 h-5" />
              {{ session.steps.length }} 项检查
            </div>
            <div v-if="executionSummary?.elapsedSec" class="flex items-center gap-1.5 text-warm-500 font-semibold">
              ⏱ 检查用时 {{ formatElapsed(executionSummary.elapsedSec) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="executionSummary" class="grid md:grid-cols-5 gap-4">
      <div
        v-for="(label, key) in CHECKLIST_STEP_STATUS_LABELS"
        :key="key"
        class="rounded-2xl bg-white shadow-sm p-5 border-t-4"
        :style="{ borderTopColor: CHECKLIST_STEP_STATUS_COLORS[key as ChecklistStepStatus] }"
      >
        <div class="text-4xl font-black mb-1" :style="{ color: CHECKLIST_STEP_STATUS_COLORS[key as ChecklistStepStatus] }">
          {{ executionSummary.counts[key as ChecklistStepStatus] }}
        </div>
        <div class="text-base text-warm-500 font-semibold">{{ label }}</div>
      </div>
    </div>

    <div v-if="executionSummary && executionSummary.abnormalItems.length > 0" class="rounded-3xl bg-amber-50 border-4 border-amber-200 p-6">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0">
          <AlertCircle class="w-8 h-8 text-white animate-pulse" />
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-black text-amber-800 mb-3">
            出门检查异常提醒（{{ executionSummary.abnormalItems.length }} 项）
          </h3>
          <div class="space-y-2">
            <div
              v-for="(item, idx) in executionSummary.abnormalItems"
              :key="idx"
              class="flex items-start gap-3 bg-white rounded-xl p-4 border-2 border-amber-100"
            >
              <Star class="w-5 h-5 text-amber-500 fill-amber-100 shrink-0 mt-0.5" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xl font-bold text-warm-900">{{ item.name }}</span>
                  <span
                    class="px-2.5 py-0.5 rounded-full text-sm font-bold text-white"
                    :style="{ backgroundColor: CHECKLIST_STEP_STATUS_COLORS[item.status] }"
                  >
                    {{ CHECKLIST_STEP_STATUS_LABELS[item.status] }}
                  </span>
                </div>
                <p v-if="item.note" class="text-base text-warm-500 mt-1">
                  备注：{{ item.note }}
                </p>
              </div>
            </div>
          </div>
          <p class="text-amber-700 mt-4 text-base">
            💡 以上情况已自动通知家属跟进，请在下方确认回家状态时补充说明。
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-3xl bg-white shadow-2xl p-8 border-4 border-warm-100">
      <h3 class="text-2xl font-black text-warm-800 mb-6 flex items-center gap-3">
        <Home class="w-8 h-8 text-emerald-500" />
        请选择回家情况：
      </h3>

      <div class="grid md:grid-cols-3 gap-5 mb-8">
        <button
          @click="selectType('safe-home')"
          class="group relative flex flex-col items-center gap-4 py-8 px-6 rounded-3xl transition-all active:scale-95 border-4"
          :class="selectedType === 'safe-home'
            ? 'shadow-2xl scale-[1.02]'
            : 'hover:shadow-lg hover:bg-emerald-50/50'"
          :style="selectedType === 'safe-home'
            ? { borderColor: RETURN_CONFIRM_COLORS['safe-home'], backgroundColor: RETURN_CONFIRM_COLORS['safe-home'] + '15' }
            : { borderColor: '#F0E0D0' }"
        >
          <div
            class="w-24 h-24 rounded-3xl flex items-center justify-center transition-all shadow-lg group-hover:scale-105"
            :class="selectedType === 'safe-home' ? 'bg-emerald-500' : 'bg-emerald-100'"
          >
            <CheckCircle2 class="w-14 h-14" :class="selectedType === 'safe-home' ? 'text-white' : 'text-emerald-600'" />
          </div>
          <div class="text-center">
            <div class="text-3xl font-black mb-1" :class="selectedType === 'safe-home' ? 'text-emerald-700' : 'text-warm-800'">
              {{ RETURN_CONFIRM_LABELS['safe-home'] }}
            </div>
            <div class="text-base text-warm-500 leading-relaxed">
              一切顺利，已平安到家
            </div>
          </div>
          <div
            v-if="selectedType === 'safe-home'"
            class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
          >
            <CheckCircle class="w-6 h-6 text-white" />
          </div>
        </button>

        <button
          @click="selectType('forgot-items')"
          class="group relative flex flex-col items-center gap-4 py-8 px-6 rounded-3xl transition-all active:scale-95 border-4"
          :class="selectedType === 'forgot-items'
            ? 'shadow-2xl scale-[1.02]'
            : 'hover:shadow-lg hover:bg-red-50/50'"
          :style="selectedType === 'forgot-items'
            ? { borderColor: RETURN_CONFIRM_COLORS['forgot-items'], backgroundColor: RETURN_CONFIRM_COLORS['forgot-items'] + '15' }
            : { borderColor: '#F0E0D0' }"
        >
          <div
            class="w-24 h-24 rounded-3xl flex items-center justify-center transition-all shadow-lg group-hover:scale-105"
            :class="selectedType === 'forgot-items' ? 'bg-red-500' : 'bg-red-100'"
          >
            <XCircle class="w-14 h-14" :class="selectedType === 'forgot-items' ? 'text-white' : 'text-red-600'" />
          </div>
          <div class="text-center">
            <div class="text-3xl font-black mb-1" :class="selectedType === 'forgot-items' ? 'text-red-700' : 'text-warm-800'">
              {{ RETURN_CONFIRM_LABELS['forgot-items'] }}
            </div>
            <div class="text-base text-warm-500 leading-relaxed">
              有些东西落在外面了
            </div>
          </div>
          <div
            v-if="selectedType === 'forgot-items'"
            class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
          >
            <CheckCircle class="w-6 h-6 text-white" />
          </div>
        </button>

        <button
          @click="selectType('need-notes')"
          class="group relative flex flex-col items-center gap-4 py-8 px-6 rounded-3xl transition-all active:scale-95 border-4"
          :class="selectedType === 'need-notes'
            ? 'shadow-2xl scale-[1.02]'
            : 'hover:shadow-lg hover:bg-amber-50/50'"
          :style="selectedType === 'need-notes'
            ? { borderColor: RETURN_CONFIRM_COLORS['need-notes'], backgroundColor: RETURN_CONFIRM_COLORS['need-notes'] + '15' }
            : { borderColor: '#F0E0D0' }"
        >
          <div
            class="w-24 h-24 rounded-3xl flex items-center justify-center transition-all shadow-lg group-hover:scale-105"
            :class="selectedType === 'need-notes' ? 'bg-amber-500' : 'bg-amber-100'"
          >
            <HelpCircle class="w-14 h-14" :class="selectedType === 'need-notes' ? 'text-white' : 'text-amber-600'" />
          </div>
          <div class="text-center">
            <div class="text-3xl font-black mb-1" :class="selectedType === 'need-notes' ? 'text-amber-700' : 'text-warm-800'">
              {{ RETURN_CONFIRM_LABELS['need-notes'] }}
            </div>
            <div class="text-base text-warm-500 leading-relaxed">
              有其他事想告诉家人
            </div>
          </div>
          <div
            v-if="selectedType === 'need-notes'"
            class="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
          >
            <CheckCircle class="w-6 h-6 text-white" />
          </div>
        </button>
      </div>

      <div v-if="selectedType === 'forgot-items'" class="rounded-2xl border-4 border-red-100 bg-red-50/50 p-6 mb-6">
        <h4 class="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
          <AlertCircle class="w-6 h-6" />
          请选择或输入忘带的物品：
        </h4>
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="step in session.steps.filter(s => s.status === 'done' || s.status === 'skip')"
            :key="step.itemId"
            @click="!forgotItemsList.includes(step.itemName) ? forgotItemsList.push(step.itemName) : null"
            :disabled="forgotItemsList.includes(step.itemName)"
            class="px-4 py-2 rounded-xl text-lg font-semibold transition-all border-2"
            :class="forgotItemsList.includes(step.itemName)
              ? 'bg-red-100 border-red-300 text-red-600 opacity-60 cursor-not-allowed'
              : 'bg-white border-warm-200 text-warm-700 hover:border-red-300 hover:bg-red-50'"
          >
            {{ step.itemName }}
          </button>
        </div>
        <div class="flex items-center gap-2 mb-4">
          <input
            v-model="forgotItemsInput"
            type="text"
            class="flex-1 rounded-xl border-2 border-warm-200 focus:border-red-400 focus:outline-none px-4 py-3 text-xl"
            placeholder="输入其他忘带的物品名称..."
            @keyup.enter="addForgotItem"
          />
          <button
            @click="addForgotItem"
            :disabled="!forgotItemsInput.trim()"
            class="flex items-center gap-1.5 rounded-xl px-5 py-3 text-xl font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Plus class="w-6 h-6" />
            添加
          </button>
        </div>
        <div v-if="forgotItemsList.length > 0" class="flex flex-wrap gap-2">
          <div
            v-for="item in forgotItemsList"
            :key="item"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-xl font-bold"
          >
            {{ item }}
            <button
              @click="removeForgotItem(item)"
              class="p-0.5 rounded-lg hover:bg-red-400 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        <p v-else class="text-red-400 text-base">请从上方选择忘带的物品，或手动输入添加</p>
      </div>

      <div v-if="selectedType === 'need-notes' || selectedType === 'forgot-items'" class="space-y-3 mb-6">
        <h4 class="text-xl font-black text-warm-700 flex items-center gap-2">
          <FileText class="w-6 h-6" />
          补充说明：
        </h4>
        <textarea
          v-model="notesText"
          rows="4"
          class="w-full rounded-2xl border-4 border-warm-100 focus:border-orange-400 focus:outline-none px-5 py-4 text-xl text-warm-800 resize-none"
          :placeholder="selectedType === 'forgot-items'
            ? '请说明忘带物品的情况，比如：落在哪里了，是否需要家人帮忙取回...'
            : '有什么想对家人说的，比如：今天发生了什么特别的事、身体情况、需要家人帮忙做什么...'"
        />
      </div>

      <div class="flex items-center justify-end gap-4 pt-6 border-t-4 border-warm-100">
        <button
          @click="handleBack"
          class="px-8 py-4 rounded-2xl text-xl font-bold text-warm-600 bg-warm-100 hover:bg-warm-200 transition-all active:scale-95"
        >
          返回修改
        </button>
        <button
          @click="submitConfirm"
          :disabled="!selectedType || (selectedType === 'forgot-items' && forgotItemsList.length === 0)"
          class="flex items-center gap-2 px-10 py-4 rounded-2xl text-2xl font-black text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl bg-gradient-to-r from-orange-500 to-amber-500"
        >
          <CheckCircle2 class="w-8 h-8" />
          确认提交
        </button>
      </div>
    </div>

    <div class="text-center py-6">
      <p class="text-warm-400 text-base">
        无论您选择哪种情况，家属都会收到通知。感谢您的配合！
      </p>
    </div>
  </div>
</template>
