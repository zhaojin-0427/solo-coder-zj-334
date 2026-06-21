<script setup lang="ts">
import type { ContactGroup } from '@/types'
import { GROUP_LABELS, GROUP_COLORS } from '@/types'
import { useContactStore, useLayoutStore } from '@/stores'
import { computed, ref } from 'vue'
import { GripVertical, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-vue-next'

const contactStore = useContactStore()
const layoutStore = useLayoutStore()

const activeGroup = ref<ContactGroup>(layoutStore.layout.groupOrder[0])

const orderedGroups = computed(() => layoutStore.layout.groupOrder)

function selectGroup(g: ContactGroup) {
  activeGroup.value = g
}

function groupCount(g: ContactGroup) {
  return contactStore.groupedContacts[g].length
}

function currentContacts() {
  return contactStore.groupedContacts[activeGroup.value]
}

function moveGroupUp(g: ContactGroup) {
  const order = [...layoutStore.layout.groupOrder]
  const idx = order.indexOf(g)
  if (idx <= 0) return
  order.splice(idx, 1)
  order.splice(idx - 1, 0, g)
  layoutStore.setGroupOrder(order)
}

function moveGroupDown(g: ContactGroup) {
  const order = [...layoutStore.layout.groupOrder]
  const idx = order.indexOf(g)
  if (idx === -1 || idx >= order.length - 1) return
  order.splice(idx, 1)
  order.splice(idx + 1, 0, g)
  layoutStore.setGroupOrder(order)
}

function moveContactUp(index: number) {
  if (index <= 0) return
  contactStore.reorderInGroup(activeGroup.value, index, index - 1)
}

function moveContactDown(index: number) {
  const list = contactStore.groupedContacts[activeGroup.value]
  if (index >= list.length - 1) return
  contactStore.reorderInGroup(activeGroup.value, index, index + 1)
}
</script>

<template>
  <div class="bg-[#FFF8F0] rounded-2xl p-5 shadow-sm border border-[#F0E0D0]">
    <h2 class="text-lg font-bold text-[#5A3E2B] mb-4" style="font-family: 'Noto Serif SC', serif">
      分组排序
    </h2>

    <div class="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
      <div
        v-for="g in orderedGroups"
        :key="g"
        class="flex items-center gap-1 shrink-0"
      >
        <div class="flex flex-col items-center gap-0.5 mr-0.5">
          <button
            class="p-0.5 rounded hover:bg-[#F0E0D0] text-[#8B7355] disabled:opacity-30 transition-colors"
            :disabled="orderedGroups.indexOf(g) === 0"
            @click="moveGroupUp(g)"
          >
            <ArrowUp :size="12" />
          </button>
          <button
            class="p-0.5 rounded hover:bg-[#F0E0D0] text-[#8B7355] disabled:opacity-30 transition-colors"
            :disabled="orderedGroups.indexOf(g) === orderedGroups.length - 1"
            @click="moveGroupDown(g)"
          >
            <ArrowDown :size="12" />
          </button>
        </div>
        <button
          class="px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border-2"
          :style="{
            backgroundColor: activeGroup === g ? GROUP_COLORS[g] + '20' : '#FFFAF5',
            borderColor: activeGroup === g ? GROUP_COLORS[g] : '#F0E0D0',
            color: activeGroup === g ? GROUP_COLORS[g] : '#8B7355',
          }"
          @click="selectGroup(g)"
        >
          {{ GROUP_LABELS[g] }}
          <span
            class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
            :style="{
              backgroundColor: activeGroup === g ? GROUP_COLORS[g] + '30' : '#F0E0D0',
              color: activeGroup === g ? GROUP_COLORS[g] : '#8B7355',
            }"
          >
            {{ groupCount(g) }}
          </span>
        </button>
      </div>
    </div>

    <div class="mt-4 space-y-2 min-h-[80px]">
      <div
        v-for="(contact, index) in currentContacts()"
        :key="contact.id"
        class="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-[#F0E0D0] hover:shadow-sm transition-shadow"
      >
        <GripVertical :size="16" class="text-[#C4A882] shrink-0" />

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-medium text-[#3D2B1F] truncate">{{ contact.name }}</span>
            <span
              v-if="contact.isEmergency"
              class="inline-flex items-center gap-0.5 text-[10px] font-semibold text-white bg-orange-500 rounded-full px-1.5 py-0.5 shrink-0"
            >
              <AlertTriangle :size="10" />
              急
            </span>
          </div>
          <div class="text-xs text-[#8B7355] mt-0.5">{{ contact.phone }}</div>
        </div>

        <div class="flex flex-col items-center gap-0.5 shrink-0">
          <button
            class="p-1 rounded hover:bg-[#F0E0D0] text-[#8B7355] disabled:opacity-30 transition-colors"
            :disabled="index === 0"
            @click="moveContactUp(index)"
          >
            <ArrowUp :size="14" />
          </button>
          <button
            class="p-1 rounded hover:bg-[#F0E0D0] text-[#8B7355] disabled:opacity-30 transition-colors"
            :disabled="index === currentContacts().length - 1"
            @click="moveContactDown(index)"
          >
            <ArrowDown :size="14" />
          </button>
        </div>
      </div>

      <div
        v-if="currentContacts().length === 0"
        class="text-center text-sm text-[#B8A08A] py-8"
      >
        暂无联系人
      </div>
    </div>
  </div>
</template>
