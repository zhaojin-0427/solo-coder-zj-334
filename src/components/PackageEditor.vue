<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePackageStore, useContactStore } from '@/stores'
import type { Contact, ContactGroup } from '@/types'
import { GROUP_LABELS, GROUP_COLORS, PACKAGE_DEFAULT_GUIDE_TEXTS } from '@/types'
import {
  ArrowLeft, Save, Trash2, Star, ChevronUp, ChevronDown,
  Plus, X, MessageCircle, Heart, UserPlus, AlertCircle, Home
} from 'lucide-vue-next'

const props = defineProps<{
  packageId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'play', id: string): void
}>()

const packageStore = usePackageStore()
const contactStore = useContactStore()

const pkg = computed(() => packageStore.getPackageById(props.packageId))
const sortedContacts = computed(() => {
  if (!pkg.value) return []
  return [...pkg.value.contacts].sort((a, b) => a.order - b.order)
})

const selectedGroup = ref<ContactGroup | 'all'>('all')

const filteredContacts = computed(() => {
  if (selectedGroup.value === 'all') return contactStore.contacts
  return contactStore.groupedContacts[selectedGroup.value]
})

function isInPackage(contactId: string): boolean {
  if (!pkg.value) return false
  return pkg.value.contacts.some(c => c.contactId === contactId)
}

function addContact(contact: Contact) {
  if (!pkg.value) return
  packageStore.addContactToPackage(props.packageId, contact)
}

function removeContact(contactId: string) {
  if (!pkg.value) return
  packageStore.removeContactFromPackage(props.packageId, contactId)
}

function moveContactUp(idx: number) {
  if (!pkg.value || idx <= 0) return
  packageStore.reorderPackageContacts(props.packageId, idx, idx - 1)
}

function moveContactDown(idx: number) {
  if (!pkg.value) return
  const contacts = sortedContacts.value
  if (idx >= contacts.length - 1) return
  packageStore.reorderPackageContacts(props.packageId, idx, idx + 1)
}

function toggleKeyPoint(contactId: string) {
  if (!pkg.value) return
  const contact = pkg.value.contacts.find(c => c.contactId === contactId)
  if (contact) {
    packageStore.updatePackageContact(props.packageId, contactId, { isKeyPoint: !contact.isKeyPoint })
  }
}

function updateField(field: 'title' | 'purpose' | 'guideText' | 'familyReminder', value: string) {
  if (!pkg.value) return
  packageStore.updatePackage(props.packageId, { [field]: value })
}

const groupOptions: { key: ContactGroup | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'family', label: '亲属' },
  { key: 'neighbor', label: '邻居' },
  { key: 'community', label: '社区网格员' },
  { key: 'hospital', label: '常去医院' },
  { key: 'repair', label: '维修师傅' },
  { key: 'pharmacy', label: '药店' },
]
</script>

<template>
  <div v-if="pkg" class="space-y-6">
    <div class="flex items-center gap-3">
      <button
        @click="emit('back')"
        class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
      >
        <ArrowLeft class="h-4 w-4" />
        返回列表
      </button>
      <h2 class="font-serif text-2xl font-bold text-warm-900 flex-1">编辑资料包</h2>
      <button
        @click="emit('play', pkg.id)"
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
        style="background: #E8652B;"
      >
        <MessageCircle class="h-5 w-5" />
        查看资料包
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-5">
        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
            <Home class="h-5 w-5 text-[#E8652B]" />
            基本信息
          </h3>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">资料包标题</label>
            <input
              :value="pkg.title"
              @input="updateField('title', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="请输入资料包标题"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">用途说明</label>
            <textarea
              :value="pkg.purpose"
              @input="updateField('purpose', ($event.target as HTMLTextAreaElement).value)"
              placeholder="这个资料包的用途是什么"
              rows="2"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white resize-none"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">导览语</label>
            <textarea
              :value="pkg.guideText"
              @input="updateField('guideText', ($event.target as HTMLTextAreaElement).value)"
              placeholder="打开资料包时显示的引导语"
              rows="3"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white resize-none"
            />
            <div class="flex flex-wrap gap-2">
              <span class="text-xs text-warm-400">快捷导览语：</span>
              <button
                v-for="(text, idx) in PACKAGE_DEFAULT_GUIDE_TEXTS"
                :key="idx"
                @click="updateField('guideText', text)"
                class="text-xs text-warm-500 hover:text-[#E8652B] underline"
              >
                {{ text.slice(0, 10) }}...
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-warm-700">家属提醒</label>
            <textarea
              :value="pkg.familyReminder"
              @input="updateField('familyReminder', ($event.target as HTMLTextAreaElement).value)"
              placeholder="给家属看的提醒事项"
              rows="2"
              class="w-full rounded-xl border border-warm-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#E8652B]/40 focus:border-[#E8652B] bg-white resize-none"
            />
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-warm-100">
            <div class="flex items-center gap-2">
              <Star
                class="h-5 w-5"
                :class="pkg.isHighlighted ? 'text-[#E8652B] fill-[#E8652B]' : 'text-warm-300'"
              />
              <span class="text-sm text-warm-600">设为重点资料包</span>
            </div>
            <button
              @click="packageStore.toggleHighlight(pkg.id)"
              class="relative w-12 h-7 rounded-full transition-colors"
              :style="{ backgroundColor: pkg.isHighlighted ? '#E8652B' : '#F0E0D0' }"
            >
              <div
                class="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :style="pkg.isHighlighted ? 'transform: translateX(26px)' : 'transform: translateX(2px)'"
              />
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
            <UserPlus class="h-5 w-5 text-[#E8652B]" />
            选择联系人
          </h3>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="opt in groupOptions"
              :key="opt.key"
              @click="selectedGroup = opt.key"
              class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              :style="selectedGroup === opt.key
                ? { backgroundColor: '#E8652B', color: 'white' }
                : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
            >
              {{ opt.label }}
            </button>
          </div>

          <div class="max-h-80 overflow-y-auto space-y-2 pr-1">
            <div v-if="filteredContacts.length === 0" class="text-center py-6 text-warm-400">
              该分组暂无联系人
            </div>
            <div
              v-for="contact in filteredContacts"
              :key="contact.id"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              :class="isInPackage(contact.id) ? 'bg-orange-50' : 'bg-warm-50 hover:bg-warm-100'"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-warm-800 truncate">{{ contact.name }}</span>
                  <span
                    v-if="contact.isEmergency"
                    class="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium"
                  >
                    紧急
                  </span>
                </div>
                <p class="text-xs text-warm-500 font-mono">{{ contact.phone }}</p>
              </div>
              <button
                v-if="isInPackage(contact.id)"
                @click="removeContact(contact.id)"
                class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-warm-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X class="h-3.5 w-3.5" />
                移除
              </button>
              <button
                v-else
                @click="addContact(contact)"
                class="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white bg-[#E8652B] hover:bg-[#d45a24] transition-colors"
              >
                <Plus class="h-3.5 w-3.5" />
                添加
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
              <AlertCircle class="h-5 w-5 text-[#E8652B]" />
              资料包内容
            </h3>
            <span class="text-sm text-warm-400">{{ sortedContacts.length }} 位联系人</span>
          </div>

          <div v-if="sortedContacts.length === 0" class="text-center py-10">
            <Heart class="mx-auto mb-3 h-10 w-10 text-warm-300" />
            <p class="text-warm-400">还没有添加联系人</p>
            <p class="text-sm text-warm-300 mt-1">从左侧选择联系人添加到资料包</p>
          </div>

          <div v-else class="space-y-2 max-h-96 overflow-y-auto pr-1">
            <div
              v-for="(pc, idx) in sortedContacts"
              :key="pc.contactId"
              class="flex items-center gap-3 rounded-xl bg-warm-50 px-3 py-3"
            >
              <span class="text-lg font-bold text-warm-300 w-6 text-center">{{ idx + 1 }}</span>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-warm-800 truncate">{{ pc.contactName }}</span>
                  <Star
                    v-if="pc.isKeyPoint"
                    class="h-3.5 w-3.5 shrink-0 text-[#E8652B] fill-[#E8652B]"
                  />
                  <span
                    class="text-xs px-1.5 py-0.5 rounded text-white font-medium"
                    :style="{ backgroundColor: GROUP_COLORS[pc.contactGroup] }"
                  >
                    {{ GROUP_LABELS[pc.contactGroup] }}
                  </span>
                </div>
                <p class="text-xs text-warm-500 font-mono mt-0.5">{{ pc.contactPhone }}</p>
              </div>

              <div class="flex flex-col gap-0.5">
                <button
                  @click="moveContactUp(idx)"
                  :disabled="idx === 0"
                  class="p-1 text-warm-400 hover:text-[#E8652B] transition-colors disabled:opacity-30"
                >
                  <ChevronUp class="h-3.5 w-3.5" />
                </button>
                <button
                  @click="moveContactDown(idx)"
                  :disabled="idx === sortedContacts.length - 1"
                  class="p-1 text-warm-400 hover:text-[#E8652B] transition-colors disabled:opacity-30"
                >
                  <ChevronDown class="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                @click="toggleKeyPoint(pc.contactId)"
                class="p-1.5 rounded-lg transition-colors"
                :class="pc.isKeyPoint ? 'text-[#E8652B]' : 'text-warm-300 hover:text-warm-500'"
                :title="pc.isKeyPoint ? '取消重点' : '设为重点'"
              >
                <Star
                  class="h-4 w-4"
                  :class="pc.isKeyPoint ? 'fill-[#E8652B]' : ''"
                />
              </button>

              <button
                @click="removeContact(pc.contactId)"
                class="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="pt-3 border-t border-warm-100 text-sm text-warm-500">
            <p>💡 提示：拖拽排序或使用上下箭头调整顺序，星标标记重点联系人</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
