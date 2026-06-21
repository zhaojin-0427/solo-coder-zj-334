<script setup lang="ts">
import type { ContactGroup, Scenario } from '@/types'
import { GROUP_LABELS, GROUP_COLORS, DEFAULT_SCENARIOS } from '@/types'
import { useContactStore, useLayoutStore } from '@/stores'
import { ref, computed } from 'vue'
import { Heart, Wrench, Pill, Phone, ChevronRight, AlertCircle, Play, Star } from 'lucide-vue-next'

const contactStore = useContactStore()
const layoutStore = useLayoutStore()

const selectedScenario = ref<Scenario | null>(null)
const activeStep = ref(-1)
const isPlaying = ref(false)
let playTimer: ReturnType<typeof setTimeout> | null = null

const ICON_MAP: Record<string, typeof Heart> = {
  heart: Heart,
  wrench: Wrench,
  pill: Pill,
  phone: Phone,
}

const scenarioSteps = computed(() => {
  if (!selectedScenario.value) return []
  return selectedScenario.value.groupOrder
    .filter((g) => contactStore.groupedContacts[g]?.length > 0)
    .map((group, index) => ({
      group,
      label: GROUP_LABELS[group],
      color: GROUP_COLORS[group],
      contacts: contactStore.groupedContacts[group],
      step: index + 1,
    }))
})

function selectScenario(scenario: Scenario) {
  if (playTimer) {
    clearTimeout(playTimer)
    playTimer = null
  }
  isPlaying.value = false
  activeStep.value = -1
  selectedScenario.value = selectedScenario.value?.id === scenario.id ? null : scenario
}

function playSteps() {
  if (!scenarioSteps.value.length) return
  if (isPlaying.value) {
    if (playTimer) clearTimeout(playTimer)
    isPlaying.value = false
    activeStep.value = -1
    return
  }
  isPlaying.value = true
  activeStep.value = 0
  const total = scenarioSteps.value.length

  function tick() {
    if (activeStep.value < total - 1) {
      activeStep.value++
      playTimer = setTimeout(tick, 1500)
    } else {
      playTimer = setTimeout(() => {
        isPlaying.value = false
        activeStep.value = -1
      }, 1500)
    }
  }

  playTimer = setTimeout(tick, 1500)
}
</script>

<template>
  <div class="space-y-6">
    <h2 class="font-serif text-2xl font-bold text-warm-900">场景预演</h2>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="scenario in DEFAULT_SCENARIOS"
        :key="scenario.id"
        @click="selectScenario(scenario)"
        class="flex flex-col items-center gap-2 rounded-2xl bg-white/60 px-4 py-4 backdrop-blur-sm transition-all hover:bg-white/80"
        :class="selectedScenario?.id === scenario.id
          ? 'ring-2 ring-[#E8652B] bg-white/90 shadow-md'
          : 'shadow-sm'"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl transition-all"
          :class="selectedScenario?.id === scenario.id ? 'bg-[#E8652B] text-white' : 'bg-[#FFF0E6] text-[#E8652B]'"
        >
          <component :is="ICON_MAP[scenario.icon]" class="h-6 w-6" />
        </div>
        <span
          class="text-sm font-semibold transition-colors"
          :class="selectedScenario?.id === scenario.id ? 'text-[#E8652B]' : 'text-warm-700'"
        >
          {{ scenario.name }}
        </span>
      </button>
    </div>

    <div v-if="selectedScenario" class="space-y-5">
      <div class="flex items-start gap-3 rounded-2xl bg-[#FFF8F0] px-5 py-4">
        <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-[#E8652B]" />
        <div class="min-w-0">
          <p class="text-sm font-medium text-warm-800">{{ selectedScenario.description }}</p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm font-bold text-warm-700">快速查找顺序</span>
        <button
          @click="playSteps"
          class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
          :class="isPlaying
            ? 'bg-warm-200 text-warm-600'
            : 'bg-[#E8652B] text-white shadow-md hover:bg-[#d45a24]'"
        >
          <Play class="h-4 w-4" :class="{ 'animate-pulse': isPlaying }" />
          <span>{{ isPlaying ? '停止' : '播放' }}</span>
        </button>
      </div>

      <div class="relative space-y-0">
        <div
          v-for="(step, idx) in scenarioSteps"
          :key="step.group"
          class="relative flex gap-4"
        >
          <div class="flex flex-col items-center">
            <div
              class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500"
              :class="[
                activeStep === idx
                  ? 'bg-[#E8652B] text-white scale-110 shadow-lg'
                  : idx < activeStep || (activeStep === -1 && !isPlaying)
                    ? 'bg-warm-100 text-warm-500'
                    : 'bg-warm-200 text-warm-600',
              ]"
              :style="activeStep === idx ? { boxShadow: '0 0 0 4px rgba(232,101,43,0.25)' } : {}"
            >
              <span
                v-if="activeStep === idx"
                class="absolute inset-0 animate-ping rounded-full bg-[#E8652B] opacity-30"
              />
              <span class="relative z-10">{{ step.step }}</span>
            </div>
            <div
              v-if="idx < scenarioSteps.length - 1"
              class="w-0.5 flex-1 min-h-[16px] transition-colors duration-500"
              :class="idx < activeStep ? 'bg-[#E8652B]' : 'bg-warm-200'"
            />
          </div>

          <div
            class="flex-1 rounded-xl bg-white/60 px-4 py-3 backdrop-blur-sm transition-all duration-500"
            :class="[
              activeStep === idx ? 'ring-2 ring-[#E8652B]/40 bg-white/90 shadow-md' : '',
              idx < scenarioSteps.length - 1 ? 'mb-3' : '',
            ]"
          >
            <div class="flex items-center gap-2 mb-2">
              <span
                class="rounded-md px-2 py-0.5 text-xs font-bold text-white"
                :style="{ backgroundColor: step.color }"
              >
                {{ step.label }}
              </span>
              <ChevronRight class="h-4 w-4 text-warm-300" />
            </div>

            <div class="space-y-1.5">
              <div
                v-for="contact in step.contacts"
                :key="contact.id"
                class="flex items-start gap-2 py-0.5"
                :class="{ 'border-l-4 pl-2.5': contact.isEmergency }"
                :style="contact.isEmergency ? { borderColor: '#E8652B' } : {}"
              >
                <Star
                  v-if="contact.isEmergency"
                  class="w-4 h-4 shrink-0 mt-0.5"
                  style="color: #E8652B; fill: #E8652B;"
                />
                <span class="text-sm font-bold text-warm-900">{{ contact.name }}</span>
                <span class="text-sm font-mono text-warm-600 tracking-wide">{{ contact.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
