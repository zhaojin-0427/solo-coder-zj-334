<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmergencyStore } from '@/stores'
import type { EmergencyItemType } from '@/types'
import { EMERGENCY_ITEM_TYPE_LABELS, EMERGENCY_ITEM_TYPE_COLORS, EMERGENCY_URGENCY_LABELS, EMERGENCY_URGENCY_COLORS, FIND_FEEDBACK_LABELS, FIND_FEEDBACK_COLORS } from '@/types'
import { Search, Filter, Plus, MapPin, AlertTriangle, Clock, ChevronRight, Package, Eye, Edit, Trash2, HeartPulse, CreditCard, Shield, Car, Wrench, Box } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'view', id: string): void
  (e: 'edit', id: string): void
}>()

const emergencyStore = useEmergencyStore()

const searchQuery = ref('')
const activeType = ref<EmergencyItemType | 'all'>('all')
const sortBy = ref<'urgency' | 'name' | 'expiry' | 'update'>('urgency')
const showDeleteConfirm = ref<string | null>(null)

const TYPE_ICONS: Record<EmergencyItemType, typeof HeartPulse> = {
  medical: HeartPulse,
  id: CreditCard,
  'home-safety': Shield,
  travel: Car,
  repair: Wrench,
  other: Box,
}

const typeOptions: { value: EmergencyItemType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  ...Object.entries(EMERGENCY_ITEM_TYPE_LABELS).map(([key, label]) => ({
    value: key as EmergencyItemType,
    label,
  })),
]

const sortOptions: { value: typeof sortBy.value; label: string }[] = [
  { value: 'urgency', label: '按紧急程度' },
  { value: 'name', label: '按名称' },
  { value: 'expiry', label: '按到期日' },
  { value: 'update', label: '按更新时间' },
]

const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

const filteredItems = computed(() => {
  let result = [...emergencyStore.items]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    result = result.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.findHint.toLowerCase().includes(q),
    )
  }

  if (activeType.value !== 'all') {
    result = result.filter(item => item.type === activeType.value)
  }

  return result
})

const sortedItems = computed(() => {
  const items = [...filteredItems.value]
  switch (sortBy.value) {
    case 'urgency':
      items.sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
      break
    case 'name':
      items.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
      break
    case 'expiry':
      items.sort((a, b) => {
        const aDate = a.expiryDate ?? a.checkDate ?? Infinity
        const bDate = b.expiryDate ?? b.checkDate ?? Infinity
        return aDate - bDate
      })
      break
    case 'update':
      items.sort((a, b) => b.updatedAt - a.updatedAt)
      break
  }
  return items
})

function isExpiringSoon(item: { expiryDate: number | null; checkDate: number | null }): boolean {
  const now = Date.now()
  const threshold = 30 * 86400000
  if (item.expiryDate && item.expiryDate - now < threshold) return true
  if (item.checkDate && item.checkDate - now < threshold) return true
  return false
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN')
}

function handleDelete(id: string) {
  emergencyStore.deleteItem(id)
  showDeleteConfirm.value = null
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">应急物品索引</h2>
      <button
        class="flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
        style="background: #E8652B;"
        @click="emit('edit', '')"
      >
        <Plus class="h-5 w-5" />
        添加物品
      </button>
    </div>

    <div class="relative">
      <Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-400" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索物品名称、位置或提示..."
        class="w-full rounded-2xl border border-warm-200 bg-white/70 py-3 pl-12 pr-4 text-base text-warm-900 placeholder:text-warm-400 focus:border-[#E8652B] focus:outline-none focus:ring-2 focus:ring-[#E8652B]/20"
      />
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <Filter class="h-4 w-4 shrink-0 text-warm-400" />
      <button
        v-for="opt in typeOptions"
        :key="opt.value"
        @click="activeType = opt.value"
        class="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
        :class="activeType === opt.value
          ? 'text-white shadow-md'
          : 'bg-warm-50 text-warm-700 hover:bg-warm-100'"
        :style="activeType === opt.value
          ? opt.value === 'all'
            ? 'background: #E8652B'
            : `background: ${EMERGENCY_ITEM_TYPE_COLORS[opt.value as EmergencyItemType]}`
          : ''"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-sm text-warm-500 shrink-0">排序：</span>
      <button
        v-for="opt in sortOptions"
        :key="opt.value"
        @click="sortBy = opt.value"
        class="rounded-lg px-3 py-1.5 text-sm transition-all"
        :class="sortBy === opt.value
          ? 'bg-warm-800 text-white shadow-sm'
          : 'bg-warm-50 text-warm-600 hover:bg-warm-100'"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="sortedItems.length === 0" class="rounded-2xl bg-white/60 px-5 py-10 text-center">
      <Package class="mx-auto mb-3 h-12 w-12 text-warm-300" />
      <p class="text-lg text-warm-400">暂无应急物品</p>
      <p class="text-sm text-warm-300 mt-1">点击上方"添加物品"开始录入</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in sortedItems"
        :key="item.id"
        class="group rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden transition-all hover:shadow-md hover:bg-white"
      >
        <div class="flex items-stretch">
          <div
            class="w-1.5 shrink-0"
            :style="{ backgroundColor: EMERGENCY_ITEM_TYPE_COLORS[item.type] }"
          />
          <div class="flex-1 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    :style="{ backgroundColor: EMERGENCY_ITEM_TYPE_COLORS[item.type] }"
                  >
                    <component :is="TYPE_ICONS[item.type]" class="h-3 w-3" />
                    {{ EMERGENCY_ITEM_TYPE_LABELS[item.type] }}
                  </span>
                  <h3 class="text-lg font-bold text-warm-900">{{ item.name }}</h3>
                </div>

                <div v-if="item.location" class="flex items-center gap-1.5 mt-2 text-sm text-warm-600">
                  <MapPin class="h-3.5 w-3.5 shrink-0" />
                  <span>{{ item.location }}</span>
                </div>

                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    :style="{ backgroundColor: EMERGENCY_URGENCY_COLORS[item.urgency] }"
                  >
                    <AlertTriangle class="h-3 w-3" />
                    {{ EMERGENCY_URGENCY_LABELS[item.urgency] }}
                  </span>

                  <span
                    v-if="isExpiringSoon(item)"
                    class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                  >
                    <Clock class="h-3 w-3" />
                    即将到期
                  </span>

                  <span
                    v-if="item.findFeedback"
                    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :style="{
                      backgroundColor: FIND_FEEDBACK_COLORS[item.findFeedback] + '20',
                      color: FIND_FEEDBACK_COLORS[item.findFeedback],
                    }"
                  >
                    {{ FIND_FEEDBACK_LABELS[item.findFeedback] }}
                  </span>
                </div>

                <p class="text-xs text-warm-400 mt-2">
                  更新于 {{ formatDate(item.updatedAt) }}
                </p>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="emit('view', item.id)"
                  class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d45a24]"
                  style="background: #E8652B;"
                >
                  <Eye class="h-4 w-4" />
                  <span class="hidden sm:inline">查看</span>
                </button>
                <button
                  @click="emit('edit', item.id)"
                  class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
                >
                  <Edit class="h-4 w-4" />
                  <span class="hidden sm:inline">编辑</span>
                </button>
                <button
                  @click="showDeleteConfirm = showDeleteConfirm === item.id ? null : item.id"
                  class="rounded-xl p-2 text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showDeleteConfirm === item.id" class="px-4 pb-4">
          <div class="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
            <span class="text-sm text-red-600">确定删除"{{ item.name }}"吗？</span>
            <div class="flex items-center gap-2">
              <button
                @click="showDeleteConfirm = null"
                class="text-sm text-warm-500 hover:text-warm-700"
              >
                取消
              </button>
              <button
                @click="handleDelete(item.id)"
                class="text-sm font-semibold text-red-500 hover:text-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-warm-100">
      <p class="text-sm text-warm-400 text-center">
        共 {{ emergencyStore.items.length }} 件物品，当前显示 {{ sortedItems.length }} 件
      </p>
    </div>
  </div>
</template>
