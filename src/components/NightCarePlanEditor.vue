<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useNightCarePlanStore, useContactStore, useEmergencyStore, useNightCareSessionStore } from '@/stores'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Star, StarOff,
  Users, Clock, AlertTriangle, ListChecks, ChevronDown, ChevronUp,
  Moon, Lamp, Pill, ShieldCheck, Sunrise, Package, Repeat, Shield
} from 'lucide-vue-next'
import { NIGHT_CARE_DEFAULT_PLANS, NIGHT_CARE_PLAN_COLORS } from '@/types'

const props = defineProps<{
  planId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'elderly'): void
}>()

const planStore = useNightCarePlanStore()
const contactStore = useContactStore()
const emergencyStore = useEmergencyStore()

const plan = computed(() => planStore.getPlanById(props.planId))

const formName = ref('')
const formIcon = ref('moon')
const formStartTime = ref('21:00')
const formEndTime = ref('22:00')
const formKeyRisks = ref('')
const formReminderText = ref('')
const formAbnormalHandlingAdvice = ref('')
const formNeedsRepeatReminder = ref(false)
const formIsHighlighted = ref(false)
const formLinkedContactIds = ref<string[]>([])
const formLinkedEmergencyItemIds = ref<string[]>([])
const formItems = ref<typeof planStore.plans[0]['checkItems']>([])

const expandedItemId = ref<string | null>(null)
const addingName = ref('')
const linkedContactDropdown = ref(false)
const linkedEmergencyDropdown = ref(false)

const ICON_OPTIONS = [
  { id: 'moon', name: '夜间', icon: Moon, color: '#7B68EE' },
  { id: 'lamp', name: '起夜', icon: Lamp, color: '#E8A838' },
  { id: 'pill', name: '服药', icon: Pill, color: '#D94F4F' },
  { id: 'shield-check', name: '安全', icon: ShieldCheck, color: '#5C9460' },
  { id: 'sunrise', name: '清晨', icon: Sunrise, color: '#E8652B' },
]

const TIME_OPTIONS = [
  '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00',
  '23:30', '00:00', '00:30', '01:00', '01:30', '02:00', '02:30',
  '03:00', '03:30', '04:00', '04:30', '05:00', '05:30', '06:00',
  '06:30', '07:00', '07:30', '08:00',
]

function getPlanColor() {
  const match = ICON_OPTIONS.find(p => p.id === formIcon.value)
  return match?.color || '#E8652B'
}

function getIconComponent(iconId: string) {
  return ICON_OPTIONS.find(p => p.id === iconId)?.icon || Moon
}

watch(plan, (val) => {
  if (val) {
    formName.value = val.name
    formIcon.value = val.icon
    formStartTime.value = val.startTime
    formEndTime.value = val.endTime
    formKeyRisks.value = val.keyRisks
    formReminderText.value = val.reminderText
    formAbnormalHandlingAdvice.value = val.abnormalHandlingAdvice
    formNeedsRepeatReminder.value = val.needsRepeatReminder
    formIsHighlighted.value = val.isHighlighted
    formLinkedContactIds.value = [...val.linkedContactIds]
    formLinkedEmergencyItemIds.value = [...val.linkedEmergencyItemIds]
    formItems.value = JSON.parse(JSON.stringify(val.checkItems.sort((a, b) => a.order - b.order)))
  }
}, { immediate: true })

const linkedContactsList = computed(() => {
  return formLinkedContactIds.value
    .map(id => contactStore.contacts.find(c => c.id === id))
    .filter(Boolean) as typeof contactStore.contacts
})

const linkedEmergencyList = computed(() => {
  return formLinkedEmergencyItemIds.value
    .map(id => emergencyStore.items.find(ei => ei.id === id))
    .filter(Boolean) as typeof emergencyStore.items
})

function toggleLinkedContact(id: string) {
  const idx = formLinkedContactIds.value.indexOf(id)
  if (idx === -1) {
    formLinkedContactIds.value.push(id)
  } else {
    formLinkedContactIds.value.splice(idx, 1)
  }
}

function toggleLinkedEmergency(id: string) {
  const idx = formLinkedEmergencyItemIds.value.indexOf(id)
  if (idx === -1) {
    formLinkedEmergencyItemIds.value.push(id)
  } else {
    formLinkedEmergencyItemIds.value.splice(idx, 1)
  }
}

function addNewItem() {
  if (!addingName.value.trim()) return
  formItems.value.push({
    id: 'new-' + Date.now() + '-' + Math.random(),
    name: addingName.value.trim(),
    description: '',
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
  const linkedContactNames = linkedContactsList.value.map(c => c.name).join('、')
  const linkedEmergencyNames = linkedEmergencyList.value.map(ei => ei.name).join('、')
  planStore.updatePlan(props.planId, {
    name: formName.value.trim() || '夜间照护计划',
    icon: formIcon.value,
    startTime: formStartTime.value,
    endTime: formEndTime.value,
    keyRisks: formKeyRisks.value.trim(),
    reminderText: formReminderText.value.trim(),
    abnormalHandlingAdvice: formAbnormalHandlingAdvice.value.trim(),
    needsRepeatReminder: formNeedsRepeatReminder.value,
    isHighlighted: formIsHighlighted.value,
    linkedContactIds: [...formLinkedContactIds.value],
    linkedContactNames,
    linkedEmergencyItemIds: [...formLinkedEmergencyItemIds.value],
    linkedEmergencyItemNames: linkedEmergencyNames,
    checkItems: formItems.value.map((i, idx) => ({ ...i, order: idx })),
  })
  emit('back')
}

function handleStartElderly() {
  handleSave()
  if (plan.value) {
    const updated = planStore.getPlanById(props.planId)
    if (updated) {
      useNightCareSessionStore().startSession(updated)
      emit('elderly')
    }
  }
}
</script>

<template>
  <div class="space-y-6" v-if="plan">
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
          :style="{ backgroundColor: getPlanColor() + '20' }"
        >
          <component
            :is="getIconComponent(formIcon)"
            class="h-4.5 w-4.5"
            :style="{ color: getPlanColor() }"
          />
        </div>
        <div>
          <input
            v-model="formName"
            type="text"
            class="text-xl font-bold text-warm-900 bg-transparent border-b-2 border-transparent focus:border-orange-400 focus:outline-none px-1 py-0.5 -mx-1"
            placeholder="计划名称"
          />
          <div class="text-xs text-warm-400 mt-0.5 ml-1">
            上次更新：{{ new Date(plan.updatedAt).toLocaleString('zh-CN') }}
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
          :style="{ backgroundColor: getPlanColor() }"
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
            <Moon class="h-5 w-5 text-[#7B68EE]" />
            基本信息
          </h3>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5">计划图标</label>
            <div class="grid grid-cols-5 gap-2">
              <button
                v-for="opt in ICON_OPTIONS"
                :key="opt.id"
                @click="formIcon = opt.id"
                class="flex flex-col items-center gap-1 rounded-xl p-3 border-2 transition-all"
                :class="formIcon === opt.id ? 'shadow-sm' : 'hover:bg-warm-50'"
                :style="formIcon === opt.id
                  ? { borderColor: opt.color + '80', backgroundColor: opt.color + '10' }
                  : { borderColor: '#F0E0D0' }"
              >
                <component
                  :is="opt.icon"
                  class="h-5 w-5"
                  :style="{ color: formIcon === opt.id ? opt.color : '#8B7355' }"
                />
                <span class="text-xs font-medium" :style="{ color: formIcon === opt.id ? opt.color : '#5D4E42' }">
                  {{ opt.name }}
                </span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
                <Clock class="h-4 w-4" />
                开始时间
              </label>
              <select
                v-model="formStartTime"
                class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 bg-white"
              >
                <option v-for="t in TIME_OPTIONS" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
                <Clock class="h-4 w-4" />
                结束时间
              </label>
              <select
                v-model="formEndTime"
                class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 bg-white"
              >
                <option v-for="t in TIME_OPTIONS" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
              <AlertTriangle class="h-4 w-4" />
              重点风险
            </label>
            <input
              v-model="formKeyRisks"
              type="text"
              class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800"
              placeholder="如：跌倒风险、夜间突发疾病（用顿号分隔）"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-warm-600 mb-1.5 flex items-center gap-1">
              <ListChecks class="h-4 w-4" />
              提醒话术
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
              <Shield class="h-4 w-4" />
              异常处理建议
            </label>
            <textarea
              v-model="formAbnormalHandlingAdvice"
              rows="3"
              class="w-full rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm text-warm-800 resize-none"
              placeholder="遇到异常情况时的处理方法..."
            />
          </div>

          <div class="flex items-center justify-between rounded-xl border-2 border-warm-100 p-3">
            <div class="flex items-center gap-2">
              <Repeat class="h-5 w-5 text-[#E8652B]" />
              <div>
                <p class="text-sm font-medium text-warm-800">需要重复提醒</p>
                <p class="text-xs text-warm-400">重要事项多次提醒</p>
              </div>
            </div>
            <button
              @click="formNeedsRepeatReminder = !formNeedsRepeatReminder"
              class="relative w-12 h-7 rounded-full transition-colors"
              :class="formNeedsRepeatReminder ? 'bg-[#E8652B]' : 'bg-warm-200'"
            >
              <div
                class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform"
                :class="formNeedsRepeatReminder ? 'translate-x-5.5' : 'translate-x-0.5'"
                :style="formNeedsRepeatReminder ? { left: '22px' } : { left: '2px' }"
              />
            </button>
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

        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <h3 class="font-bold text-warm-800 flex items-center gap-2">
            <Package class="h-5 w-5 text-[#E8652B]" />
            关联应急物品
          </h3>
          <div class="relative">
            <button
              @click="linkedEmergencyDropdown = !linkedEmergencyDropdown"
              class="w-full flex items-center justify-between rounded-xl border-2 border-warm-100 px-3 py-2 text-sm text-warm-800 hover:bg-warm-50 transition-colors"
            >
              <span v-if="linkedEmergencyList.length === 0" class="text-warm-400">选择应急物品...</span>
              <span v-else class="truncate">{{ linkedEmergencyList.map(ei => ei.name).join('、') }}</span>
              <component :is="linkedEmergencyDropdown ? ChevronUp : ChevronDown" class="h-4 w-4 text-warm-400 shrink-0 ml-2" />
            </button>
            <div
              v-if="linkedEmergencyDropdown"
              class="absolute top-full left-0 right-0 mt-1 rounded-xl border-2 border-warm-100 bg-white shadow-lg max-h-64 overflow-y-auto z-10"
            >
              <div
                v-for="ei in emergencyStore.items"
                :key="ei.id"
                @click="toggleLinkedEmergency(ei.id)"
                class="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-warm-50 cursor-pointer"
              >
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0"
                  :class="formLinkedEmergencyItemIds.includes(ei.id) ? 'bg-orange-500 border-orange-500' : 'border-warm-200'"
                >
                  <svg v-if="formLinkedEmergencyItemIds.includes(ei.id)" class="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-warm-800 truncate">{{ ei.name }}</div>
                  <div class="text-xs text-warm-400 truncate">{{ ei.location }}</div>
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
            <ListChecks class="mx-auto mb-2 h-10 w-10 text-warm-300" />
            <p class="text-warm-400">还没有检查项，从下方添加</p>
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
                  :class="item.isKeyPoint ? 'bg-red-100' : 'bg-warm-100'"
                >
                  <span class="text-sm font-bold" :class="item.isKeyPoint ? 'text-red-600' : 'text-warm-600'">
                    {{ idx + 1 }}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="item.name"
                      type="text"
                      class="font-medium text-warm-900 bg-transparent border-b border-transparent focus:border-orange-400 focus:outline-none flex-1 min-w-0"
                      placeholder="检查项名称"
                    />
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
                      placeholder="例如：必需项"
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
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-orange-100">
              <Plus class="h-4.5 w-4.5 text-[#E8652B]" />
            </div>
            <input
              v-model="addingName"
              type="text"
              class="flex-1 rounded-xl border-2 border-warm-100 focus:border-orange-400 focus:outline-none px-3 py-2 text-sm"
              placeholder="输入检查项名称，如：门窗已锁好"
              @keyup.enter="addNewItem"
            />
            <button
              @click="addNewItem"
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
