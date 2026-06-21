<script setup lang="ts">
import type { ContactGroup } from '@/types'
import { GROUP_LABELS, GROUP_COLORS, FONT_SIZE_MAP, FORMAT_LABELS } from '@/types'
import { useContactStore, useLayoutStore } from '@/stores'
import { ref, computed } from 'vue'
import { FileDown, CreditCard, Maximize2, Minimize2, Star } from 'lucide-vue-next'

const contactStore = useContactStore()
const layoutStore = useLayoutStore()

const layout = layoutStore.layout

const isFullscreen = ref(false)
const isPocketMode = ref(false)
const isExporting = ref(false)

const cardRef = ref<HTMLElement | null>(null)

const orderedGroups = computed(() =>
  layout.groupOrder.filter((g) => contactStore.groupedContacts[g]?.length > 0)
)

const fontSizeConfig = computed(() => FONT_SIZE_MAP[layout.fontSize])

const emergencyOnlyGroups = computed(() =>
  layout.groupOrder.filter(
    (g) => contactStore.groupedContacts[g]?.some((c) => c.isEmergency)
  )
)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function togglePocketMode() {
  isPocketMode.value = !isPocketMode.value
}

async function exportPDF() {
  const el = cardRef.value
  if (!el) return
  isExporting.value = true
  try {
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).default
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: layout.format === 'fridge' ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
    const pdfW = pdf.internal.pageSize.getWidth()
    const pdfH = pdf.internal.pageSize.getHeight()
    const imgW = canvas.width
    const imgH = canvas.height
    const ratio = Math.min(pdfW / imgW, pdfH / imgH)
    const w = imgW * ratio
    const h = imgH * ratio
    pdf.addImage(imgData, 'PNG', (pdfW - w) / 2, (pdfH - h) / 2, w, h)
    pdf.save('应急联系卡.pdf')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h2
      class="text-2xl font-bold text-center"
      style="font-family: 'Noto Serif SC', serif; color: #E8652B;"
    >
      打印预览
    </h2>

    <div class="flex items-center justify-center gap-3 flex-wrap">
      <button
        @click="toggleFullscreen"
        class="flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-medium text-white transition-colors"
        style="background: #E8652B;"
      >
        <Maximize2 v-if="!isFullscreen" :size="20" />
        <Minimize2 v-else :size="20" />
        全屏预览
      </button>

      <button
        @click="exportPDF"
        :disabled="isExporting"
        class="flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-medium text-white transition-colors disabled:opacity-50"
        style="background: #E8652B;"
      >
        <FileDown :size="20" />
        {{ isExporting ? '导出中…' : '导出PDF' }}
      </button>

      <button
        @click="togglePocketMode"
        class="flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-medium transition-colors border-2"
        :style="{
          borderColor: '#E8652B',
          color: isPocketMode ? '#fff' : '#E8652B',
          background: isPocketMode ? '#E8652B' : '#fff',
        }"
      >
        <CreditCard :size="20" />
        口袋卡
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isFullscreen"
        class="fixed inset-0 z-50 flex items-center justify-center"
        style="background: rgba(0,0,0,0.7);"
      >
        <button
          @click="toggleFullscreen"
          class="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-xl px-4 py-2 text-base font-medium text-white transition-colors"
          style="background: rgba(0,0,0,0.6);"
        >
          <Minimize2 :size="18" />
          关闭预览
        </button>

        <div class="overflow-auto max-h-screen p-8">
          <div class="bg-white inline-block" style="min-width: 320px;">
            <div v-if="isPocketMode">
              <div
                class="px-4 py-3 text-white text-center"
                :style="{ backgroundColor: layout.accentColor }"
              >
                <h3 :class="fontSizeConfig.group" class="font-bold">应急联系卡</h3>
              </div>
              <div :class="fontSizeConfig.base" class="p-3">
                <div v-if="emergencyOnlyGroups.length === 0" class="text-center py-6">
                  <div class="text-warm-400" :class="fontSizeConfig.base">
                    暂无紧急联系人
                  </div>
                  <div class="text-warm-300 text-sm mt-2">
                    请在联系人录入中标记紧急联系人
                  </div>
                </div>
                <div v-else class="grid grid-cols-2 gap-3">
                  <div v-for="group in emergencyOnlyGroups" :key="group">
                    <div
                      class="rounded px-2 py-0.5 mb-1 font-bold text-white text-center"
                      :class="fontSizeConfig.group"
                      :style="{ backgroundColor: GROUP_COLORS[group] }"
                    >
                      {{ GROUP_LABELS[group] }}
                    </div>
                    <div class="space-y-1">
                      <div
                        v-for="contact in contactStore.groupedContacts[group].filter(c => c.isEmergency)"
                        :key="contact.id"
                        class="border-l-4 pl-1.5"
                        :style="{ borderColor: layout.accentColor }"
                      >
                        <div class="font-bold truncate" :class="fontSizeConfig.name" style="color: #3D2B1F;">{{ contact.name }}</div>
                        <div class="font-mono tracking-wide truncate" :class="fontSizeConfig.phone" style="color: #5C4033;">{{ contact.phone }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="layout.format === 'phone-side'">
              <div
                class="px-6 py-4 text-white"
                :style="{ backgroundColor: layout.accentColor }"
              >
                <h3 :class="fontSizeConfig.name" class="font-bold">家庭电话本</h3>
              </div>
              <div :class="fontSizeConfig.base">
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
                      :class="{ 'border-l-4 pl-2': contact.isEmergency }"
                      :style="contact.isEmergency ? { borderColor: layout.accentColor } : {}"
                    >
                      <div class="min-w-0">
                        <div :class="fontSizeConfig.name" class="font-bold" style="color: #3D2B1F;">{{ contact.name }}</div>
                        <div :class="fontSizeConfig.phone" class="font-mono tracking-wide" style="color: #5C4033;">{{ contact.phone }}</div>
                        <div v-if="contact.note" class="text-sm" style="color: #9C8B7A;">{{ contact.note }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="layout.format === 'fridge'">
              <div
                class="px-6 py-4 text-white text-center"
                :style="{ backgroundColor: layout.accentColor }"
              >
                <h3 :class="fontSizeConfig.name" class="font-bold">家庭应急联系卡</h3>
              </div>
              <div :class="fontSizeConfig.base" class="grid grid-cols-2">
                <div
                  v-for="(group, idx) in orderedGroups"
                  :key="group"
                  class="p-4"
                  :class="[
                    idx % 2 === 0 ? 'border-r' : '',
                    'border-b'
                  ]"
                  style="border-color: #F0E0D0;"
                >
                  <div
                    class="px-3 py-1.5 mb-3 font-bold text-white text-center"
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
                      :style="contact.isEmergency ? { borderColor: layout.accentColor } : {}"
                    >
                      <div class="min-w-0">
                        <div :class="fontSizeConfig.name" class="font-bold" style="color: #3D2B1F;">{{ contact.name }}</div>
                        <div :class="fontSizeConfig.phone" class="font-mono tracking-wide" style="color: #5C4033;">{{ contact.phone }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else>
              <div
                class="px-4 py-3 text-white text-center"
                :style="{ backgroundColor: layout.accentColor }"
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
                      :style="contact.isEmergency ? { borderColor: layout.accentColor } : {}"
                    >
                      <div class="min-w-0">
                        <div class="font-bold truncate" :class="fontSizeConfig.name" style="color: #3D2B1F;">{{ contact.name }}</div>
                        <div class="font-mono tracking-wide truncate" :class="fontSizeConfig.phone" style="color: #5C4033;">{{ contact.phone }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="flex justify-center rounded-2xl p-6" style="background: #FFF8F0;">
      <div ref="cardRef" class="bg-white inline-block" style="min-width: 320px;">
        <div v-if="isPocketMode">
          <div
            class="px-4 py-3 text-white text-center"
            :style="{ backgroundColor: layout.accentColor }"
          >
            <h3 :class="fontSizeConfig.group" class="font-bold">应急联系卡</h3>
          </div>
          <div :class="fontSizeConfig.base" class="p-3">
            <div v-if="emergencyOnlyGroups.length === 0" class="text-center py-6">
              <div class="text-warm-400" :class="fontSizeConfig.base">
                暂无紧急联系人
              </div>
              <div class="text-warm-300 text-sm mt-2">
                请在联系人录入中标记紧急联系人
              </div>
            </div>
            <div v-else class="grid grid-cols-2 gap-3">
              <div v-for="group in emergencyOnlyGroups" :key="group">
                <div
                  class="rounded px-2 py-0.5 mb-1 font-bold text-white text-center"
                  :class="fontSizeConfig.group"
                  :style="{ backgroundColor: GROUP_COLORS[group] }"
                >
                  {{ GROUP_LABELS[group] }}
                </div>
                <div class="space-y-1">
                  <div
                    v-for="contact in contactStore.groupedContacts[group].filter(c => c.isEmergency)"
                    :key="contact.id"
                    class="border-l-4 pl-1.5"
                    :style="{ borderColor: layout.accentColor }"
                  >
                    <div class="font-bold truncate" :class="fontSizeConfig.name" style="color: #3D2B1F;">{{ contact.name }}</div>
                    <div class="font-mono tracking-wide truncate" :class="fontSizeConfig.phone" style="color: #5C4033;">{{ contact.phone }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="layout.format === 'phone-side'">
          <div
            class="px-6 py-4 text-white"
            :style="{ backgroundColor: layout.accentColor }"
          >
            <h3 :class="fontSizeConfig.name" class="font-bold">家庭电话本</h3>
          </div>
          <div :class="fontSizeConfig.base">
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
                  :class="{ 'border-l-4 pl-2': contact.isEmergency }"
                  :style="contact.isEmergency ? { borderColor: layout.accentColor } : {}"
                >
                  <div class="min-w-0">
                    <div :class="fontSizeConfig.name" class="font-bold" style="color: #3D2B1F;">{{ contact.name }}</div>
                    <div :class="fontSizeConfig.phone" class="font-mono tracking-wide" style="color: #5C4033;">{{ contact.phone }}</div>
                    <div v-if="contact.note" class="text-sm" style="color: #9C8B7A;">{{ contact.note }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="layout.format === 'fridge'">
          <div
            class="px-6 py-4 text-white text-center"
            :style="{ backgroundColor: layout.accentColor }"
          >
            <h3 :class="fontSizeConfig.name" class="font-bold">家庭应急联系卡</h3>
          </div>
          <div :class="fontSizeConfig.base" class="grid grid-cols-2">
            <div
              v-for="(group, idx) in orderedGroups"
              :key="group"
              class="p-4"
              :class="[
                idx % 2 === 0 ? 'border-r' : '',
                'border-b'
              ]"
              style="border-color: #F0E0D0;"
            >
              <div
                class="px-3 py-1.5 mb-3 font-bold text-white text-center"
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
                  :style="contact.isEmergency ? { borderColor: layout.accentColor } : {}"
                >
                  <div class="min-w-0">
                    <div :class="fontSizeConfig.name" class="font-bold" style="color: #3D2B1F;">{{ contact.name }}</div>
                    <div :class="fontSizeConfig.phone" class="font-mono tracking-wide" style="color: #5C4033;">{{ contact.phone }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <div
            class="px-4 py-3 text-white text-center"
            :style="{ backgroundColor: layout.accentColor }"
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
                  :style="contact.isEmergency ? { borderColor: layout.accentColor } : {}"
                >
                  <div class="min-w-0">
                    <div class="font-bold truncate" :class="fontSizeConfig.name" style="color: #3D2B1F;">{{ contact.name }}</div>
                    <div class="font-mono tracking-wide truncate" :class="fontSizeConfig.phone" style="color: #5C4033;">{{ contact.phone }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
