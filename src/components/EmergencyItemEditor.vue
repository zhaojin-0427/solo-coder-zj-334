<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEmergencyStore, useContactStore, usePackageStore } from '@/stores'
import type { EmergencyItemType, EmergencyUrgency } from '@/types'
import { EMERGENCY_ITEM_TYPE_LABELS, EMERGENCY_ITEM_TYPE_COLORS, EMERGENCY_URGENCY_LABELS, EMERGENCY_URGENCY_COLORS } from '@/types'
import { ArrowLeft, Save, X } from 'lucide-vue-next'

const props = defineProps<{
  itemId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'saved', id: string): void
}>()

const emergencyStore = useEmergencyStore()
const contactStore = useContactStore()
const packageStore = usePackageStore()

const isEditing = computed(() => props.itemId !== '')

const typeKeys = Object.keys(EMERGENCY_ITEM_TYPE_LABELS) as EmergencyItemType[]
const urgencyKeys = Object.keys(EMERGENCY_URGENCY_LABELS) as EmergencyUrgency[]

const defaultForm = () => ({
  name: '',
  type: 'other' as EmergencyItemType,
  location: '',
  findHint: '',
  photoDescription: '',
  expiryDate: '',
  checkDate: '',
  contactId: '',
  packageId: '',
  urgency: 'medium' as EmergencyUrgency,
  needsPeriodicReview: false,
  reviewIntervalDays: 90,
})

const form = ref(defaultForm())
const nameError = ref(false)

const existingItem = computed(() => {
  if (!props.itemId) return null
  return emergencyStore.getItemById(props.itemId)
})

watch(
  () => props.itemId,
  () => {
    if (existingItem.value) {
      const item = existingItem.value
      form.value = {
        name: item.name,
        type: item.type,
        location: item.location,
        findHint: item.findHint,
        photoDescription: item.photoDescription,
        expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().slice(0, 10) : '',
        checkDate: item.checkDate ? new Date(item.checkDate).toISOString().slice(0, 10) : '',
        contactId: item.contactId ?? '',
        packageId: item.packageId ?? '',
        urgency: item.urgency,
        needsPeriodicReview: item.needsPeriodicReview,
        reviewIntervalDays: item.reviewIntervalDays ?? 90,
      }
    } else {
      form.value = defaultForm()
    }
    nameError.value = false
  },
  { immediate: true }
)

function handleSave() {
  if (!form.value.name.trim()) {
    nameError.value = true
    return
  }
  nameError.value = false

  const contactName = form.value.contactId
    ? contactStore.contacts.find(c => c.id === form.value.contactId)?.name ?? ''
    : ''
  const packageName = form.value.packageId
    ? packageStore.packages.find(p => p.id === form.value.packageId)?.title ?? ''
    : ''

  const data = {
    name: form.value.name.trim(),
    type: form.value.type,
    location: form.value.location.trim(),
    findHint: form.value.findHint.trim(),
    photoDescription: form.value.photoDescription.trim(),
    expiryDate: form.value.expiryDate ? new Date(form.value.expiryDate).getTime() : null,
    checkDate: form.value.checkDate ? new Date(form.value.checkDate).getTime() : null,
    contactId: form.value.contactId || null,
    contactName,
    packageId: form.value.packageId || null,
    packageName,
    urgency: form.value.urgency,
    needsPeriodicReview: form.value.needsPeriodicReview,
    reviewIntervalDays: form.value.needsPeriodicReview ? form.value.reviewIntervalDays : null,
  }

  if (isEditing.value) {
    emergencyStore.updateItem(props.itemId, data)
    emit('saved', props.itemId)
  } else {
    const newItem = emergencyStore.addItem(data)
    emit('saved', newItem.id)
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-[#FFF8F0]">
    <div class="flex items-center justify-between px-4 py-3 bg-white shadow-sm shrink-0">
      <button
        @click="emit('back')"
        class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        返回
      </button>
      <h2 class="font-serif text-xl font-bold text-warm-900">
        {{ isEditing ? '编辑物品' : '新建物品' }}
      </h2>
      <button
        @click="handleSave"
        class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
        style="background: #E8652B;"
      >
        <Save class="h-5 w-5" />
        保存
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-5">
      <div class="mx-auto max-w-lg space-y-5">
        <div class="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">
              名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="请输入物品名称"
              class="w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
              :class="nameError ? 'border-red-400' : 'border-warm-200'"
              @input="nameError = false"
            />
            <p v-if="nameError" class="text-sm text-red-500">请输入物品名称</p>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">类型</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="key in typeKeys"
                :key="key"
                @click="form.type = key"
                class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all border-2"
                :class="form.type === key
                  ? 'text-white shadow-md'
                  : 'bg-white hover:bg-warm-50'"
                :style="form.type === key
                  ? { backgroundColor: EMERGENCY_ITEM_TYPE_COLORS[key], borderColor: EMERGENCY_ITEM_TYPE_COLORS[key] }
                  : { borderColor: EMERGENCY_ITEM_TYPE_COLORS[key] + '40', color: EMERGENCY_ITEM_TYPE_COLORS[key] }"
              >
                {{ EMERGENCY_ITEM_TYPE_LABELS[key] }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">存放位置</label>
            <input
              v-model="form.location"
              type="text"
              placeholder="请输入存放位置"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">查找提示</label>
            <textarea
              v-model="form.findHint"
              placeholder="帮助找到物品的提示信息"
              rows="3"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white resize-none"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">照片描述</label>
            <input
              v-model="form.photoDescription"
              type="text"
              placeholder="描述物品外观特征"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-warm-700">有效期至</label>
              <input
                v-model="form.expiryDate"
                type="date"
                class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-warm-700">检查日期</label>
              <input
                v-model="form.checkDate"
                type="date"
                class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
              />
            </div>
          </div>
        </div>

        <div class="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">相关联系人</label>
            <select
              v-model="form.contactId"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white appearance-none"
            >
              <option value="">不关联</option>
              <option
                v-for="contact in contactStore.contacts"
                :key="contact.id"
                :value="contact.id"
              >
                {{ contact.name }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">相关资料包</label>
            <select
              v-model="form.packageId"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white appearance-none"
            >
              <option value="">不关联</option>
              <option
                v-for="pkg in packageStore.packages"
                :key="pkg.id"
                :value="pkg.id"
              >
                {{ pkg.title }}
              </option>
            </select>
          </div>
        </div>

        <div class="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm p-5 space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">紧急程度</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="key in urgencyKeys"
                :key="key"
                @click="form.urgency = key"
                class="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all border-2"
                :class="form.urgency === key
                  ? 'text-white shadow-md'
                  : 'bg-white hover:bg-warm-50'"
                :style="form.urgency === key
                  ? { backgroundColor: EMERGENCY_URGENCY_COLORS[key], borderColor: EMERGENCY_URGENCY_COLORS[key] }
                  : { borderColor: EMERGENCY_URGENCY_COLORS[key] + '40', color: EMERGENCY_URGENCY_COLORS[key] }"
              >
                {{ EMERGENCY_URGENCY_LABELS[key] }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-warm-700">需要定期复查</span>
            </div>
            <button
              @click="form.needsPeriodicReview = !form.needsPeriodicReview"
              class="relative w-12 h-7 rounded-full transition-colors"
              :style="{ backgroundColor: form.needsPeriodicReview ? '#E8652B' : '#F0E0D0' }"
            >
              <div
                class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :style="form.needsPeriodicReview ? 'transform: translateX(26px)' : 'transform: translateX(2px)'"
              />
            </button>
          </div>

          <div v-if="form.needsPeriodicReview" class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">复查间隔（天）</label>
            <input
              v-model.number="form.reviewIntervalDays"
              type="number"
              min="1"
              placeholder="请输入复查间隔天数"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            />
          </div>
        </div>

        <div class="h-6" />
      </div>
    </div>
  </div>
</template>
