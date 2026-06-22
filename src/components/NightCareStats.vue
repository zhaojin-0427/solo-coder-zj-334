<script setup lang="ts">
import { computed } from 'vue'
import { useNightCarePlanStore, useNightCareSessionStore } from '@/stores'
import {
  BarChart3, Moon, Star, ListChecks, CheckCircle2, Clock,
  TrendingUp, AlertTriangle, Shield, Users, Eye, ChevronRight
} from 'lucide-vue-next'
import { NIGHT_CARE_FEEDBACK_LABELS, NIGHT_CARE_FEEDBACK_COLORS, NIGHT_CARE_DEFAULT_PLANS } from '@/types'
import type { NightCareFeedback } from '@/types'

const planStore = useNightCarePlanStore()
const sessionStore = useNightCareSessionStore()

const sevenDayCompletionRate = computed(() => {
  if (sessionStore.nightCareStats.totalSessions === 0) return 0
  const completed = sessionStore.nightCareStats.completedSessions
  return Math.round((completed / sessionStore.nightCareStats.totalSessions) * 100)
})

const abnormalFeedbackData = computed(() => {
  const entries = Object.entries(sessionStore.nightCareStats.abnormalStepDistribution) as [NightCareFeedback, number][]
  return entries.map(([key, value]) => ({
    key,
    label: NIGHT_CARE_FEEDBACK_LABELS[key],
    color: NIGHT_CARE_FEEDBACK_COLORS[key],
    count: value,
  }))
})

const totalAbnormalFeedbacks = computed(() => {
  return abnormalFeedbackData.value
    .filter(d => d.key !== 'confirmed')
    .reduce((sum, d) => sum + d.count, 0)
})

const planExecutionData = computed(() => {
  const entries = Object.entries(sessionStore.nightCareStats.planExecutionCounts) as [string, number][]
  return entries.map(([planId, count]) => {
    const plan = planStore.getPlanById(planId)
    const defaultPlan = NIGHT_CARE_DEFAULT_PLANS.find(p => 'ncp-' + p.id === planId)
    const colorMap: Record<string, string> = {
      'bedtime-check': '#7B68EE',
      'midnight-check': '#E8A838',
      'medicine-reminder': '#D94F4F',
      'safety-confirm': '#5C9460',
      'morning-visit': '#E8652B',
    }
    const color = plan ? colorMap[defaultPlan?.id || ''] || '#E8652B' : '#E8652B'
    return {
      key: planId,
      label: plan?.name || defaultPlan?.name || planId,
      color,
      count,
    }
  })
})

const maxPlanCount = computed(() => {
  return Math.max(...planExecutionData.value.map(d => d.count), 1)
})

const unconfirmedCount = computed(() => {
  let count = 0
  for (const h of sessionStore.history) {
    for (const step of h.steps) {
      if (!step.status || step.status === null || step.status === undefined || (step.status as any) === 'pending' || step.status !== 'confirmed') {
        if (step.status !== 'confirmed') count++
      }
    }
  }
  return count
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">夜间照护数据统计</h2>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-orange-50 p-6 border-2 border-[#E8652B]/20">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[#E8652B] flex items-center justify-center shrink-0">
          <BarChart3 class="h-7 w-7 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-warm-900">夜间照护概览</p>
          <p class="text-sm text-warm-600 mt-1">全面了解夜间照护的执行情况和异常数据</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <ListChecks class="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ sessionStore.nightCareStats.totalPlans }}</p>
        <p class="text-sm text-warm-500 mt-1">夜间计划数量</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 class="h-5 w-5 text-emerald-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ sevenDayCompletionRate }}%</p>
        <p class="text-sm text-warm-500 mt-1">近7天完成率</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle class="h-5 w-5 text-red-500" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ totalAbnormalFeedbacks }}</p>
        <p class="text-sm text-warm-500 mt-1">异常反馈总数</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock class="h-5 w-5 text-amber-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ unconfirmedCount }}</p>
        <p class="text-sm text-warm-500 mt-1">未确认项目数</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Shield class="h-5 w-5 text-[#E8652B]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ sessionStore.nightCareStats.keyPointCompletionRate }}%</p>
        <p class="text-sm text-warm-500 mt-1">高风险项处理率</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <ListChecks class="h-5 w-5 text-indigo-600" />
          各计划执行次数
        </h3>

        <div v-if="planExecutionData.length === 0" class="text-center py-6">
          <Moon class="mx-auto mb-2 h-8 w-8 text-warm-300" />
          <p class="text-warm-400">暂无执行数据</p>
          <p class="text-sm text-warm-300 mt-1">老人使用"今晚照护"后，执行次数会在这里展示</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="planItem in planExecutionData"
            :key="planItem.key"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full"
                  :style="{ backgroundColor: planItem.color }"
                />
                <span class="text-sm font-medium text-warm-700">{{ planItem.label }}</span>
              </div>
              <span class="text-sm font-bold text-warm-600">{{ planItem.count }} 次</span>
            </div>
            <div class="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :style="{
                  width: `${(planItem.count / maxPlanCount) * 100}%`,
                  backgroundColor: planItem.color,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-[#D94F4F]" />
          异常反馈类型分布
        </h3>

        <div v-if="totalAbnormalFeedbacks === 0 && sessionStore.nightCareStats.abnormalStepDistribution.confirmed === 0" class="text-center py-6">
          <CheckCircle2 class="mx-auto mb-2 h-8 w-8 text-warm-300" />
          <p class="text-warm-400">暂无反馈数据</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <div
            v-for="fb in abnormalFeedbackData"
            :key="fb.key"
            class="rounded-xl p-4 text-center"
            :style="{ backgroundColor: fb.color + '10' }"
          >
            <p class="text-2xl font-bold" :style="{ color: fb.color }">{{ fb.count }}</p>
            <p class="text-sm text-warm-600 mt-1">{{ fb.label }}</p>
            <p
              v-if="fb.count > 0 && (totalAbnormalFeedbacks + sessionStore.nightCareStats.abnormalStepDistribution.confirmed) > 0"
              class="text-xs text-warm-400 mt-0.5"
            >
              {{ Math.round((fb.count / (totalAbnormalFeedbacks + sessionStore.nightCareStats.abnormalStepDistribution.confirmed)) * 100) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <TrendingUp class="h-5 w-5 text-[#E8652B]" />
          完成率概览
        </h3>

        <div class="flex items-center justify-center py-4">
          <div class="relative w-32 h-32">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                stroke="#F0E0D0"
                stroke-width="12"
                fill="none"
              />
              <circle
                cx="50" cy="50" r="40"
                stroke="#E8652B"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                :stroke-dasharray="`${sevenDayCompletionRate * 2.512} 251.2`"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-2xl font-bold text-warm-900">{{ sevenDayCompletionRate }}%</p>
              <p class="text-xs text-warm-500">完成率</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-warm-100">
          <div class="text-center">
            <p class="text-xl font-bold text-warm-800">{{ sessionStore.nightCareStats.totalSessions }}</p>
            <p class="text-xs text-warm-500">总执行次数</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold text-[#E8652B]">{{ sessionStore.nightCareStats.completedSessions }}</p>
            <p class="text-xs text-warm-500">已完成</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <Users class="h-5 w-5 text-[#5B9BD5]" />
          需要家人处理统计
        </h3>

        <div class="flex items-center justify-center py-4">
          <div class="relative w-32 h-32">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                stroke="#F0E0D0"
                stroke-width="12"
                fill="none"
              />
              <circle
                cx="50" cy="50" r="40"
                stroke="#5B9BD5"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                :stroke-dasharray="sessionStore.nightCareStats.totalSessions > 0
                  ? `${(sessionStore.nightCareStats.familyHandlingCount / Math.max(sessionStore.nightCareStats.totalSessions, 1)) * 251.2} 251.2`
                  : '0 251.2'"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-2xl font-bold text-warm-900">{{ sessionStore.nightCareStats.familyHandlingCount }}</p>
              <p class="text-xs text-warm-500">次家人介入</p>
            </div>
          </div>
        </div>

        <p class="text-sm text-warm-500 text-center">
          共有 {{ sessionStore.nightCareStats.familyHandlingCount }} 次需要家人协助处理
        </p>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-sage-50 to-green-50 p-5 border border-sage-200">
      <div class="flex items-start gap-3">
        <TrendingUp class="h-6 w-6 text-sage-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-base font-bold text-sage-700">夜间照护建议</p>
          <ul class="text-sm text-sage-600 mt-2 space-y-1.5">
            <li v-if="sessionStore.nightCareStats.totalPlans < 3">
              💡 建议至少设置 3 个不同时段的夜间照护计划，覆盖睡前、起夜和清晨
            </li>
            <li v-if="sevenDayCompletionRate < 70 && sessionStore.nightCareStats.totalSessions > 0">
              ⏰ 近期完成率较低，建议简化检查项目，让老人更容易坚持
            </li>
            <li v-if="sessionStore.nightCareStats.abnormalStepDistribution['need-family'] > 2">
              👨‍👩‍👧 有多次需要家人处理的情况，建议优化检查项或增加老人的协助工具
            </li>
            <li v-if="sessionStore.nightCareStats.abnormalStepDistribution['remind-later'] > 5">
              🔔 "稍后提醒"次数较多，建议将提醒时间调整到更合适的时段
            </li>
            <li v-if="sessionStore.nightCareStats.keyPointCompletionRate < 80 && sessionStore.nightCareStats.totalSessions > 0">
              ⚠️ 高风险检查项完成率偏低，建议重点关注这些项目的可执行性
            </li>
            <li v-if="sessionStore.nightCareStats.abnormalStepDistribution['not-clear'] > 3">
              👁️ 老人多次反馈"没看清"，建议增大字号或提供更好的照明
            </li>
            <li
              v-if="sessionStore.nightCareStats.totalPlans >= 3
                && sevenDayCompletionRate >= 80
                && sessionStore.nightCareStats.keyPointCompletionRate >= 90
                && sessionStore.nightCareStats.totalSessions > 5"
            >
              👍 您的夜间照护体系已经很完善了，继续保持！
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
