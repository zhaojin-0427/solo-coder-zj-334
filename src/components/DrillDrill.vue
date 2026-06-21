<script setup lang="ts">
import type { ContactGroup, ContactResult } from '@/types'
import { GROUP_LABELS, GROUP_COLORS, DRILL_MODES, CONTACT_RESULT_LABELS, CONTACT_RESULT_COLORS } from '@/types'
import { useContactStore, useDrillStore } from '@/stores'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  Heart, Wrench, Pill, Phone, Settings,
  PhoneCall, PhoneOff, AlertTriangle, Clock, CheckCircle2,
  RotateCcw, ChevronRight, Save, Star, AlertCircle, SkipForward,
} from 'lucide-vue-next'
import DrillHistory from './DrillHistory.vue'

const contactStore = useContactStore()
const drillStore = useDrillStore()

const showHistory = ref(false)
const customGroupOrder = ref<ContactGroup[]>([...DRILL_MODES[4].groupOrder])

const ICON_MAP: Record<string, typeof Heart> = {
  heart: Heart,
  wrench: Wrench,
  pill: Pill,
  phone: Phone,
  settings: Settings,
}

const RESULT_ICONS: Record<ContactResult, typeof CheckCircle2> = {
  'connected': PhoneCall,
  'no-answer': PhoneOff,
  'wrong-number': AlertTriangle,
  'call-later': Clock,
  'help-done': CheckCircle2,
}

const currentAttempt = computed(() => {
  if (!drillStore.session) return null
  return drillStore.session.queue[drillStore.session.currentIndex] ?? null
})

const nextAttempt = computed(() => {
  if (!drillStore.session) return null
  return drillStore.session.queue[drillStore.session.currentIndex + 1] ?? null
})

const progressPercent = computed(() => {
  if (!drillStore.session) return 0
  const total = drillStore.session.queue.length
  const done = drillStore.session.queue.filter(a => a.result !== null).length
  return total > 0 ? Math.round((done / total) * 100) : 0
})

const formattedTime = computed(() => {
  if (!drillStore.session) return '00:00'
  const s = drillStore.session.elapsedSeconds
  const min = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
})

const attemptNote = ref('')

const noContacts = computed(() => contactStore.contacts.length === 0)
const noEmergency = computed(() => contactStore.emergencyContacts.length === 0)

function handleStartDrill(scenarioId: string) {
  if (noContacts.value) return
  const isCustom = scenarioId === 'custom'
  drillStore.startDrill(
    scenarioId,
    contactStore.contacts,
    isCustom ? customGroupOrder.value : undefined,
  )
  attemptNote.value = ''
}

function handleMarkResult(result: ContactResult) {
  drillStore.markResult(result)
  attemptNote.value = ''
}

function handleSkip() {
  drillStore.skipToNext()
  attemptNote.value = ''
}

function handleReset() {
  drillStore.resetDrill()
  attemptNote.value = ''
}

function handleFinishSave() {
  drillStore.saveToHistory()
  attemptNote.value = ''
}

function moveGroupUp(idx: number) {
  if (idx <= 0) return
  const arr = [...customGroupOrder.value]
  const item = arr.splice(idx, 1)[0]
  arr.splice(idx - 1, 0, item)
  customGroupOrder.value = arr
}

function moveGroupDown(idx: number) {
  if (idx >= customGroupOrder.value.length - 1) return
  const arr = [...customGroupOrder.value]
  const item = arr.splice(idx, 1)[0]
  arr.splice(idx + 1, 0, item)
  customGroupOrder.value = arr
}

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleString('zh-CN')
}

onMounted(() => {
  if (drillStore.session && drillStore.session.status === 'running') {
    drillStore.recoverSession(contactStore.contacts)
  }
})

onBeforeUnmount(() => {
  if (drillStore.session && drillStore.session.status === 'running') {
    drillStore.recoverSession(contactStore.contacts)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">应急拨号演练</h2>
      <button
        @click="showHistory = !showHistory"
        class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
        :class="showHistory ? 'bg-warm-200 text-warm-600' : 'bg-[#E8652B] text-white shadow-md hover:bg-[#d45a24]'"
      >
        <Clock class="h-4 w-4" />
        <span>{{ showHistory ? '返回演练' : '演练记录' }}</span>
      </button>
    </div>

    <DrillHistory v-if="showHistory" />

    <template v-else>
      <div v-if="noContacts" class="rounded-2xl bg-[#FFF8F0] px-5 py-6 text-center">
        <AlertCircle class="mx-auto mb-2 h-8 w-8 text-warm-400" />
        <p class="text-lg font-semibold text-warm-700">暂无联系人</p>
        <p class="text-sm text-warm-500 mt-1">请先在"联系人录入"中添加联系人后再开始演练</p>
      </div>

      <div v-else-if="!drillStore.session" class="space-y-5">
        <div class="rounded-2xl bg-[#FFF8F0] px-5 py-4">
          <div class="flex items-start gap-3">
            <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-[#E8652B]" />
            <p class="text-sm font-medium text-warm-800">
              选择一个演练场景，系统将按场景优先级生成拨号队列，模拟紧急情况下依次联系相关人员的流程。
            </p>
          </div>
        </div>

        <div v-if="noEmergency" class="rounded-2xl bg-yellow-50 px-5 py-4 border border-yellow-200">
          <div class="flex items-start gap-3">
            <Star class="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
            <p class="text-sm font-medium text-yellow-800">尚未标记任何紧急联系人，建议在"联系人录入"中将重要联系人设为紧急联系人</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <button
            v-for="mode in DRILL_MODES"
            :key="mode.id"
            @click="handleStartDrill(mode.id)"
            class="flex flex-col items-center gap-2 rounded-2xl bg-white/60 px-4 py-5 backdrop-blur-sm shadow-sm transition-all hover:bg-white/80 hover:shadow-md"
          >
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-[#FFF0E6] text-[#E8652B]">
              <component :is="ICON_MAP[mode.icon]" class="h-7 w-7" />
            </div>
            <span class="text-sm font-semibold text-warm-700">{{ mode.name }}</span>
          </button>
        </div>

        <div class="rounded-2xl bg-white/60 backdrop-blur-sm p-5 space-y-4">
          <h3 class="text-base font-bold text-warm-800">自定义场景分组顺序</h3>
          <p class="text-sm text-warm-500">拖动调整自定义场景的联系人分组拨号顺序</p>
          <div class="space-y-2">
            <div
              v-for="(group, idx) in customGroupOrder"
              :key="group"
              class="flex items-center gap-3 rounded-xl bg-[#FFF8F0] px-4 py-3"
            >
              <span class="text-lg font-bold text-warm-400 w-6 text-center">{{ idx + 1 }}</span>
              <span
                class="rounded-md px-2.5 py-0.5 text-sm font-bold text-white"
                :style="{ backgroundColor: GROUP_COLORS[group] }"
              >
                {{ GROUP_LABELS[group] }}
              </span>
              <span class="text-sm text-warm-500 flex-1">{{ contactStore.groupedContacts[group].length }} 位联系人</span>
              <button
                v-if="idx > 0"
                @click="moveGroupUp(idx)"
                class="rounded-lg p-1 text-warm-400 hover:text-[#E8652B] hover:bg-orange-50 transition-colors"
              >
                <ChevronRight class="h-4 w-4 rotate-180" />
              </button>
              <button
                v-if="idx < customGroupOrder.length - 1"
                @click="moveGroupDown(idx)"
                class="rounded-lg p-1 text-warm-400 hover:text-[#E8652B] hover:bg-orange-50 transition-colors"
              >
                <ChevronRight class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="drillStore.session.status === 'running' && currentAttempt" class="space-y-5">
        <div class="flex items-center justify-between">
          <span class="text-base font-bold text-warm-700">{{ drillStore.session.scenarioName }} 演练中</span>
          <div class="flex items-center gap-2 text-2xl font-mono font-bold text-[#E8652B]">
            <Clock class="h-6 w-6" />
            {{ formattedTime }}
          </div>
        </div>

        <div class="w-full rounded-full bg-warm-100 h-3 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: progressPercent + '%', background: '#E8652B' }"
          />
        </div>
        <div class="flex justify-between text-sm text-warm-500">
          <span>已联系 {{ drillStore.session.queue.filter(a => a.result !== null).length }} / {{ drillStore.session.queue.length }} 位</span>
          <span>{{ progressPercent }}%</span>
        </div>

        <div class="rounded-3xl bg-white shadow-lg p-6 space-y-5 border-2 border-[#E8652B]/20">
          <div class="text-center space-y-1">
            <p class="text-base font-medium text-warm-500">当前应联系</p>
            <p class="text-3xl font-bold text-warm-900" style="font-family: 'Noto Serif SC', serif;">
              {{ currentAttempt.contactName }}
            </p>
          </div>

          <div class="flex items-center justify-center gap-2 py-2">
            <PhoneCall class="h-7 w-7 text-[#E8652B]" />
            <span class="text-4xl font-mono font-bold text-[#E8652B] tracking-wider">
              {{ currentAttempt.contactPhone }}
            </span>
          </div>

          <div class="flex items-center justify-center gap-4 text-lg text-warm-600">
            <span
              class="rounded-lg px-3 py-1 text-sm font-bold text-white"
              :style="{ backgroundColor: GROUP_COLORS[currentAttempt.contactGroup] }"
            >
              {{ GROUP_LABELS[currentAttempt.contactGroup] }}
            </span>
          </div>

          <div v-if="currentAttempt.contactNote" class="text-center text-base text-warm-500 bg-warm-50 rounded-xl px-4 py-2">
            备注：{{ currentAttempt.contactNote }}
          </div>

          <div v-if="nextAttempt" class="rounded-xl bg-warm-50 px-4 py-3 border border-warm-100">
            <p class="text-sm text-warm-500 mb-1">下一位联系人</p>
            <div class="flex items-center gap-2">
              <ChevronRight class="h-4 w-4 text-warm-400" />
              <span class="text-lg font-semibold text-warm-700">{{ nextAttempt.contactName }}</span>
              <span class="text-sm text-warm-400">{{ nextAttempt.contactPhone }}</span>
              <span
                class="rounded px-1.5 py-0.5 text-xs font-bold text-white"
                :style="{ backgroundColor: GROUP_COLORS[nextAttempt.contactGroup] }"
              >
                {{ GROUP_LABELS[nextAttempt.contactGroup] }}
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-600">通话备注（可选）</label>
            <input
              v-model="attemptNote"
              type="text"
              placeholder="记录本次通话情况..."
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
              @input="drillStore.updateAttemptNote(attemptNote)"
            />
          </div>

          <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button
              v-for="(label, key) in CONTACT_RESULT_LABELS"
              :key="key"
              @click="handleMarkResult(key as ContactResult)"
              class="flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              :style="{ backgroundColor: CONTACT_RESULT_COLORS[key as ContactResult] + '18', color: CONTACT_RESULT_COLORS[key as ContactResult] }"
            >
              <component :is="RESULT_ICONS[key as ContactResult]" class="h-5 w-5" />
              <span>{{ label }}</span>
            </button>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              @click="handleSkip"
              class="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
            >
              <SkipForward class="h-4 w-4" />
              跳过此联系人
            </button>
            <button
              @click="handleReset"
              class="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 bg-white hover:bg-red-50 transition-colors"
            >
              <RotateCcw class="h-4 w-4" />
              一键重置
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white/60 backdrop-blur-sm p-4 space-y-3">
          <h3 class="text-sm font-bold text-warm-700">已联系记录</h3>
          <div
            v-for="(attempt, idx) in drillStore.session.queue.filter(a => a.result !== null)"
            :key="idx"
            class="flex items-center gap-3 py-2 border-b border-warm-100 last:border-0"
          >
            <component
              :is="RESULT_ICONS[attempt.result!]"
              class="h-4 w-4 shrink-0"
              :style="{ color: attempt.result ? CONTACT_RESULT_COLORS[attempt.result] : '#999' }"
            />
            <span class="text-sm font-semibold text-warm-800">{{ attempt.contactName }}</span>
            <span
              class="rounded px-1.5 py-0.5 text-xs font-bold text-white"
              :style="{ backgroundColor: CONTACT_RESULT_COLORS[attempt.result!] }"
            >
              {{ attempt.result ? CONTACT_RESULT_LABELS[attempt.result] : '' }}
            </span>
            <span v-if="attempt.note" class="text-xs text-warm-400 flex-1 truncate">{{ attempt.note }}</span>
          </div>
          <div v-if="drillStore.session.queue.filter(a => a.result !== null).length === 0" class="text-sm text-warm-400 text-center py-2">
            尚无联系记录
          </div>
        </div>
      </div>

      <div v-else-if="drillStore.session.status === 'finished'" class="space-y-5">
        <div class="text-center space-y-2">
          <CheckCircle2 class="mx-auto h-12 w-12 text-sage-400" />
          <h3 class="text-2xl font-bold text-warm-900" style="font-family: 'Noto Serif SC', serif;">演练结束</h3>
          <p class="text-base text-warm-500">耗时 {{ formattedTime }}</p>
        </div>

        <div class="rounded-3xl bg-white shadow-lg p-6 space-y-4">
          <h4 class="text-lg font-bold text-warm-800">联系结果摘要</h4>

          <div class="space-y-3">
            <div
              v-for="(attempt, idx) in drillStore.session.queue.filter(a => a.result !== null)"
              :key="idx"
              class="rounded-xl bg-warm-50 px-4 py-3 space-y-1"
            >
              <div class="flex items-center gap-2">
                <component
                  :is="RESULT_ICONS[attempt.result!]"
                  class="h-4 w-4 shrink-0"
                  :style="{ color: attempt.result ? CONTACT_RESULT_COLORS[attempt.result] : '#999' }"
                />
                <span class="text-base font-bold text-warm-900">{{ attempt.contactName }}</span>
                <span
                  class="rounded px-2 py-0.5 text-xs font-bold text-white"
                  :style="{ backgroundColor: attempt.result ? CONTACT_RESULT_COLORS[attempt.result] : '#999' }"
                >
                  {{ attempt.result ? CONTACT_RESULT_LABELS[attempt.result] : '' }}
                </span>
              </div>
              <div class="text-sm text-warm-500">{{ attempt.contactPhone }}</div>
              <div v-if="attempt.note" class="text-sm text-warm-400">备注：{{ attempt.note }}</div>
              <div class="text-xs text-warm-300">{{ formatTimestamp(attempt.timestamp) }}</div>
            </div>
          </div>

          <div v-if="drillStore.session.queue.filter(a => a.result === null).length > 0" class="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p class="text-sm font-semibold text-yellow-800">未联系的联系人：</p>
            <p class="text-sm text-yellow-600 mt-1">
              {{ drillStore.session.queue.filter(a => a.result === null).map(a => a.contactName).join('、') }}
            </p>
          </div>

          <div class="space-y-2 rounded-xl bg-[#FFF8F0] px-4 py-3">
            <h5 class="text-sm font-bold text-warm-700">下一步建议</h5>
            <ul class="space-y-1 text-sm text-warm-600">
              <li v-for="attempt in drillStore.session.queue.filter(a => a.result === 'no-answer' || a.result === 'wrong-number')" :key="attempt.contactId">
                ⚠ {{ attempt.contactName }} 未联系上，建议稍后重试或更换联系方式
              </li>
              <li v-for="attempt in drillStore.session.queue.filter(a => a.result === 'call-later')" :key="attempt.contactId">
                ⏳ {{ attempt.contactName }} 需稍后再拨，请设定提醒
              </li>
              <li v-if="drillStore.session.queue.filter(a => a.result === 'no-answer' || a.result === 'wrong-number' || a.result === 'call-later').length === 0">
                ✓ 所有必要联系人均已联系完毕
              </li>
            </ul>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="handleFinishSave"
            class="flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
            style="background: #E8652B;"
          >
            <Save class="h-5 w-5" />
            保存记录
          </button>
          <button
            @click="handleReset"
            class="flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
          >
            <RotateCcw class="h-5 w-5" />
            不保存，重新开始
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
