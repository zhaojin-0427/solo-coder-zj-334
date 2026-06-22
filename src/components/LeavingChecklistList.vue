<script setup lang="ts">
import { computed } from 'vue'
import { useLeavingChecklistStore, useLeavingSessionStore } from '@/stores'
import {
  Plus, Edit2, Trash2, Star, StarOff, ChevronRight, Clock,
  Users, AlertCircle, HeartPulse, ShoppingBag, Building2, DoorOpen,
  KeyRound, Play, ListChecks
} from 'lucide-vue-next'
import {
  LEAVING_SCENE_LABELS, LEAVING_SCENE_COLORS,
  CHECKLIST_ITEM_CATEGORY_LABELS, CHECKLIST_ITEM_CATEGORY_COLORS
} from '@/types'
import type { LeavingChecklistScene, ChecklistItemCategory } from '@/types'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'elderly'): void
}>()

const checklistStore = useLeavingChecklistStore()
const sessionStore = useLeavingSessionStore()

const SCENE_ICONS: Record<LeavingChecklistScene, typeof HeartPulse> = {
  'hospital-visit': HeartPulse,
  'family-visit': Users,
  'grocery': ShoppingBag,
  'community': Building2,
  'emergency-evac': AlertCircle,
}

const CATEGORY_ICONS: Record<ChecklistItemCategory, typeof KeyRound> = {
  'contact-card': DoorOpen,
  'id': ListChecks,
  'medicine': HeartPulse,
  'key': KeyRound,
  'phone': KeyRound,
  'safety-check': AlertCircle,
  'emergency-item': ShoppingBag,
}

const sceneGrouped = computed(() => {
  const groups: Record<LeavingChecklistScene, typeof checklistStore.sortedChecklists> = {
    'hospital-visit': [], 'family-visit': [], 'grocery': [], 'community': [], 'emergency-evac': [],
  }
  for (const cl of checklistStore.sortedChecklists) {
    groups[cl.scene].push(cl)
  }
  return groups
})

function handleCreate(scene: LeavingChecklistScene) {
  const newCl = checklistStore.createChecklist({ scene })
  emit('edit', newCl.id)
}

function handleDelete(id: string) {
  const cl = checklistStore.getChecklistById(id)
  if (cl && confirm(`确定要删除离家清单"${cl.name}"吗？`)) {
    checklistStore.deleteChecklist(id)
  }
}

function handleStartElderly(id: string) {
  const cl = checklistStore.getChecklistById(id)
  if (cl) {
    sessionStore.startSession(cl)
    emit('elderly')
  }
}

function getCategoryCounts(items: typeof checklistStore.checklists[0]['items']) {
  const counts: Record<string, number> = {}
  for (const it of items) {
    counts[it.category] = (counts[it.category] || 0) + 1
  }
  return counts
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="font-serif text-2xl font-bold text-warm-900">离家清单管理</h2>
        <p class="text-sm text-warm-500 mt-1">为不同外出场景创建出门前检查清单</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          v-for="scene in ['hospital-visit', 'family-visit', 'grocery', 'community', 'emergency-evac'] as LeavingChecklistScene[]"
          :key="scene"
          @click="handleCreate(scene)"
          class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all border-2 hover:shadow-md"
          :style="{
            borderColor: LEAVING_SCENE_COLORS[scene] + '40',
            backgroundColor: LEAVING_SCENE_COLORS[scene] + '10',
            color: LEAVING_SCENE_COLORS[scene],
          }"
        >
          <Plus class="h-4 w-4" />
          <span>{{ LEAVING_SCENE_LABELS[scene] }}</span>
        </button>
      </div>
    </div>

    <div class="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-5 border-2 border-[#E8652B]/20">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#E8652B] flex items-center justify-center shrink-0">
          <ListChecks class="h-6 w-6 text-white" />
        </div>
        <div class="flex-1">
          <p class="font-bold text-warm-900">为什么需要离家清单？</p>
          <p class="text-sm text-warm-600 mt-1 leading-relaxed">
            为老人定制不同场景的出门检查清单，确保不遗漏钥匙、手机、药品等关键物品。
            出门前逐项确认，回家后安全登记，让家属放心。
          </p>
        </div>
      </div>
    </div>

    <div v-for="(scene, sceneId) in sceneGrouped" :key="sceneId" v-show="scene.length > 0" class="space-y-3">
      <div class="flex items-center gap-2">
        <component
          :is="SCENE_ICONS[sceneId as LeavingChecklistScene]"
          class="h-5 w-5"
          :style="{ color: LEAVING_SCENE_COLORS[sceneId as LeavingChecklistScene] }"
        />
        <h3 class="font-bold text-warm-800">{{ LEAVING_SCENE_LABELS[sceneId as LeavingChecklistScene] }}</h3>
        <span class="text-sm text-warm-400">({{ scene.length }})</span>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div
          v-for="checklist in scene"
          :key="checklist.id"
          class="rounded-2xl bg-white shadow-sm p-5 transition-all hover:shadow-md border-2"
          :class="checklist.isHighlighted ? 'border-orange-200' : 'border-transparent'"
        >
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-start gap-3 min-w-0">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                :style="{ backgroundColor: LEAVING_SCENE_COLORS[checklist.scene] + '20' }"
              >
                <component
                  :is="SCENE_ICONS[checklist.scene]"
                  class="h-5 w-5"
                  :style="{ color: LEAVING_SCENE_COLORS[checklist.scene] }"
                />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-bold text-warm-900 truncate">{{ checklist.name }}</h4>
                  <Star
                    v-if="checklist.isHighlighted"
                    class="h-4 w-4 text-orange-500 fill-orange-500 shrink-0"
                  />
                </div>
                <p v-if="checklist.description" class="text-sm text-warm-500 mt-0.5 line-clamp-2">
                  {{ checklist.description }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="checklistStore.toggleHighlight(checklist.id)"
                class="p-2 rounded-lg transition-colors hover:bg-warm-50"
                :title="checklist.isHighlighted ? '取消置顶' : '置顶'"
              >
                <component
                  :is="checklist.isHighlighted ? Star : StarOff"
                  class="h-4 w-4"
                  :class="checklist.isHighlighted ? 'text-orange-500 fill-orange-500' : 'text-warm-400'"
                />
              </button>
              <button
                @click="emit('edit', checklist.id)"
                class="p-2 rounded-lg transition-colors hover:bg-warm-50"
                title="编辑"
              >
                <Edit2 class="h-4 w-4 text-warm-500" />
              </button>
              <button
                @click="handleDelete(checklist.id)"
                class="p-2 rounded-lg transition-colors hover:bg-red-50"
                title="删除"
              >
                <Trash2 class="h-4 w-4 text-red-400" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mb-3">
            <div
              v-for="(count, cat) in getCategoryCounts(checklist.items)"
              :key="cat"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
              :style="{
                backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory] + '15',
                color: CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory],
              }"
            >
              <component
                :is="CATEGORY_ICONS[cat as ChecklistItemCategory]"
                class="h-3 w-3"
              />
              {{ CHECKLIST_ITEM_CATEGORY_LABELS[cat as ChecklistItemCategory] }} {{ count }}
            </div>
          </div>

          <div class="flex items-center gap-4 text-xs text-warm-400 mb-4 flex-wrap">
            <div class="flex items-center gap-1">
              <ListChecks class="h-3.5 w-3.5" />
              <span>{{ checklist.items.length }} 项检查</span>
            </div>
            <div class="flex items-center gap-1">
              <Clock class="h-3.5 w-3.5" />
              <span>{{ checklist.estimatedDuration || '未设置时长' }}</span>
            </div>
            <div v-if="checklist.linkedContactNames" class="flex items-center gap-1">
              <Users class="h-3.5 w-3.5" />
              <span class="truncate max-w-[120px]">{{ checklist.linkedContactNames }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="handleStartElderly(checklist.id)"
              class="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:shadow-md"
              :style="{ backgroundColor: LEAVING_SCENE_COLORS[checklist.scene] }"
            >
              <Play class="h-4 w-4 fill-white" />
              我要出门
            </button>
            <button
              @click="emit('edit', checklist.id)"
              class="flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors border"
              style="border-color: #F0E0D0; color: #8B7355;"
            >
              编辑清单
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="checklistStore.checklists.length === 0"
      class="rounded-2xl bg-white/60 px-6 py-16 text-center"
    >
      <ListChecks class="mx-auto mb-4 h-14 w-14 text-warm-300" />
      <p class="text-xl text-warm-400">还没有离家清单</p>
      <p class="text-sm text-warm-300 mt-2">点击上方按钮，为常见场景创建出门检查清单</p>
    </div>
  </div>
</template>
