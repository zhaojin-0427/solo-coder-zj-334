<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLeavingChecklistStore, useContactStore, useEmergencyStore, useLeavingSessionStore } from '@/stores'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Star, StarOff,
  Users, Clock, AlertTriangle, ListChecks, ChevronDown, ChevronUp,
  KeyRound, HeartPulse, ShoppingBag, DoorOpen, Building2, Smartphone,
  ShieldCheck, Package
} from 'lucide-vue-next'
import {
  LEAVING_SCENES, LEAVING_SCENE_LABELS, LEAVING_SCENE_COLORS,
  CHECKLIST_ITEM_CATEGORY_LABELS, CHECKLIST_ITEM_CATEGORY_COLORS
} from '@/types'
import type { LeavingChecklistScene, ChecklistItemCategory } from '@/types'

const props = defineProps<{
  checklistId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'elderly'): void
}>()

const checklistStore = useLeavingChecklistStore()
const contactStore = useContactStore()
const emergencyStore = useEmergencyStore()

const checklist = computed(() => checklistStore.getChecklistById(props.checklistId))

const formName = ref('')
const formScene = ref<LeavingChecklistScene>('grocery')
const formDescription = ref('')
const formEstimatedDuration = ref('')
const formReminderText = ref('')
const formKeySteps = ref('')
const formIsHighlighted = ref(false)
const formLinkedContactIds = ref<string[]>([])
const formItems = ref<typeof checklistStore.checklists[0]['items']>([])

const expandedItemId = ref<string | null>(null)
const addingCategory = ref<ChecklistItemCategory | null>(null)
const addingName = ref('')
const linkedContactDropdown = ref(false)
const durationOptions = ['15分钟', '30分钟', '30分钟-1小时', '1-2小时', '2-4小时', '半天', '1天', '视情况而定']

const CATEGORY_ICONS: Record<ChecklistItemCategory, typeof KeyRound> = {
  'contact-card': DoorOpen,
  'id': ListChecks,
  'medicine': HeartPulse,
  'key': KeyRound,
  'phone': Smartphone,
  'safety-check': ShieldCheck,
  'emergency-item': Package,
}

watch(checklist, (val) => {
  if (val) {
    formName.value = val.name
    formScene.value = val.scene
    formDescription.value = val.description
    formEstimatedDuration.value = val.estimatedDuration
    formReminderText.value = val.reminderText
    formKeySteps.value = val.keySteps
    formIsHighlighted.value = val.isHighlighted
    formLinkedContactIds.value = [...val.linkedContactIds]
    formItems.value = JSON.parse(JSON.stringify(val.items.sort((a, b) => a.order - b.order)))
  }
}, { immediate: true })

const linkedContactsList = computed(() => {
  return formLinkedContactIds.value
    .map(id => contactStore.contacts.find(c => c.id === id))
    .filter(Boolean) as typeof contactStore.contacts
})

function toggleLinkedContact(id: string) {
  const idx = formLinkedContactIds.value.indexOf(id)
  if (idx === -1) {
    formLinkedContactIds.value.push(id)
  } else {
    formLinkedContactIds.value.splice(idx, 1)
  }
}

function addNewItem(category: ChecklistItemCategory) {
  if (!addingName.value.trim()) return
  formItems.value.push({
    id: 'new-' + Date.now() + '-' + Math.random(),
    name: addingName.value.trim(),
    category,
    order: formItems.value.length,
    isKeyPoint: false,
    reminder: '',
    stepNote: '',
    linkedEmergencyItemId: null,
    linkedEmergencyItemName: '',
    linkedContactId: null,
    linkedContactName: '',
  })
  addingName.value = ''
  addingCategory.value = null
}

function removeItem(itemId: string) {
  formItems.value = formItems.value.filter(i => i.id !== itemId)
  formItems.value.forEach((i, idx) => { i.order = idx })
}

function toggleItemKeypoint(itemId: string) {
  const item = formItems.value.find(i => i.id === itemId)
  if (item) item.isKeyPoint = !item.isKeyPoint
}

function moveItem(from: number, to: number) {
  if (to < 0 || to >= formItems.value.length) return
  const arr = [...formItems.value]
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
  arr.forEach((i, idx) => { i.order = idx })
  formItems.value = [...arr]
}

function linkEmergencyItem(itemId: string, emergencyId: string | null) {
  const item = formItems.value.find(i => i.id === itemId)
  if (!item) return
  item.linkedEmergencyItemId = emergencyId
  item.linkedEmergencyItemName = emergencyId
    ? emergencyStore.items.find(ei => ei.id === emergencyId)?.name || ''
    : ''
}

function linkContact(itemId: string, contactId: string | null) {
  const item = formItems.value.find(i => i.id === itemId)
  if (!item) return
  item.linkedContactId = contactId
  item.linkedContactName = contactId
    ? contactStore.contacts.find(c => c.id === contactId)?.name || ''
    : ''
}

function handleSave() {
  const linkedNames = linkedContactsList.value.map(c => c.name).join('、')
  checklistStore.updateChecklist(props.checklistId, {
    name: formName.value.trim() || LEAVING_SCENE_LABELS[formScene.value],
    scene: formScene.value,
    description: formDescription.value.trim(),
    estimatedDuration: formEstimatedDuration.value.trim(),
    reminderText: formReminderText.value.trim(),
    keySteps: formKeySteps.value.trim(),
    isHighlighted: formIsHighlighted.value,
    linkedContactIds: [...formLinkedContactIds.value],
    linkedContactNames: linkedNames,
    items: formItems.value.map((i, idx) => ({ ...i, order: idx })),
  })
  emit('back')
}

function handleStartElderly() {
  handleSave()
  if (checklist.value) {
    const updated = checklistStore.getChecklistById(props.checklistId)
    if (updated) {
      useLeavingSessionStore().startSession(updated)
      emit('elderly')
    }
  }
}
</script>

<template>
  <div class="space-y-6" v-if="checklist">
    <div class="flex items-center gap-3">
      <button
        @click="emit('back')"
        class="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-warm-600 hover:bg-warm-100 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        返回列表
      </button>
      <div class="h-6 w-px bg-warm-200" />
      <div class="flex items-center gap-2">
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: LEAVING_SCENE_COLORS[formScene] + '20' }"
        >
          <component
            :is="formScene === 'hospital-visit' ? HeartPulse
              : formScene === 'family-visit' ? Users
              : formScene === 'grocery' ? ShoppingBag
              : formScene === 'community' ? Building2 : AlertTriangle"
            class="h-4.5 w-4.5"
            :style="{ color: LEAVING_SCENE_COLORS[formScene] }"
          />
        </div>
        <div>
          <input
            v-model="formName"
            type="text"
            class="text-xl font-bold text-warm-900 bg-transparent border-b-2 border-transparent focus:border-orange-400 focus:outline-none px-1 py-0.5 -mx-1"
            placeholder="清单名称"
          />
          <div class="text-xs text-warm-400 mt-0.5 ml-1">
            上次更新：{{ new Date(checklist.updatedAt).toLocaleString('zh-CN') }}
          </div>
        </div>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <button
          @click="formIsHighlighted = !formIsHighlighted"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors border"
          :class="formIsHighlighted
            ? 'bg-orange-50 border-orange-200 text-orange-600'
            : 'border-warm-200 text-warm-500 hover:bg-warm-50'"
        >
          <component :is="formIsHighlighted ? Star : StarOff" class="h-4 w-4" :class="formIsHighlighted ? 'fill-orange-500' : ''" />
          {{ formIsHighlighted ? '已置顶' : '置顶' }}
        </button>
        <button
          @click="handleStartElderly"
          class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          :style="{ backgroundColor: LEAVING_SCENE_COLORS[formScene] }"
        >
          保存并开始
        </button>
        <button
          @click="handleSave"
          class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white bg-[#E8652B] hover:bg-[#d45a24] transition-colors"
        >
          <Save class="h-4 w-4" />
          保存
        </button>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-5">
        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <h3 class="font-bold text-warm-800 flex items-center gap-2">
            <ListChecks class="h-5 w-5 text-[#E8652B]" />
            基本信息
          </h3>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5">场景类型</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="s in LEAVING_SCENES"
                :key="s.id"
                @click="formScene = s.id"
                class="text-left rounded-xl p-3 border-2 transition-all text-sm"
                :class="formScene === s.id ? 'shadow-sm' : 'hover:bg-warm-50'"
                :style="formScene === s.id
                  ? { borderColor: s.color + '80', backgroundColor: s.color + '10' }
                  : { borderColor: '#F0E0D0' }"
              >
                <div class="font-bold" :style="{ color: formScene === s.id ? s.color : '#5D4E42' }">{{ s.name }}</div>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5">场景描述</label>
            <textarea
              v-model="formDescription"
              rows="2"
              class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 resize-none"
              placeholder="简述这个场景的用途..."
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
              <Clock class="h-4 w-4" />
              预计外出时长
            </label>
            <select
              v-model="formEstimatedDuration"
              class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 bg-white"
            >
              <option value="">请选择</option>
              <option v-for="d in durationOptions" :key="d" :value="d">{{ d }}</option>
            </select>
            <input
              v-if="!durationOptions.includes(formEstimatedDuration) && formEstimatedDuration"
              v-model="formEstimatedDuration"
              type="text"
              class="mt-2 w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800"
              placeholder="自定义时长，如：3-5小时"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
              <AlertTriangle class="h-4 w-4" />
              提醒语
            </label>
            <textarea
              v-model="formReminderText"
              rows="2"
              class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 resize-none"
              placeholder="给老人的温馨提示..."
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
              <ListChecks class="h-4 w-4" />
              重点步骤
            </label>
            <textarea
              v-model="formKeySteps"
              rows="4"
              class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 resize-none"
              placeholder="1.第一步...&#10;2.第二步...&#10;..."
            />
          </div>
        </div>

        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <h3 class="font-bold text-warm-800 flex items-center gap-2">
            <Users class="h-5 w-5 text-[#5B9BD5]" />
            关联联系人
            <span class="text-xs font-normal text-warm-400">（紧急情况下通知）</span>
          </h3>
          <div class="relative">
            <button
              @click="linkedContactDropdown = !linkedContactDropdown"
              class="w-full flex items-center justify-between rounded-xl border-2 border-warm-100 px-3 py-2 text-sm text-warm-800 hover:bg-warm-50 transition-colors"
            >
              <span v-if="linkedContactsList.length === 0" class="text-warm-400">选择联系人...</span>
              <span v-else class="truncate">{{ linkedContactsList.map(c => c.name).join('、') }}</span>
              <component :is="linkedContactDropdown ? ChevronUp : ChevronDown" class="h-4 w-4 text-warm-400 shrink-0 ml-2" />
            </button>
            <div
              v-if="linkedContactDropdown"
              class="absolute top-full left-0 right-0 mt-1 rounded-xl border-2 border-warm-100 bg-white shadow-lg max-h-64 overflow-y-auto z-10"
            >
              <div
                v-for="c in contactStore.contacts"
                :key="c.id"
                @click="toggleLinkedContact(c.id)"
                class="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-warm-50 cursor-pointer"
              >
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                  :class="formLinkedContactIds.includes(c.id) ? 'bg-orange-500 border-orange-500' : 'border-warm-200'"
                >
                  <svg v-if="formLinkedContactIds.includes(c.id)" class="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-warm-800 truncate">{{ c.name }}</div>
                  <div class="text-xs text-warm-400 truncate">{{ c.phone }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-5">
        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-warm-800 flex items-center gap-2">
              <ListChecks class="h-5 w-5 text-[#E8652B]" />
              检查项列表
              <span class="text-xs font-normal text-warm-400">(共 {{ formItems.length }} 项)</span>
            </h3>
          </div>

          <div v-if="formItems.length === 0" class="rounded-xl bg-warm-50 px-4 py-8 text-center">
            <Package class="mx-auto mb-2 h-10 w-10 text-warm-300" />
            <p class="text-warm-400">还没有检查项，从下方分类添加</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, idx) in formItems"
              :key="item.id"
              class="rounded-xl border-2 transition-all"
              :class="expandedItemId === item.id ? 'border-orange-300 shadow-sm bg-orange-50/30' : 'border-warm-100 hover:border-warm-200'"
            >
              <div class="flex items-center gap-2 p-3">
                <div class="flex flex-col items-center gap-0.5 -my-1 shrink-0">
                  <button
                    @click="moveItem(idx, idx - 1)"
                    :disabled="idx === 0"
                    class="p-1 rounded hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp class="h-3.5 w-3.5 text-warm-400" />
                  </button>
                  <GripVertical class="h-4 w-4 text-warm-300" />
                  <button
                    @click="moveItem(idx, idx + 1)"
                    :disabled="idx === formItems.length - 1"
                    class="p-1 rounded hover:bg-warm-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown class="h-3.5 w-3.5 text-warm-400" />
                  </button>
                </div>

                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  :style="{ backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[item.category] + '20' }"
                >
                  <component
                    :is="CATEGORY_ICONS[item.category]"
                    class="h-4.5 w-4.5"
                    :style="{ color: CHECKLIST_ITEM_CATEGORY_COLORS[item.category] }"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="item.name"
                      type="text"
                      class="font-medium text-warm-900 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none flex-1 min-w-0"
                      placeholder="物品名称"
                    />
                    <span
                      class="inline-block rounded-full px-2 py-0.5 text-xs"
                      :style="{
                        backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[item.category] + '15',
                        color: CHECKLIST_ITEM_CATEGORY_COLORS[item.category],
                      }"
                    >
                      {{ CHECKLIST_ITEM_CATEGORY_LABELS[item.category] }}
                    </span>
                  </div>
                  <div v-if="item.reminder" class="text-xs text-warm-400 mt-0.5 truncate">
                    {{ item.reminder }}
                  </div>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  <button
                    @click="toggleItemKeypoint(item.id)"
                    class="p-2 rounded-lg transition-colors"
                    :class="item.isKeyPoint ? 'bg-red-50' : 'hover:bg-warm-50'"
                    :title="item.isKeyPoint ? '取消重点项' : '设为重点项'"
                  >
                    <AlertTriangle
                      class="h-4 w-4"
                      :class="item.isKeyPoint ? 'text-red-500 fill-red-100' : 'text-warm-300'"
                    />
                  </button>
                  <button
                    @click="expandedItemId = expandedItemId === item.id ? null : item.id"
                    class="p-2 rounded-lg hover:bg-warm-50"
                  >
                    <component
                      :is="expandedItemId === item.id ? ChevronUp : ChevronDown"
                      class="h-4 w-4 text-warm-400"
                    />
                  </button>
                  <button
                    @click="removeItem(item.id)"
                    class="p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 class="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div v-if="expandedItemId === item.id" class="px-3 pb-4 pt-0 space-y-3 border-t border-warm-100">
                <div class="grid sm:grid-cols-2 gap-3 pt-3">
                  <div>
                    <label class="block text-xs font-medium text-warm-500 mb-1">提醒说明</label>
                    <input
                      v-model="item.reminder"
                      type="text"
                      class="w-full rounded-lg border border-warm-100 focus:border-orange-400 focus:outline-none px-2.5 py-1.5 text-sm"
                      placeholder="例如：挂号必需"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-warm-500 mb-1">步骤备注</label>
                    <input
                      v-model="item.stepNote"
                      type="text"
                      class="w-full rounded-lg border border-warm-100 focus:border-orange-400 focus:outline-none px-2.5 py-1.5 text-sm"
                      placeholder="操作提示..."
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-warm-500 mb-1">关联应急物品</label>
                    <select
                      :value="item.linkedEmergencyItemId || ''"
                      @change="linkEmergencyItem(item.id, ($event.target as HTMLSelectElement).value || null)"
                      class="w-full rounded-lg border border-warm-100 focus:border-orange-400 focus:outline-none px-2.5 py-1.5 text-sm bg-white"
                    >
                      <option value="">不关联</option>
                      <option v-for="ei in emergencyStore.items" :key="ei.id" :value="ei.id">
                        {{ ei.name }}（{{ ei.location }}）
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-warm-500 mb-1">关联联系人</label>
                    <select
                      :value="item.linkedContactId || ''"
                      @change="linkContact(item.id, ($event.target as HTMLSelectElement).value || null)"
                      class="w-full rounded-lg border border-warm-100 focus:border-orange-400 focus:outline-none px-2.5 py-1.5 text-sm bg-white"
                    >
                      <option value="">不关联</option>
                      <option v-for="c in contactStore.contacts" :key="c.id" :value="c.id">
                        {{ c.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-3">
          <h3 class="font-bold text-warm-800">添加检查项</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              v-for="(label, cat) in CHECKLIST_ITEM_CATEGORY_LABELS"
              :key="cat"
              @click="addingCategory = addingCategory === cat ? null : (cat as ChecklistItemCategory)"
              class="flex flex-col items-center gap-1.5 rounded-xl p-3 border-2 transition-all"
              :class="addingCategory === cat ? 'shadow-sm' : 'hover:bg-warm-50'"
              :style="addingCategory === cat
                ? { borderColor: CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory] + '80', backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory] + '10' }
                : { borderColor: '#F0E0D0' }"
            >
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :style="{ backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory] + '20' }"
              >
                <component
                  :is="CATEGORY_ICONS[cat as ChecklistItemCategory]"
                  class="h-4 w-4"
                  :style="{ color: CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory] }"
                />
              </div>
              <span class="text-xs font-medium" :style="{ color: addingCategory === cat ? CHECKLIST_ITEM_CATEGORY_COLORS[cat as ChecklistItemCategory] : '#5D4E42' }">
                {{ label }}
              </span>
            </button>
          </div>

          <div v-if="addingCategory" class="flex items-center gap-2 pt-2">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :style="{ backgroundColor: CHECKLIST_ITEM_CATEGORY_COLORS[addingCategory] + '20' }"
            >
              <component
                :is="CATEGORY_ICONS[addingCategory]"
                class="h-4.5 w-4.5"
                :style="{ color: CHECKLIST_ITEM_CATEGORY_COLORS[addingCategory] }"
              />
            </div>
            <input
              v-model="addingName"
              type="text"
              class="flex-1 rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm"
              :placeholder="'输入' + CHECKLIST_ITEM_CATEGORY_LABELS[addingCategory] + '名称，如：身份证'"
              @keyup.enter="addNewItem(addingCategory)"
            />
            <button
              @click="addNewItem(addingCategory)"
              :disabled="!addingName.trim()"
              class="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-white bg-[#E8652B] hover:bg-[#d45a24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus class="h-4 w-4" />
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
