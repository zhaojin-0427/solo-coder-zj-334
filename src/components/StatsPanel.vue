<script setup lang="ts">
import { computed } from 'vue'
import { useStatsStore } from '@/stores'
import { GROUP_LABELS, GROUP_COLORS } from '@/types'
import {
  BarChart3, Users, Star, Package, Play, CheckCircle2, Clock,
  TrendingUp, Award, Heart, Phone, UserPlus
} from 'lucide-vue-next'

const statsStore = useStatsStore()

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

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <Play class="h-5 w-5 text-[#5B9BD5]" />
          </div>
        </div>
        <p class="text-3xl font-bold text-warm-900">{{ statsStore.stats.totalDrills }}</p>
        <p class="text-sm text-warm-500 mt-1">演练次数</p>
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

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <li v-if="statsStore.stats.totalContacts >= 5 && statsStore.stats.emergencyContacts >= 3 && statsStore.stats.totalPackages >= 2">
              👍 您的数据已经很完整了，继续保持！
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
