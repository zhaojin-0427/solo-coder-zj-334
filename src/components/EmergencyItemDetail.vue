<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmergencyStore, useContactStore, usePackageStore } from '@/stores'
import { EMERGENCY_ITEM_TYPE_LABELS, EMERGENCY_ITEM_TYPE_COLORS, EMERGENCY_URGENCY_LABELS, EMERGENCY_URGENCY_COLORS, FIND_FEEDBACK_LABELS, FIND_FEEDBACK_COLORS } from '@/types'
import type { FindFeedback } from '@/types'
import { ArrowLeft, MapPin, AlertTriangle, Clock, User, Package, Calendar, Eye, Edit, CheckCircle2, XCircle, HelpCircle, MessageSquare, Camera, RefreshCw, Shield } from 'lucide-vue-next'

const props = defineProps<{
  itemId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'edit', id: string): void
}>()

const emergencyStore = useEmergencyStore()
const contactStore = useContactStore()
const packageStore = usePackageStore()

const item = computed(() => emergencyStore.getItemById(props.itemId))

const contactExists = computed(() => {
  if (!item.value?.contactId) return false
  return contactStore.contacts.some(c => c.id === item.value!.contactId)
})

const packageExists = computed(() => {
  if (!item.value?.packageId) return false
  return packageStore.packages.some(p => p.id === item.value!.packageId)
})

const isExpired = computed(() => {
  if (!item.value?.expiryDate) return false
  return item.value.expiryDate < Date.now()
})

const isNearExpiry = computed(() => {
  if (!item.value?.expiryDate) return false
  const diff = item.value.expiryDate - Date.now()
  return diff > 0 && diff < 30 * 86400000
})

const isCheckOverdue = computed(() => {
  if (!item.value?.checkDate) return false
  return item.value.checkDate < Date.now()
})

const isCheckNear = computed(() => {
  if (!item.value?.checkDate) return false
  const diff = item.value.checkDate - Date.now()
  return diff > 0 && diff < 30 * 86400000
})

const isReviewOverdue = computed(() => {
  if (!item.value?.needsPeriodicReview || !item.value?.reviewIntervalDays || !item.value?.lastReviewedAt) return false
  const nextReview = item.value.lastReviewedAt + item.value.reviewIntervalDays * 86400000
  return nextReview < Date.now()
})

const selectedFeedback = ref<FindFeedback | null>(null)
const feedbackNote = ref('')

const FEEDBACK_OPTIONS: { value: FindFeedback; icon: typeof CheckCircle2 }[] = [
  { value: 'found', icon: CheckCircle2 },
  { value: 'not-found', icon: XCircle },
  { value: 'unclear-location', icon: HelpCircle },
  { value: 'need-family-confirm', icon: Shield },
]

function formatDate(ts: number | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('zh-CN')
}

function submitFeedback() {
  if (!selectedFeedback.value || !item.value) return
  emergencyStore.setFindFeedback(item.value.id, selectedFeedback.value, feedbackNote.value)
  selectedFeedback.value = null
  feedbackNote.value = ''
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <button
        @click="emit('back')"
        class="flex items-center gap-2 rounded-xl px-4 py-2 text-base font-medium text-warm-700 transition-colors hover:bg-warm-100"
      >
        <ArrowLeft class="h-5 w-5" />
        返回
      </button>
      <h2 class="font-serif text-xl font-bold text-warm-900">物品详情</h2>
      <button
        v-if="item"
        @click="emit('edit', item.id)"
        class="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
      >
        <Edit class="h-4 w-4" />
        编辑
      </button>
      <div v-else class="w-[72px]" />
    </div>

    <div v-if="!item" class="rounded-2xl bg-white/60 p-10 text-center">
      <Package class="mx-auto mb-4 h-16 w-16 text-warm-300" />
      <p class="text-xl text-warm-500">物品不存在</p>
      <button
        @click="emit('back')"
        class="mt-6 flex items-center gap-2 rounded-full px-6 py-2.5 text-base font-semibold text-white mx-auto"
        style="background: #E8652B;"
      >
        <ArrowLeft class="h-5 w-5" />
        返回列表
      </button>
    </div>

    <div v-else class="space-y-4">
      <div class="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5 space-y-5">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-white"
              :style="{ backgroundColor: EMERGENCY_ITEM_TYPE_COLORS[item.type] }"
            >
              {{ EMERGENCY_ITEM_TYPE_LABELS[item.type] }}
            </span>
            <h3 class="font-serif text-2xl font-bold text-warm-900">{{ item.name }}</h3>
          </div>
        </div>

        <div v-if="item.location" class="flex items-start gap-2">
          <MapPin class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div>
            <p class="text-sm text-warm-500">存放位置</p>
            <p class="text-base text-warm-900">{{ item.location }}</p>
          </div>
        </div>

        <div v-if="item.findHint" class="flex items-start gap-2">
          <Eye class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div>
            <p class="text-sm text-warm-500">查找提示</p>
            <p class="text-base text-warm-900">{{ item.findHint }}</p>
          </div>
        </div>

        <div v-if="item.photoDescription" class="flex items-start gap-2">
          <Camera class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div>
            <p class="text-sm text-warm-500">物品照片描述</p>
            <p class="text-base text-warm-900">{{ item.photoDescription }}</p>
            <div class="mt-2 flex items-center justify-center rounded-xl border-2 border-dashed border-warm-200 bg-warm-50/50 h-32">
              <div class="text-center">
                <Camera class="mx-auto h-8 w-8 text-warm-300" />
                <p class="mt-1 text-xs text-warm-400">暂无照片</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="item.expiryDate || item.checkDate" class="flex items-start gap-2">
          <Calendar class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div class="flex-1 space-y-2">
            <div v-if="item.expiryDate">
              <p class="text-sm text-warm-500">有效期至</p>
              <div class="flex items-center gap-2">
                <p class="text-base text-warm-900">{{ formatDate(item.expiryDate) }}</p>
                <span
                  v-if="isExpired"
                  class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                >
                  <AlertTriangle class="h-3 w-3" />
                  已过期
                </span>
                <span
                  v-else-if="isNearExpiry"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600"
                >
                  <Clock class="h-3 w-3" />
                  即将过期
                </span>
              </div>
            </div>
            <div v-if="item.checkDate">
              <p class="text-sm text-warm-500">检查日期</p>
              <div class="flex items-center gap-2">
                <p class="text-base text-warm-900">{{ formatDate(item.checkDate) }}</p>
                <span
                  v-if="isCheckOverdue"
                  class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                >
                  <AlertTriangle class="h-3 w-3" />
                  已逾期
                </span>
                <span
                  v-else-if="isCheckNear"
                  class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600"
                >
                  <Clock class="h-3 w-3" />
                  即将到期
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 shrink-0 text-warm-500" />
          <span class="text-sm text-warm-500">紧急程度</span>
          <span
            class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-white"
            :style="{ backgroundColor: EMERGENCY_URGENCY_COLORS[item.urgency] }"
          >
            {{ EMERGENCY_URGENCY_LABELS[item.urgency] }}
          </span>
        </div>

        <div v-if="item.needsPeriodicReview" class="flex items-start gap-2">
          <RefreshCw class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2">
              <p class="text-sm text-warm-500">需要定期复查</p>
              <span
                v-if="isReviewOverdue"
                class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600"
              >
                <AlertTriangle class="h-3 w-3" />
                需要复查
              </span>
            </div>
            <p v-if="item.reviewIntervalDays" class="text-base text-warm-900">
              复查间隔：{{ item.reviewIntervalDays }} 天
            </p>
            <p v-if="item.lastReviewedAt" class="text-base text-warm-700">
              上次复查：{{ formatDate(item.lastReviewedAt) }}
            </p>
            <p v-else class="text-base text-warm-400">尚未复查</p>
          </div>
        </div>

        <div v-if="item.contactId" class="flex items-start gap-2">
          <User class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div>
            <p class="text-sm text-warm-500">相关联系人</p>
            <p v-if="contactExists" class="text-base text-warm-900">{{ item.contactName }}</p>
            <p v-else class="text-base text-warm-400 line-through">{{ item.contactName || '已删除' }}</p>
          </div>
        </div>

        <div v-if="item.packageId" class="flex items-start gap-2">
          <Package class="h-5 w-5 shrink-0 mt-0.5 text-warm-500" />
          <div>
            <p class="text-sm text-warm-500">所属资料包</p>
            <p v-if="packageExists" class="text-base text-warm-900">{{ item.packageName }}</p>
            <p v-else class="text-base text-warm-400 line-through">{{ item.packageName || '已删除' }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5 space-y-4">
        <div class="flex items-center gap-2">
          <MessageSquare class="h-5 w-5 text-warm-500" />
          <h4 class="font-bold text-warm-900">查找反馈</h4>
        </div>

        <div v-if="item.findFeedback" class="rounded-xl p-4 space-y-2" :style="{ backgroundColor: FIND_FEEDBACK_COLORS[item.findFeedback] + '15' }">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white"
              :style="{ backgroundColor: FIND_FEEDBACK_COLORS[item.findFeedback] }"
            >
              <component :is="FEEDBACK_OPTIONS.find(o => o.value === item.findFeedback)?.icon ?? CheckCircle2" class="h-3.5 w-3.5" />
              {{ FIND_FEEDBACK_LABELS[item.findFeedback] }}
            </span>
            <span v-if="item.feedbackAt" class="text-xs text-warm-500">{{ formatDate(item.feedbackAt) }}</span>
          </div>
          <p v-if="item.feedbackNote" class="text-sm text-warm-700">{{ item.feedbackNote }}</p>
        </div>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="opt in FEEDBACK_OPTIONS"
              :key="opt.value"
              @click="selectedFeedback = selectedFeedback === opt.value ? null : opt.value"
              class="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all border-2"
              :class="selectedFeedback === opt.value
                ? 'text-white shadow-md'
                : 'bg-white hover:bg-warm-50'"
              :style="selectedFeedback === opt.value
                ? { backgroundColor: FIND_FEEDBACK_COLORS[opt.value], borderColor: FIND_FEEDBACK_COLORS[opt.value] }
                : { borderColor: FIND_FEEDBACK_COLORS[opt.value] + '40', color: FIND_FEEDBACK_COLORS[opt.value] }"
            >
              <component :is="opt.icon" class="h-4 w-4" />
              {{ FIND_FEEDBACK_LABELS[opt.value] }}
            </button>
          </div>

          <textarea
            v-model="feedbackNote"
            placeholder="添加备注（可选）..."
            rows="3"
            class="w-full rounded-xl border border-warm-200 bg-white/70 p-3 text-base text-warm-900 placeholder:text-warm-400 focus:border-[#E8652B] focus:outline-none focus:ring-2 focus:ring-[#E8652B]/20 resize-none"
          />

          <button
            :disabled="!selectedFeedback"
            @click="submitFeedback"
            class="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors"
            :style="selectedFeedback
              ? { background: '#E8652B' }
              : { background: '#ccc', cursor: 'not-allowed' }"
            :class="selectedFeedback ? 'hover:bg-[#d45a24]' : ''"
          >
            <CheckCircle2 class="h-5 w-5" />
            提交反馈
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
