<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFollowUpStore, useContactStore, useEmergencyStore } from '@/stores'
import {
  CheckCircle2, Circle, Plus, Trash2, Clock, AlertCircle,
  Calendar, User, ChevronDown, X, Edit2, MapPin, List, Hash, Package,
  Moon, Star
} from 'lucide-vue-next'
import type { FollowUpPriority } from '@/types'
import { FOLLOW_UP_PRIORITY_LABELS, FOLLOW_UP_PRIORITY_COLORS, FOLLOW_UP_STATUS_LABELS } from '@/types'

const followUpStore = useFollowUpStore()
const contactStore = useContactStore()
const emergencyStore = useEmergencyStore()

const showAddForm = ref(false)
const editingId = ref<string | null>(null)

const formTitle = ref('')
const formDescription = ref('')
const formPriority = ref<FollowUpPriority>('medium')
const formContactId = ref<string | null>(null)
const formDueDate = ref('')

const activeTab = ref<'pending' | 'done'>('pending')

function resetForm() {
  formTitle.value = ''
  formDescription.value = ''
  formPriority.value = 'medium'
  formContactId.value = null
  formDueDate.value = ''
  editingId.value = null
}

function openAddForm() {
  resetForm()
  showAddForm.value = true
}

function openEditForm(item: typeof followUpStore.pendingItems[0]) {
  formTitle.value = item.title
  formDescription.value = item.description
  formPriority.value = item.priority
  formContactId.value = item.contactId
  formDueDate.value = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''
  editingId.value = item.id
  showAddForm.value = true
}

function handleSubmit() {
  if (!formTitle.value.trim()) return

  const contact = formContactId.value
    ? contactStore.contacts.find(c => c.id === formContactId.value)
    : null

  const dueDate = formDueDate.value ? new Date(formDueDate.value).getTime() : null

  if (editingId.value) {
    followUpStore.updateItem(editingId.value, {
      title: formTitle.value.trim(),
      description: formDescription.value.trim(),
      priority: formPriority.value,
      contactId: formContactId.value,
      contactName: contact?.name || '',
      dueDate,
    })
  } else {
    followUpStore.addItem({
      title: formTitle.value.trim(),
      description: formDescription.value.trim(),
      priority: formPriority.value,
      contactId: formContactId.value,
      contactName: contact?.name || '',
      dueDate,
    })
  }

  resetForm()
  showAddForm.value = false
}

function formatDate(ts: number | null) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('zh-CN')
}

function isOverdue(ts: number | null) {
  if (!ts) return false
  return ts < Date.now()
}

const priorityOptions = [
  { value: 'high' as const, label: '高优先级', color: '#D94F4F' },
  { value: 'medium' as const, label: '中优先级', color: '#E8A838' },
  { value: 'low' as const, label: '低优先级', color: '#7BAE7F' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">待跟进事项</h2>
      <button
        @click="openAddForm"
        class="flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
        style="background: #E8652B;"
      >
        <Plus class="h-5 w-5" />
        添加待办
      </button>
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="activeTab = 'pending'"
        class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :style="activeTab === 'pending'
          ? { backgroundColor: '#E8652B', color: 'white' }
          : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
      >
        待处理 ({{ followUpStore.pendingItems.length }})
      </button>
      <button
        @click="activeTab = 'done'"
        class="rounded-full px-4 py-2 text-sm font-medium transition-colors"
        :style="activeTab === 'done'
          ? { backgroundColor: '#5C9460', color: 'white' }
          : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
      >
        已完成 ({{ followUpStore.doneItems.length }})
      </button>
    </div>

    <div v-if="activeTab === 'pending'" class="space-y-3">
      <div v-if="followUpStore.pendingItems.length === 0" class="rounded-2xl bg-white/60 px-5 py-10 text-center">
        <CheckCircle2 class="mx-auto mb-3 h-12 w-12 text-sage-400" />
        <p class="text-lg text-warm-400">暂无待办事项</p>
        <p class="text-sm text-warm-300 mt-1">点击"添加待办"创建新的跟进事项</p>
      </div>

      <div
        v-for="item in followUpStore.pendingItems"
        :key="item.id"
        class="rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm p-4 transition-all hover:shadow-md"
      >
        <div class="flex items-start gap-3">
          <button
            @click="followUpStore.toggleStatus(item.id)"
            class="mt-0.5 shrink-0"
          >
            <Circle class="h-6 w-6 text-warm-300 hover:text-[#E8652B] transition-colors" />
          </button>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-bold text-warm-900">{{ item.title }}</h3>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                :style="{ backgroundColor: FOLLOW_UP_PRIORITY_COLORS[item.priority] }"
              >
                {{ FOLLOW_UP_PRIORITY_LABELS[item.priority] }}
              </span>
            </div>

            <p v-if="item.description" class="text-sm text-warm-500 mt-1 line-clamp-2">
              {{ item.description }}
            </p>

            <div class="flex items-center gap-4 mt-2 text-xs text-warm-400 flex-wrap">
              <div v-if="item.sourceItemName" class="flex items-center gap-1 text-[#5B9BD5]">
                <MapPin class="h-3.5 w-3.5" />
                <span>来源：{{ item.sourceItemName }}</span>
              </div>
              <div v-if="item.contactName" class="flex items-center gap-1">
                <User class="h-3.5 w-3.5" />
                <span>{{ item.contactName }}</span>
              </div>
              <div v-if="item.dueDate" class="flex items-center gap-1" :class="{ 'text-red-500': isOverdue(item.dueDate) }">
                <Calendar class="h-3.5 w-3.5" />
                <span>{{ isOverdue(item.dueDate) ? '已过期：' : '' }}{{ formatDate(item.dueDate) }}</span>
              </div>
            </div>

            <div
              v-if="item.checklistSource"
              class="mt-3 border border-[#5B9BD5]/30 rounded-xl bg-[#5B9BD5]/5 p-3"
            >
              <div class="flex items-center gap-1.5 text-xs font-semibold text-[#4A8BC2] mb-2">
                <List class="h-3.5 w-3.5" />
                <span>清单来源信息</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-warm-600">
                <div class="flex items-center gap-1.5">
                  <List class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">清单：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.checklistName }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Hash class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">步骤：</span>
                  <span class="font-medium">第 {{ item.checklistSource.stepIndex + 1 }} 步</span>
                </div>
                <div class="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">步骤名称：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.itemName }}</span>
                </div>
                <div v-if="item.checklistSource.linkedEmergencyItemName" class="flex items-center gap-1.5">
                  <Package class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">物品：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.linkedEmergencyItemName }}</span>
                </div>
                <div v-if="item.checklistSource.linkedContactName" class="flex items-center gap-1.5">
                  <User class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">联系人：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.linkedContactName }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="item.nightCareSource"
              class="mt-3 border border-[#7B68EE]/30 rounded-xl bg-[#7B68EE]/5 p-3"
            >
              <div class="flex items-center gap-1.5 text-xs font-semibold text-[#6A5ACD] mb-2">
                <Moon class="h-3.5 w-3.5" />
                <span>夜间照护来源信息</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-warm-600">
                <div class="flex items-center gap-1.5">
                  <Star class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">计划：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.planName }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Hash class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">检查项：</span>
                  <span class="font-medium">第 {{ item.nightCareSource.stepIndex + 1 }} 项</span>
                </div>
                <div class="flex items-center gap-1.5 sm:col-span-2">
                  <Moon class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">检查项名称：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.itemName }}</span>
                </div>
                <div v-if="item.nightCareSource.linkedEmergencyItemName" class="flex items-center gap-1.5">
                  <Package class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">关联物品：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.linkedEmergencyItemName }}</span>
                </div>
                <div v-if="item.nightCareSource.linkedContactName" class="flex items-center gap-1.5">
                  <User class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">关联联系人：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.linkedContactName }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              @click="openEditForm(item)"
              class="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-50 transition-colors"
            >
              <Edit2 class="h-4 w-4" />
            </button>
            <button
              @click="followUpStore.deleteItem(item.id)"
              class="p-2 rounded-xl text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div v-if="followUpStore.doneItems.length === 0" class="rounded-2xl bg-white/60 px-5 py-10 text-center">
        <Clock class="mx-auto mb-3 h-12 w-12 text-warm-300" />
        <p class="text-lg text-warm-400">还没有完成的事项</p>
      </div>

      <div
        v-for="item in followUpStore.doneItems"
        :key="item.id"
        class="rounded-2xl bg-white/50 backdrop-blur-sm p-4 opacity-70"
      >
        <div class="flex items-start gap-3">
          <button
            @click="followUpStore.toggleStatus(item.id)"
            class="mt-0.5 shrink-0"
          >
            <CheckCircle2 class="h-6 w-6 text-sage-400 fill-sage-200" />
          </button>

          <div class="flex-1 min-w-0">
            <h3 class="text-base font-medium text-warm-600 line-through">{{ item.title }}</h3>
            <p v-if="item.description" class="text-sm text-warm-400 mt-1 line-clamp-1">
              {{ item.description }}
            </p>
            <div class="flex items-center gap-3 mt-1 text-xs text-warm-400">
              <div v-if="item.sourceItemName" class="flex items-center gap-1 text-[#5B9BD5]">
                <MapPin class="h-3 w-3" />
                <span>来源：{{ item.sourceItemName }}</span>
              </div>
            </div>
            <p class="text-xs text-warm-400 mt-1">
              完成于 {{ formatDate(item.completedAt) }}
            </p>

            <div
              v-if="item.checklistSource"
              class="mt-3 border border-[#5B9BD5]/25 rounded-xl bg-[#5B9BD5]/5 p-3"
            >
              <div class="flex items-center gap-1.5 text-xs font-semibold text-[#4A8BC2] mb-2">
                <List class="h-3.5 w-3.5" />
                <span>清单来源信息</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-warm-500">
                <div class="flex items-center gap-1.5">
                  <List class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">清单：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.checklistName }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Hash class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">步骤：</span>
                  <span class="font-medium">第 {{ item.checklistSource.stepIndex + 1 }} 步</span>
                </div>
                <div class="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">步骤名称：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.itemName }}</span>
                </div>
                <div v-if="item.checklistSource.linkedEmergencyItemName" class="flex items-center gap-1.5">
                  <Package class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">物品：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.linkedEmergencyItemName }}</span>
                </div>
                <div v-if="item.checklistSource.linkedContactName" class="flex items-center gap-1.5">
                  <User class="h-3 w-3 text-[#5B9BD5] shrink-0" />
                  <span class="text-warm-400">联系人：</span>
                  <span class="font-medium truncate">{{ item.checklistSource.linkedContactName }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="item.nightCareSource"
              class="mt-3 border border-[#7B68EE]/25 rounded-xl bg-[#7B68EE]/5 p-3"
            >
              <div class="flex items-center gap-1.5 text-xs font-semibold text-[#6A5ACD] mb-2">
                <Moon class="h-3.5 w-3.5" />
                <span>夜间照护来源信息</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-warm-500">
                <div class="flex items-center gap-1.5">
                  <Star class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">计划：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.planName }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Hash class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">检查项：</span>
                  <span class="font-medium">第 {{ item.nightCareSource.stepIndex + 1 }} 项</span>
                </div>
                <div class="flex items-center gap-1.5 sm:col-span-2">
                  <Moon class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">检查项名称：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.itemName }}</span>
                </div>
                <div v-if="item.nightCareSource.linkedEmergencyItemName" class="flex items-center gap-1.5">
                  <Package class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">关联物品：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.linkedEmergencyItemName }}</span>
                </div>
                <div v-if="item.nightCareSource.linkedContactName" class="flex items-center gap-1.5">
                  <User class="h-3 w-3 text-[#7B68EE] shrink-0" />
                  <span class="text-warm-400">关联联系人：</span>
                  <span class="font-medium truncate">{{ item.nightCareSource.linkedContactName }}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="followUpStore.deleteItem(item.id)"
            class="p-2 rounded-xl text-warm-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div v-if="followUpStore.doneItems.length > 0" class="pt-4 text-center">
        <button
          @click="followUpStore.clearDone()"
          class="text-sm text-warm-400 hover:text-red-500 transition-colors"
        >
          清空所有已完成
        </button>
      </div>
    </div>

    <div v-if="showAddForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="rounded-3xl bg-white shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-5 border-b border-warm-100">
          <h3 class="text-xl font-bold text-warm-900">{{ editingId ? '编辑待办' : '添加待办' }}</h3>
          <button
            @click="showAddForm = false; resetForm()"
            class="p-2 rounded-xl text-warm-400 hover:text-warm-600 hover:bg-warm-50 transition-colors"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">事项标题 *</label>
            <input
              v-model="formTitle"
              type="text"
              placeholder="要跟进什么事？"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">详细描述</label>
            <textarea
              v-model="formDescription"
              placeholder="补充说明（可选）"
              rows="3"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white resize-none"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">优先级</label>
            <div class="flex gap-2">
              <button
                v-for="opt in priorityOptions"
                :key="opt.value"
                @click="formPriority = opt.value"
                class="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all border-2"
                :style="formPriority === opt.value
                  ? { backgroundColor: opt.color + '15', borderColor: opt.color, color: opt.color }
                  : { backgroundColor: 'white', borderColor: '#F0E0D0', color: '#8B7355' }"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">关联联系人</label>
            <select
              v-model="formContactId"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            >
              <option :value="null">不关联</option>
              <option v-for="c in contactStore.contacts" :key="c.id" :value="c.id">
                {{ c.name }} - {{ c.phone }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">截止日期</label>
            <input
              v-model="formDueDate"
              type="date"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            />
          </div>
        </div>

        <div class="flex items-center gap-3 p-5 border-t border-warm-100">
          <button
            @click="showAddForm = false; resetForm()"
            class="flex-1 rounded-xl px-4 py-3 text-base font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="handleSubmit"
            :disabled="!formTitle.trim()"
            class="flex-1 rounded-xl px-4 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24] disabled:opacity-50 disabled:cursor-not-allowed"
            style="background: #E8652B;"
          >
            {{ editingId ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
