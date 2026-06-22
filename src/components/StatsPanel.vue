<script setup lang="ts">
import { computed } from 'vue'
import { useStatsStore, useLeavingSessionStore, useNightCareSessionStore } from '@/stores'
import { GROUP_LABELS, GROUP_COLORS, EMERGENCY_ITEM_TYPE_LABELS, EMERGENCY_ITEM_TYPE_COLORS, FIND_FEEDBACK_LABELS, FIND_FEEDBACK_COLORS, LEAVING_SCENE_LABELS, LEAVING_SCENE_COLORS, CHECKLIST_STEP_STATUS_LABELS, CHECKLIST_STEP_STATUS_COLORS, RETURN_CONFIRM_LABELS, RETURN_CONFIRM_COLORS, NIGHT_CARE_FEEDBACK_LABELS, NIGHT_CARE_FEEDBACK_COLORS } from '@/types'
import type { EmergencyItemType, FindFeedback, LeavingChecklistScene, ChecklistStepStatus, ReturnConfirmType, NightCareFeedback } from '@/types'
import {
  BarChart3, Users, Star, Package, Play, CheckCircle2, Clock,
  TrendingUp, Award, Heart, Phone, UserPlus, MapPin, AlertTriangle, Shield,
  ClipboardList, LogOut, Home, AlertCircle, ListChecks, HelpCircle, ArrowLeftRight,
  Moon
} from 'lucide-vue-next'

const statsStore = useStatsStore()
const leavingSessionStore = useLeavingSessionStore()
const nightCareSessionStore = useNightCareSessionStore()

const groupData = computed(() => {
  const entries = Object.entries(statsStore.stats.groupCounts) as [string, number][]
  return entries.map(([key, value]) => ({
    key,
    label: GROUP_LABELS[key as keyof typeof GROUP_LABELS],
    color: GROUP_COLORS[key as keyof typeof GROUP_COLORS],
    count: value,
    percent: statsStore.stats.totalContacts > 0
      ? Math.round((value / statsStore.stats.totalContacts) * 100)
      : 0,
  }))
})

const maxGroupCount = computed(() => {
  return Math.max(...groupData.value.map(g => g.count), 1)
})

const completionRate = computed(() => {
  if (statsStore.stats.totalFollowUps === 0) return 0
  return Math.round((statsStore.stats.completedFollowUps / statsStore.stats.totalFollowUps) * 100)
})

const emergencyItemTypeData = computed(() => {
  const entries = Object.entries(statsStore.stats.emergencyItemTypeCounts) as [EmergencyItemType, number][]
  return entries.map(([key, value]) => ({
    key,
    label: EMERGENCY_ITEM_TYPE_LABELS[key],
    color: EMERGENCY_ITEM_TYPE_COLORS[key],
    count: value,
  })).filter(d => d.count > 0)
})

const maxTypeCount = computed(() => {
  return Math.max(...emergencyItemTypeData.value.map(d => d.count), 1)
})

const feedbackData = computed(() => {
  const entries = Object.entries(statsStore.stats.feedbackDistribution) as [FindFeedback, number][]
  return entries.map(([key, value]) => ({
    key,
    label: FIND_FEEDBACK_LABELS[key],
    color: FIND_FEEDBACK_COLORS[key],
    count: value,
  }))
})

const totalFeedback = computed(() => {
  return feedbackData.value.reduce((sum, d) => sum + d.count, 0)
})

const sceneExecutionData = computed(() => {
  const entries = Object.entries(leavingSessionStore.checklistStats.sceneExecutionCounts) as [LeavingChecklistScene, number][]
  return entries.map(([key, value]) => ({
    key,
    label: LEAVING_SCENE_LABELS[key],
    color: LEAVING_SCENE_COLORS[key],
    count: value,
  })).filter(d => d.count > 0)
})

const maxSceneCount = computed(() => {
  return Math.max(...sceneExecutionData.value.map(d => d.count), 1)
})

const abnormalStepData = computed(() => {
  const entries = Object.entries(leavingSessionStore.checklistStats.abnormalStepDistribution) as [ChecklistStepStatus, number][]
  return entries.map(([key, value]) => ({
    key,
    label: CHECKLIST_STEP_STATUS_LABELS[key],
    color: CHECKLIST_STEP_STATUS_COLORS[key],
    count: value,
  }))
})

const totalAbnormalSteps = computed(() => {
  return abnormalStepData.value.reduce((sum, d) => sum + d.count, 0)
})

const returnConfirmData = computed(() => {
  const entries = Object.entries(leavingSessionStore.checklistStats.returnConfirmRatio) as [ReturnConfirmType, number][]
  return entries.map(([key, value]) => ({
    key,
    label: RETURN_CONFIRM_LABELS[key],
    color: RETURN_CONFIRM_COLORS[key],
    count: value,
  }))
})

const totalReturnConfirms = computed(() => {
  return returnConfirmData.value.reduce((sum, d) => sum + d.count, 0)
})

const nightCareStats = computed(() => nightCareSessionStore.stats)

const nightCareCompletionRate = computed(() => {
  if (nightCareStats.value.totalSessions === 0) return 0
  return Math.round((nightCareStats.value.completedSessions / nightCareStats.value.totalSessions * 100)
})

const nightCareAbnormalData = computed(() => {
  const entries = Object.entries(nightCareStats.value.abnormalStepDistribution) as [NightCareFeedback, number][]
  return entries.map(([key, value]) => ({
    key,
    label: NIGHT_CARE_FEEDBACK_LABELS[key],
    color: NIGHT_CARE_FEEDBACK_COLORS[key],
    count: value,
  }))
})

const totalNightCareAbnormal = computed(() => {
  return nightCareAbnormalData.value.reduce((sum, d) => sum + d.count, 0)
})

const nightCarePlanExecutionData = computed(() => {
  const entries = Object.entries(nightCareStats.value.planExecutionCounts) as [string, number][]
  return entries.map(([key, value]) => ({
    key,
    label: key,
    count: value,
  })).filter(d => d.count > 0)
})

const maxNightCarePlanCount = computed(() => {
  return Math.max(...nightCarePlanExecutionData.value.map(d => d.count), 1)
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">数据统计</h2>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-6 border-2 border-[#E8652B]/20">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[#E8652B] flex items-center justify-center shrink-0">
          <BarChart3 class="h-7 w-7 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-warm-900">数据概览</p>
          <p class="text-sm text-warm-600 mt-1">全面了解您的电话本使用情况</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Users class="h-5 w-5 text-[#E8652B]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ statsStore.stats.totalContacts }}</p>
        <p class="text-sm text-warm-500 mt-1">联系人总数</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Star class="h-5 w-5 text-red-500 fill-red-500" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ statsStore.stats.emergencyContacts }}</p>
        <p class="text-sm text-warm-500 mt-1">紧急联系人</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Package class="h-5 w-5 text-[#5C9460]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ statsStore.stats.totalPackages }}</p>
        <p class="text-sm text-warm-500 mt-1">资料包数量</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <MapPin class="h-5 w-5 text-[#5B9BD5]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ statsStore.stats.totalEmergencyItems }}</p>
        <p class="text-sm text-warm-500 mt-1">应急物品</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Play class="h-5 w-5 text-[#9B6DB7]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ statsStore.stats.totalDrills }}</p>
        <p class="text-sm text-warm-500 mt-1">演练次数</p>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6 border-2 border-indigo-200">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0">
          <ClipboardList class="h-7 w-7 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-warm-900">离家清单统计</p>
          <p class="text-sm text-warm-600 mt-1">查看离家清单的使用情况和执行数据</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <ClipboardList class="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ leavingSessionStore.checklistStats.totalChecklists }}</p>
        <p class="text-sm text-warm-500 mt-1">清单数量</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <LogOut class="h-5 w-5 text-[#E8652B]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ leavingSessionStore.checklistStats.totalSessions }}</p>
        <p class="text-sm text-warm-500 mt-1">离家次数</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Home class="h-5 w-5 text-[#5C9460]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ leavingSessionStore.checklistStats.totalReturnConfirms }}</p>
        <p class="text-sm text-warm-500 mt-1">回家确认次数</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Shield class="h-5 w-5 text-[#E8A838]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ leavingSessionStore.checklistStats.highRiskStepCompletionRate }}%</p>
        <p class="text-sm text-warm-500 mt-1">高风险步骤完成率</p>
      </div>
    </div>

    <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
        <ListChecks class="h-5 w-5 text-indigo-600" />
        各场景执行次数分布
      </h3>

      <div v-if="sceneExecutionData.length === 0" class="text-center py-6">
        <ClipboardList class="mx-auto mb-2 h-8 w-8 text-warm-300" />
        <p class="text-warm-400">暂无离家执行数据</p>
        <p class="text-sm text-warm-300 mt-1">使用离家清单后，执行次数会在这里展示</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="sceneItem in sceneExecutionData"
          :key="sceneItem.key"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: sceneItem.color }"
              />
              <span class="text-sm font-medium text-warm-700">{{ sceneItem.label }}</span>
            </div>
            <span class="text-sm font-bold text-warm-600">{{ sceneItem.count }} 次</span>
          </div>
          <div class="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: `${(sceneItem.count / maxSceneCount) * 100}%`,
                backgroundColor: sceneItem.color,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <AlertCircle class="h-5 w-5 text-[#D94F4F]" />
          异常步骤分布
        </h3>

        <div v-if="totalAbnormalSteps === 0" class="text-center py-6">
          <HelpCircle class="mx-auto mb-2 h-8 w-8 text-warm-300" />
          <p class="text-warm-400">暂无步骤执行数据</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <div
            v-for="step in abnormalStepData"
            :key="step.key"
            class="rounded-xl p-4 text-center"
            :style="{ backgroundColor: step.color + '10' }"
          >
            <p class="text-2xl font-bold" :style="{ color: step.color }">{{ step.count }}</p>
            <p class="text-sm text-warm-600 mt-1">{{ step.label }}</p>
            <p v-if="totalAbnormalSteps > 0" class="text-xs text-warm-400 mt-0.5">
              {{ Math.round((step.count / totalAbnormalSteps) * 100) }}%
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <ArrowLeftRight class="h-5 w-5 text-[#5C9460]" />
          返回确认比例
        </h3>

        <div v-if="totalReturnConfirms === 0" class="text-center py-6">
          <Home class="mx-auto mb-2 h-8 w-8 text-warm-300" />
          <p class="text-warm-400">暂无回家确认数据</p>
        </div>

        <div v-else class="grid grid-cols-3 gap-3">
          <div
            v-for="rc in returnConfirmData"
            :key="rc.key"
            class="rounded-xl p-4 text-center"
            :style="{ backgroundColor: rc.color + '10' }"
          >
            <p class="text-2xl font-bold" :style="{ color: rc.color }">{{ rc.count }}</p>
            <p class="text-sm text-warm-600 mt-1">{{ rc.label }}</p>
            <p v-if="totalReturnConfirms > 0" class="text-xs text-warm-400 mt-0.5">
              {{ Math.round((rc.count / totalReturnConfirms) * 100) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-6 border-2 border-purple-200">
      <div class="flex items-start gap-4">
        <div class="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shrink-0">
          <Moon class="h-7 w-7 text-white" />
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-warm-900">夜间照护统计</p>
          <p class="text-sm text-warm-600 mt-1">查看夜间照护计划的执行情况和异常数据</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Moon class="h-5 w-5 text-purple-600" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ nightCareStats.totalPlans }}</p>
        <p class="text-sm text-warm-500 mt-1">夜间计划数量</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 class="h-5 w-5 text-[#5C9460]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ nightCareCompletionRate }}%</p>
        <p class="text-sm text-warm-500 mt-1">近7天完成率</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertCircle class="h-5 w-5 text-[#D94F4F]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ nightCareStats.totalAbnormal }}</p>
        <p class="text-sm text-warm-500 mt-1">异常反馈总数</p>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Shield class="h-5 w-5 text-[#E8A838]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ nightCareStats.keyPointCompletionRate }}%</p>
        <p class="text-sm text-warm-500 mt-1">高风险项处理率</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <Moon class="h-5 w-5 text-purple-600" />
          各计划执行次数
        </h3>

        <div v-if="nightCarePlanExecutionData.length === 0" class="text-center py-6">
          <Moon class="mx-auto mb-2 h-8 w-8 text-warm-300" />
          <p class="text-warm-400">暂无夜间照护执行数据</p>
          <p class="text-sm text-warm-300 mt-1">开始夜间照护后，执行次数会在这里展示</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="planItem in nightCarePlanExecutionData"
            :key="planItem.key"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="w-3 h-3 rounded-full bg-purple-500"
                />
                <span class="text-sm font-medium text-warm-700 truncate max-w-[180px]">{{ planItem.label }}</span>
              </div>
              <span class="text-sm font-bold text-warm-600">{{ planItem.count }} 次</span>
            </div>
            <div class="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 bg-purple-500"
                :style="{
                  width: `${(planItem.count / maxNightCarePlanCount) * 100}%`,
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <AlertCircle class="h-5 w-5 text-[#D94F4F]" />
          异常反馈类型分布
        </h3>

        <div v-if="totalNightCareAbnormal === 0" class="text-center py-6">
          <HelpCircle class="mx-auto mb-2 h-8 w-8 text-warm-300" />
          <p class="text-warm-400">暂无异常反馈数据</p>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <div
            v-for="fb in nightCareAbnormalData"
            :key="fb.key"
            class="rounded-xl p-4 text-center"
            :style="{ backgroundColor: fb.color + '10' }"
          >
            <p class="text-2xl font-bold" :style="{ color: fb.color }">{{ fb.count }}</p>
            <p class="text-sm text-warm-600 mt-1">{{ fb.label }}</p>
            <p v-if="totalNightCareAbnormal > 0" class="text-xs text-warm-400 mt-0.5">
              {{ Math.round((fb.count / totalNightCareAbnormal) * 100) }}%
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
        <MapPin class="h-5 w-5 text-[#E8652B]" />
        应急物品类型分布
      </h3>

      <div v-if="emergencyItemTypeData.length === 0" class="text-center py-6">
        <MapPin class="mx-auto mb-2 h-8 w-8 text-warm-300" />
        <p class="text-warm-400">暂无应急物品数据</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="typeItem in emergencyItemTypeData"
          :key="typeItem.key"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: typeItem.color }"
              />
              <span class="text-sm font-medium text-warm-700">{{ typeItem.label }}</span>
            </div>
            <span class="text-sm font-bold text-warm-600">{{ typeItem.count }} 件</span>
          </div>
          <div class="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: `${(typeItem.count / maxTypeCount) * 100}%`,
                backgroundColor: typeItem.color,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <AlertTriangle class="h-5 w-5 text-[#D94F4F]" />
          过期与复查提醒
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
                stroke="#D94F4F"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                :stroke-dasharray="statsStore.stats.totalEmergencyItems > 0
                  ? `${(statsStore.stats.expiringOrReviewCount / statsStore.stats.totalEmergencyItems) * 251.2} 251.2`
                  : '0 251.2'"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-2xl font-bold text-warm-900">{{ statsStore.stats.expiringOrReviewCount }}</p>
              <p class="text-xs text-warm-500">需关注</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-warm-100">
          <div class="text-center">
            <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.totalEmergencyItems }}</p>
            <p class="text-xs text-warm-500">物品总数</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold text-[#D94F4F]">{{ statsStore.stats.expiringOrReviewCount }}</p>
            <p class="text-xs text-warm-500">即将过期/需复查</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <Shield class="h-5 w-5 text-[#E8A838]" />
          高紧急物品覆盖率
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
                stroke="#E8A838"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                :stroke-dasharray="`${statsStore.stats.highUrgencyCoverage * 2.512} 251.2`"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-2xl font-bold text-warm-900">{{ statsStore.stats.highUrgencyCoverage }}%</p>
              <p class="text-xs text-warm-500">覆盖率</p>
            </div>
          </div>
        </div>

        <p class="text-sm text-warm-500 text-center">
          高紧急物品中有 {{ statsStore.stats.highUrgencyCoverage }}% 已有查找反馈
        </p>
      </div>
    </div>

    <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
        <UserPlus class="h-5 w-5 text-[#E8652B]" />
        老人查找反馈分布
      </h3>

      <div v-if="totalFeedback === 0" class="text-center py-6">
        <CheckCircle2 class="mx-auto mb-2 h-8 w-8 text-warm-300" />
        <p class="text-warm-400">暂无查找反馈数据</p>
        <p class="text-sm text-warm-300 mt-1">老人使用"我要找东西"后反馈会在这里展示</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="fb in feedbackData"
          :key="fb.key"
          class="rounded-xl p-4 text-center"
          :style="{ backgroundColor: fb.color + '10' }"
        >
          <p class="text-2xl font-bold" :style="{ color: fb.color }">{{ fb.count }}</p>
          <p class="text-sm text-warm-600 mt-1">{{ fb.label }}</p>
          <p v-if="totalFeedback > 0" class="text-xs text-warm-400 mt-0.5">
            {{ Math.round((fb.count / totalFeedback) * 100) }}%
          </p>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
        <UserPlus class="h-5 w-5 text-[#E8652B]" />
        联系人分组统计
      </h3>

      <div class="space-y-3">
        <div
          v-for="group in groupData"
          :key="group.key"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: group.color }"
              />
              <span class="text-sm font-medium text-warm-700">{{ group.label }}</span>
            </div>
            <span class="text-sm font-bold text-warm-600">{{ group.count }} 人</span>
          </div>
          <div class="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :style="{
                width: `${(group.count / maxGroupCount) * 100}%`,
                backgroundColor: group.color,
              }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <Package class="h-5 w-5 text-[#7BAE7F]" />
          资料包概览
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
                :stroke-dasharray="statsStore.stats.totalPackages > 0
                  ? `${(statsStore.stats.highlightedPackages / statsStore.stats.totalPackages) * 251.2} 251.2`
                  : '0 251.2'"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-2xl font-bold text-warm-900">{{ statsStore.stats.highlightedPackages }}</p>
              <p class="text-xs text-warm-500">重点资料包</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-warm-100">
          <div class="text-center">
            <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.totalPackages }}</p>
            <p class="text-xs text-warm-500">总资料包</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold text-[#E8652B]">{{ statsStore.stats.highlightedPackages }}</p>
            <p class="text-xs text-warm-500">重点标记</p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 text-[#5C9460]" />
          待办完成情况
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
                stroke="#5C9460"
                stroke-width="12"
                fill="none"
                stroke-linecap="round"
                :stroke-dasharray="statsStore.stats.totalFollowUps > 0
                  ? `${completionRate * 2.512} 251.2`
                  : '0 251.2'"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <p class="text-2xl font-bold text-warm-900">{{ completionRate }}%</p>
              <p class="text-xs text-warm-500">完成率</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2 pt-3 border-t border-warm-100">
          <div class="text-center">
            <p class="text-lg font-bold text-warm-800">{{ statsStore.stats.totalFollowUps }}</p>
            <p class="text-xs text-warm-500">总计</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-[#E8A838]">{{ statsStore.stats.pendingFollowUps }}</p>
            <p class="text-xs text-warm-500">待处理</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-[#5C9460]">{{ statsStore.stats.completedFollowUps }}</p>
            <p class="text-xs text-warm-500">已完成</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
      <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
        <TrendingUp class="h-5 w-5 text-[#E8652B]" />
        使用统计
      </h3>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="rounded-xl bg-warm-50 p-4 text-center">
          <Phone class="h-6 w-6 mx-auto mb-2 text-[#E8652B]" />
          <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.totalContacts }}</p>
          <p class="text-xs text-warm-500">联系人</p>
        </div>
        <div class="rounded-xl bg-warm-50 p-4 text-center">
          <Heart class="h-6 w-6 mx-auto mb-2 text-red-500" />
          <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.emergencyContacts }}</p>
          <p class="text-xs text-warm-500">紧急联系人</p>
        </div>
        <div class="rounded-xl bg-warm-50 p-4 text-center">
          <MapPin class="h-6 w-6 mx-auto mb-2 text-[#D94F4F]" />
          <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.totalEmergencyItems }}</p>
          <p class="text-xs text-warm-500">应急物品</p>
        </div>
        <div class="rounded-xl bg-warm-50 p-4 text-center">
          <Award class="h-6 w-6 mx-auto mb-2 text-[#E8A838]" />
          <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.totalDrills }}</p>
          <p class="text-xs text-warm-500">应急演练</p>
        </div>
        <div class="rounded-xl bg-warm-50 p-4 text-center">
          <Clock class="h-6 w-6 mx-auto mb-2 text-[#5B9BD5]" />
          <p class="text-xl font-bold text-warm-800">{{ statsStore.stats.pendingFollowUps }}</p>
          <p class="text-xs text-warm-500">待跟进</p>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-sage-50 to-green-50 p-5 border border-sage-200">
      <div class="flex items-start gap-3">
        <Award class="h-6 w-6 text-sage-500 shrink-0 mt-0.5" />
        <div>
          <p class="text-base font-bold text-sage-700">使用建议</p>
          <ul class="text-sm text-sage-600 mt-2 space-y-1.5">
            <li v-if="statsStore.stats.emergencyContacts < 3">
              💡 建议设置至少 3 位紧急联系人，确保紧急时能够及时联系到
            </li>
            <li v-if="statsStore.stats.totalPackages < 2">
              📦 创建回听资料包，帮助记忆重要联系人信息
            </li>
            <li v-if="statsStore.stats.totalDrills < 5">
              🎯 定期进行应急演练，熟悉紧急联系流程
            </li>
            <li v-if="statsStore.stats.pendingFollowUps > 3">
              ⏰ 待办事项较多，建议及时处理
            </li>
            <li v-if="statsStore.stats.totalEmergencyItems < 5">
              🏠 建议添加更多应急物品，确保关键物品位置有记录
            </li>
            <li v-if="statsStore.stats.expiringOrReviewCount > 0">
              ⚠️ 有 {{ statsStore.stats.expiringOrReviewCount }} 件物品即将过期或需要复查，请及时处理
            </li>
            <li v-if="statsStore.stats.highUrgencyCoverage < 50 && statsStore.stats.totalEmergencyItems > 0">
              🔍 高紧急物品覆盖率较低，建议确认这些物品的位置是否准确
            </li>
            <li v-if="leavingSessionStore.checklistStats.highRiskStepCompletionRate < 80 && leavingSessionStore.checklistStats.totalSessions > 0">
              📋 高风险步骤完成率较低，建议在离家时仔细核对关键步骤
            </li>
            <li v-if="leavingSessionStore.checklistStats.abnormalStepDistribution['not-found'] > 0 || leavingSessionStore.checklistStats.abnormalStepDistribution['need-help'] > 0">
              ❓ 有 {{ leavingSessionStore.checklistStats.abnormalStepDistribution['not-found'] + leavingSessionStore.checklistStats.abnormalStepDistribution['need-help'] }} 次步骤出现问题，建议优化清单内容或确认物品位置
            </li>
            <li v-if="nightCareStats.totalPlans === 0">
              🌙 创建夜间照护计划，帮助老人安全度过夜晚
            </li>
            <li v-if="nightCareStats.totalPlans > 0 && nightCareStats.totalSessions === 0">
              🌙 您已创建夜间照护计划，开始使用"今晚照护"模式吧
            </li>
            <li v-if="nightCareStats.keyPointCompletionRate < 80 && nightCareStats.totalSessions > 0">
              ⚠️ 高风险检查项处理率较低，建议重点关注这些项目的执行
            </li>
            <li v-if="nightCareStats.familyHandlingCount > 0">
              👨‍👩‍👧‍👦 有 {{ nightCareStats.familyHandlingCount }} 次需要家人处理的情况，建议及时跟进
            </li>
            <li v-if="statsStore.stats.totalContacts >= 5 && statsStore.stats.emergencyContacts >= 3 && statsStore.stats.totalPackages >= 2 && statsStore.stats.totalEmergencyItems >= 5 && leavingSessionStore.checklistStats.totalChecklists >= 3 && nightCareStats.totalPlans >= 3">
              👍 您的数据已经很完整了，继续保持！
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
