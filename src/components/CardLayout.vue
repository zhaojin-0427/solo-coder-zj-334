<script setup lang="ts">
import type { CardFormat, FontSize, ContactGroup } from '@/types'
import { GROUP_LABELS, GROUP_COLORS, FONT_SIZE_MAP, FORMAT_LABELS } from '@/types'
import { useContactStore, useLayoutStore } from '@/stores'
import { computed, ref } from 'vue'
import { Phone, Refrigerator, CreditCard, Type, Palette, LayoutGrid, Star } from 'lucide-vue-next'

const contactStore = useContactStore()
const layoutStore = useLayoutStore()

const ACCENT_COLORS = ['#E8652B', '#D94F4F', '#5B9BD5', '#7BAE7F', '#E8A838', '#9B6DB7']
const FORMATS: CardFormat[] = ['phone-side', 'fridge', 'pocket']
const FONT_SIZES: FontSize[] = ['medium', 'large', 'extra-large']

const FORMAT_ICONS: Record<CardFormat, typeof Phone> = {
  'phone-side': Phone,
  'fridge': Refrigerator,
  'pocket': CreditCard,
}

const orderedGroups = computed(() =>
  layoutStore.layout.groupOrder.filter((g) => contactStore.groupedContacts[g]?.length > 0)
)

const fontSizeConfig = computed(() => FONT_SIZE_MAP[layoutStore.layout.fontSize])
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-serif text-2xl font-bold text-warm-900">卡片排版</h2>

    <div class="space-y-4 rounded-2xl bg-white/60 p-5 backdrop-blur-sm">
      <div class="flex items-center gap-3 flex-wrap">
        <LayoutGrid class="w-5 h-5 shrink-0 text-warm-500" />
        <span class="text-sm font-medium text-warm-700 shrink-0">卡片格式</span>
        <div class="flex gap-2">
          <button
            v-for="f in FORMATS"
            :key="f"
            @click="layoutStore.setFormat(f)"
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-all"
            :class="layoutStore.layout.format === f
              ? 'bg-warm-500 text-white shadow-md'
              : 'bg-warm-50 text-warm-700 hover:bg-warm-100'"
          >
            <component :is="FORMAT_ICONS[f]" class="w-4 h-4" />
            <span>{{ FORMAT_LABELS[f] }}</span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <Type class="w-5 h-5 shrink-0 text-warm-500" />
        <span class="text-sm font-medium text-warm-700 shrink-0">字体大小</span>
        <div class="flex gap-2">
          <button
            v-for="fs in FONT_SIZES"
            :key="fs"
            @click="layoutStore.setFontSize(fs)"
            class="rounded-full px-4 py-1.5 text-sm transition-all"
            :class="layoutStore.layout.fontSize === fs
              ? 'bg-warm-500 text-white shadow-md'
              : 'bg-warm-50 text-warm-700 hover:bg-warm-100'"
          >
            {{ FONT_SIZE_MAP[fs].label }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-3 flex-wrap">
        <Palette class="w-5 h-5 shrink-0 text-warm-500" />
        <span class="text-sm font-medium text-warm-700 shrink-0">主题色</span>
        <div class="flex gap-3">
          <button
            v-for="c in ACCENT_COLORS"
            :key="c"
            @click="layoutStore.setAccentColor(c)"
            class="w-8 h-8 rounded-full transition-all"
            :class="layoutStore.layout.accentColor === c
              ? 'ring-2 ring-offset-2 scale-110'
              : 'hover:scale-105'"
            :style="{
              backgroundColor: c,
              '--tw-ring-color': c,
            }"
          />
        </div>
      </div>
    </div>

    <div class="flex justify-center">
      <div
        v-if="layoutStore.layout.format === 'phone-side'"
        class="w-full max-w-[400px] rounded-2xl bg-white shadow-lg overflow-hidden"
      >
        <div
          class="px-6 py-4 text-white"
          :style="{ backgroundColor: layoutStore.layout.accentColor }"
        >
          <h3 :class="fontSizeConfig.name" class="font-bold">家庭电话本</h3>
        </div>
        <div :class="fontSizeConfig.base" class="divide-y divide-warm-100">
          <div v-for="group in orderedGroups" :key="group">
            <div
              class="px-6 py-2 font-bold text-white"
              :class="fontSizeConfig.group"
              :style="{ backgroundColor: GROUP_COLORS[group] }"
            >
              {{ GROUP_LABELS[group] }}
            </div>
            <div class="px-6 py-2 space-y-2">
              <div
                v-for="contact in contactStore.groupedContacts[group]"
                :key="contact.id"
                class="flex items-start gap-2 py-1"
                :class="{ 'border-l-4 pl-3': contact.isEmergency }"
                :style="contact.isEmergency ? { borderColor: layoutStore.layout.accentColor } : {}"
              >
                <Star
                  v-if="contact.isEmergency"
                  class="w-5 h-5 shrink-0 mt-0.5"
                  :style="{ color: layoutStore.layout.accentColor }"
                />
                <div class="flex-1 min-w-0">
                  <div :class="fontSizeConfig.name" class="font-bold text-warm-900">{{ contact.name }}</div>
                  <div :class="fontSizeConfig.phone" class="text-warm-800 font-mono tracking-wide">{{ contact.phone }}</div>
                  <div v-if="contact.note" class="text-warm-400 text-sm mt-0.5">{{ contact.note }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="layoutStore.layout.format === 'fridge'"
        class="w-full max-w-[640px] rounded-2xl bg-white shadow-lg overflow-hidden"
      >
        <div
          class="px-8 py-4 text-white flex items-center justify-between"
          :style="{ backgroundColor: layoutStore.layout.accentColor }"
        >
          <h3 :class="fontSizeConfig.name" class="font-bold">家庭应急联系卡</h3>
          <span class="text-sm opacity-80">冰箱门贴</span>
        </div>
        <div :class="fontSizeConfig.base" class="grid grid-cols-2">
          <div
            v-for="(group, idx) in orderedGroups"
            :key="group"
            class="p-4 border-b border-warm-100"
            :class="[
              idx % 2 === 0 ? 'border-r' : '',
              orderedGroups.length % 2 === 1 && idx === orderedGroups.length - 1 ? 'col-span-2' : ''
            ]"
          >
            <div
              class="rounded-lg px-3 py-1.5 mb-3 font-bold text-white text-center"
              :class="fontSizeConfig.group"
              :style="{ backgroundColor: GROUP_COLORS[group] }"
            >
              {{ GROUP_LABELS[group] }}
            </div>
            <div class="space-y-2">
              <div
                v-for="contact in contactStore.groupedContacts[group]"
                :key="contact.id"
                class="flex items-start gap-1.5"
                :class="{ 'border-l-4 pl-2': contact.isEmergency }"
                :style="contact.isEmergency ? { borderColor: layoutStore.layout.accentColor } : {}"
              >
                <Star
                  v-if="contact.isEmergency"
                  class="w-4 h-4 shrink-0 mt-0.5"
                  :style="{ color: layoutStore.layout.accentColor }"
                />
                <div class="min-w-0">
                  <div :class="fontSizeConfig.name" class="font-bold text-warm-900">{{ contact.name }}</div>
                  <div :class="fontSizeConfig.phone" class="text-warm-800 font-mono tracking-wide">{{ contact.phone }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="w-full max-w-[360px] rounded-2xl bg-white shadow-lg overflow-hidden"
      >
        <div
          class="px-4 py-3 text-white text-center"
          :style="{ backgroundColor: layoutStore.layout.accentColor }"
        >
          <h3 :class="fontSizeConfig.group" class="font-bold">随身联系卡</h3>
        </div>
        <div :class="fontSizeConfig.base" class="p-3 space-y-3">
          <div v-for="group in orderedGroups" :key="group">
            <div
              class="rounded px-2 py-0.5 mb-1.5 font-bold text-white text-center"
              :class="fontSizeConfig.group"
              :style="{ backgroundColor: GROUP_COLORS[group] }"
            >
              {{ GROUP_LABELS[group] }}
            </div>
            <div class="grid grid-cols-2 gap-x-3 gap-y-1">
              <div
                v-for="contact in contactStore.groupedContacts[group]"
                :key="contact.id"
                class="flex items-start gap-1"
                :class="{ 'border-l-2 pl-1.5': contact.isEmergency }"
                :style="contact.isEmergency ? { borderColor: layoutStore.layout.accentColor } : {}"
              >
                <Star
                  v-if="contact.isEmergency"
                  class="shrink-0 mt-0.5"
                  :size="12"
                  :style="{ color: layoutStore.layout.accentColor }"
                />
                <div class="min-w-0">
                  <div class="font-bold text-warm-900 truncate" :class="fontSizeConfig.name">{{ contact.name }}</div>
                  <div class="text-warm-700 font-mono truncate" :class="fontSizeConfig.phone">{{ contact.phone }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
