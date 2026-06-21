<script setup lang="ts">
import type { Contact, ContactGroup } from '@/types'
import { GROUP_LABELS, GROUP_COLORS, generateId } from '@/types'
import { useContactStore } from '@/stores'
import { ref } from 'vue'
import { Plus, X, Save, Star, StarOff, Pencil, Trash2 } from 'lucide-vue-next'

const store = useContactStore()

const defaultForm = () => ({
  name: '',
  phone: '',
  group: 'family' as ContactGroup,
  isEmergency: false,
  note: '',
})

const form = ref(defaultForm())
const editingId = ref<string | null>(null)

const groupKeys = Object.keys(GROUP_LABELS) as ContactGroup[]

function handleSubmit() {
  if (!form.value.name.trim() || !form.value.phone.trim()) return

  const data = {
    name: form.value.name.trim(),
    phone: form.value.phone.trim(),
    group: form.value.group,
    isEmergency: form.value.isEmergency,
    note: form.value.note.trim(),
    priority: Date.now(),
    color: GROUP_COLORS[form.value.group],
  }

  if (editingId.value) {
    store.updateContact(editingId.value, data)
  } else {
    store.addContact(data)
  }

  resetForm()
}

function startEdit(contact: Contact) {
  editingId.value = contact.id
  form.value = {
    name: contact.name,
    phone: contact.phone,
    group: contact.group,
    isEmergency: contact.isEmergency,
    note: contact.note,
  }
}

function cancelEdit() {
  resetForm()
}

function handleDelete(id: string) {
  if (editingId.value === id) {
    resetForm()
  }
  store.removeContact(id)
}

function resetForm() {
  editingId.value = null
  form.value = defaultForm()
}
</script>

<template>
  <div class="space-y-6">
    <h2
      class="text-2xl font-bold text-center"
      style="font-family: 'Noto Serif SC', serif; color: #E8652B;"
    >
      联系人录入
    </h2>

    <div class="rounded-2xl shadow-md p-5 space-y-4" style="background: #FFF8F0;">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">姓名</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="请输入姓名"
            class="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
          />
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">电话</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="请输入电话号码"
            class="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">关系分组</label>
          <select
            v-model="form.group"
            class="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white appearance-none"
          >
            <option v-for="key in groupKeys" :key="key" :value="key">
              {{ GROUP_LABELS[key] }}
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700">备注</label>
          <input
            v-model="form.note"
            type="text"
            placeholder="选填备注"
            class="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
          />
        </div>
      </div>

      <label class="flex items-center gap-3 cursor-pointer select-none py-1">
        <input
          v-model="form.isEmergency"
          type="checkbox"
          class="w-5 h-5 rounded accent-[#E8652B]"
        />
        <Star v-if="form.isEmergency" :size="20" class="text-[#E8652B] fill-[#E8652B]" />
        <StarOff v-else :size="20" class="text-gray-400" />
        <span class="text-base text-gray-700">紧急联系人</span>
      </label>

      <div class="flex gap-3 pt-1">
        <button
          @click="handleSubmit"
          class="flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-medium text-white transition-colors"
          style="background: #E8652B;"
        >
          <Save :size="20" />
          {{ editingId ? '保存修改' : '添加联系人' }}
        </button>

        <button
          v-if="editingId"
          @click="cancelEdit"
          class="flex items-center gap-2 rounded-xl px-6 py-3 text-lg font-medium text-gray-600 border border-gray-300 bg-white transition-colors hover:bg-gray-50"
        >
          <X :size="20" />
          取消
        </button>
      </div>
    </div>

    <div v-if="store.contacts.length > 0" class="space-y-6">
      <div v-for="key in groupKeys" :key="key">
        <div
          v-if="store.groupedContacts[key].length > 0"
          class="space-y-3"
        >
          <h3 class="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <span
              class="inline-block w-3 h-3 rounded-full"
              :style="{ background: GROUP_COLORS[key] }"
            />
            {{ GROUP_LABELS[key] }}
          </h3>

          <div class="space-y-2">
            <div
              v-for="contact in store.groupedContacts[key]"
              :key="contact.id"
              class="rounded-xl shadow-sm p-4 flex items-center gap-3 flex-wrap bg-white border border-gray-100"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-lg font-medium text-gray-800 truncate">{{ contact.name }}</span>
                  <span
                    class="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    :style="{ background: GROUP_COLORS[contact.group] }"
                  >
                    {{ GROUP_LABELS[contact.group] }}
                  </span>
                  <Star
                    v-if="contact.isEmergency"
                    :size="16"
                    class="text-[#E8652B] fill-[#E8652B] shrink-0"
                  />
                </div>
                <div class="text-base text-gray-600 mt-0.5">{{ contact.phone }}</div>
                <div v-if="contact.note" class="text-sm text-gray-400 mt-0.5 truncate">{{ contact.note }}</div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button
                  @click="startEdit(contact)"
                  class="rounded-lg p-2 text-gray-500 hover:text-[#E8652B] hover:bg-orange-50 transition-colors"
                >
                  <Pencil :size="18" />
                </button>
                <button
                  @click="handleDelete(contact.id)"
                  class="rounded-lg p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="text-center py-10 text-gray-400 text-lg"
    >
      暂无联系人，请添加
    </div>
  </div>
</template>
