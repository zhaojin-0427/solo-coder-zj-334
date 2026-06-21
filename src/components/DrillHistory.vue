<script setup lang="ts">
import { useDrillStore } from '@/stores'
import { CONTACT_RESULT_LABELS, CONTACT_RESULT_COLORS } from '@/types'
import { ref } from 'vue'
import {
  Trash2, X, Clock, AlertCircle, CheckCircle2, PhoneOff, AlertTriangle, PhoneCall,
} from 'lucide-vue-next'

const drillStore = useDrillStore()

const expandedId = ref<string | null>(null)

function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleString('zh-CN')
}

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (min > 0) return `${min}分${sec}秒`
  return `${sec}秒`
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

const RESULT_ICON_MAP: Record<string, typeof CheckCircle2> = {
  'connected': PhoneCall,
  'no-answer': PhoneOff,
  'wrong-number': AlertTriangle,
  'call-later': Clock,
  'help-done': CheckCircle2,
}
</script>

<template>
  <div class="space-y-5">
    <div v-if="drillStore.history.length === 0" class="text-center py-10">
      <Clock class="mx-auto mb-3 h-10 w-10 text-warm-300" />
      <p class="text-lg text-warm-400">暂无演练记录</p>
      <p class="text-sm text-warm-300 mt-1">完成一次演练后，记录将保存在这里</p>
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-warm-700">共 {{ drillStore.history.length }} 条记录（最多保留10条）</span>
        <button
          @click="drillStore.clearAllHistory()"
          class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-red-500 border border-red-200 bg-white hover:bg-red-50 transition-colors"
        >
          <Trash2 class="h-4 w-4" />
          清空全部
        </button>
      </div>

      <div
        v-for="record in drillStore.history"
        :key="record.id"
        class="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
      >
        <button
          @click="toggleExpand(record.id)"
          class="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/50 transition-colors"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E6] text-[#E8652B]">
            <AlertCircle class="h-5 w-5" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-base font-bold text-warm-900 truncate">{{ record.scenarioName }}</p>
            <p class="text-sm text-warm-400">{{ formatTimestamp(record.startedAt) }} · {{ formatDuration(record.elapsedSeconds) }}</p>
          </div>
          <X
            v-if="expandedId === record.id"
            class="h-5 w-5 text-warm-400 shrink-0"
          />
          <CheckCircle2
            v-else
            class="h-5 w-5 text-warm-300 shrink-0"
          />
        </button>

        <div v-if="expandedId === record.id" class="px-5 pb-4 space-y-3 border-t border-warm-100">
          <div class="pt-3 space-y-2">
            <div
              v-for="(attempt, idx) in record.attempts"
              :key="idx"
              class="rounded-xl bg-warm-50 px-4 py-2.5 space-y-1"
            >
              <div class="flex items-center gap-2">
                <component
                  :is="RESULT_ICON_MAP[attempt.result ?? 'connected']"
                  class="h-4 w-4 shrink-0"
                  :style="{ color: attempt.result ? CONTACT_RESULT_COLORS[attempt.result] : '#999' }"
                />
                <span class="text-sm font-semibold text-warm-800">{{ attempt.contactName }}</span>
                <span
                  class="rounded px-1.5 py-0.5 text-xs font-bold text-white"
                  :style="{ backgroundColor: attempt.result ? CONTACT_RESULT_COLORS[attempt.result] : '#999' }"
                >
                  {{ attempt.result ? CONTACT_RESULT_LABELS[attempt.result] : '' }}
                </span>
              </div>
              <div class="text-xs text-warm-400">{{ attempt.contactPhone }}</div>
              <div v-if="attempt.note" class="text-xs text-warm-400">备注：{{ attempt.note }}</div>
            </div>
          </div>

          <div class="rounded-xl bg-[#FFF8F0] px-4 py-3">
            <pre class="text-sm text-warm-700 whitespace-pre-wrap font-sans">{{ record.summary }}</pre>
          </div>

          <div class="flex justify-end">
            <button
              @click="drillStore.deleteHistoryRecord(record.id)"
              class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-red-500 border border-red-200 bg-white hover:bg-red-50 transition-colors"
            >
              <Trash2 class="h-4 w-4" />
              删除此记录
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
