<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePackageStore } from '@/stores'
import { GROUP_LABELS, GROUP_COLORS } from '@/types'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Star, Phone,
  Volume2, Home, Heart, AlertTriangle, BookOpen
} from 'lucide-vue-next'

const props = defineProps<{
  packageId: string
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'edit', id: string): void
}>()

const packageStore = usePackageStore()

const pkg = computed(() => packageStore.getPackageById(props.packageId))
const sortedContacts = computed(() => {
  if (!pkg.value) return []
  return [...pkg.value.contacts].sort((a, b) => a.order - b.order)
})

const currentIndex = ref(0)
const showGuide = ref(true)
const autoPlay = ref(false)
let autoPlayTimer: ReturnType<typeof setInterval> | null = null

const currentContact = computed(() => {
  if (!pkg.value || sortedContacts.value.length === 0) return null
  return sortedContacts.value[currentIndex.value]
})

function goPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function goNext() {
  if (currentIndex.value < sortedContacts.value.length - 1) {
    currentIndex.value++
  }
}

function goTo(index: number) {
  currentIndex.value = index
}

function toggleAutoPlay() {
  autoPlay.value = !autoPlay.value
  if (autoPlay.value) {
    startAutoPlay()
  } else {
    stopAutoPlay()
  }
}

function startAutoPlay() {
  stopAutoPlay()
  autoPlayTimer = setInterval(() => {
    if (currentIndex.value < sortedContacts.value.length - 1) {
      currentIndex.value++
    } else {
      stopAutoPlay()
      autoPlay.value = false
    }
  }, 5000)
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer)
    autoPlayTimer = null
  }
}

function closeGuide() {
  showGuide.value = false
}

watch(() => props.packageId, () => {
  currentIndex.value = 0
  showGuide.value = true
  stopAutoPlay()
  autoPlay.value = false
})

onUnmounted(() => {
  stopAutoPlay()
})

const progressPercent = computed(() => {
  if (sortedContacts.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / sortedContacts.value.length) * 100)
})
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
      <h2 class="font-serif text-2xl font-bold text-warm-900 flex-1 truncate">{{ pkg.title }}</h2>
      <button
        @click="emit('edit', pkg.id)"
        class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
      >
        <BookOpen class="h-4 w-4" />
        编辑
      </button>
    </div>

    <div v-if="sortedContacts.length === 0" class="rounded-3xl bg-white shadow-lg p-10 text-center">
      <Heart class="mx-auto mb-4 h-16 w-16 text-warm-300" />
      <p class="text-xl text-warm-500">这个资料包还没有联系人</p>
      <p class="text-base text-warm-400 mt-2">请先编辑添加联系人</p>
    </div>

    <div v-else class="space-y-5">
      <div v-if="showGuide && pkg.guideText" class="rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg p-6 border-2 border-[#E8652B]/20">
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-[#E8652B] flex items-center justify-center shrink-0">
            <Volume2 class="h-7 w-7 text-white" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-[#E8652B] mb-2">导览语</p>
            <p class="text-lg text-warm-800 leading-relaxed">{{ pkg.guideText }}</p>
          </div>
          <button
            @click="closeGuide"
            class="text-warm-400 hover:text-warm-600 shrink-0"
          >
            <ChevronRight class="h-6 w-6 -rotate-90" />
          </button>
        </div>
      </div>

      <div class="w-full rounded-full bg-warm-100 h-2">
        <div
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: progressPercent + '%', backgroundColor: '#E8652B' }"
        />
      </div>

      <div class="flex items-center justify-between text-sm text-warm-500">
        <span>第 {{ currentIndex + 1 }} / {{ sortedContacts.length }} 位</span>
        <span>{{ progressPercent }}%</span>
      </div>

      <div v-if="currentContact" class="rounded-3xl bg-white shadow-lg p-8 border-2 border-[#E8652B]/20">
        <div class="text-center space-y-4">
          <div class="flex items-center justify-center gap-2">
            <span
              class="rounded-lg px-3 py-1 text-base font-bold text-white"
              :style="{ backgroundColor: GROUP_COLORS[currentContact.contactGroup] }"
            >
              {{ GROUP_LABELS[currentContact.contactGroup] }}
            </span>
            <Star
              v-if="currentContact.isKeyPoint"
              class="h-6 w-6 text-[#E8652B] fill-[#E8652B]"
            />
          </div>

          <p class="text-4xl font-bold text-warm-900" style="font-family: 'Noto Serif SC', serif;">
            {{ currentContact.contactName }}
          </p>

          <div class="flex items-center justify-center gap-3 py-4">
            <div class="w-16 h-16 rounded-2xl bg-[#E8652B]/10 flex items-center justify-center">
              <Phone class="h-8 w-8 text-[#E8652B]" />
            </div>
            <span class="text-5xl font-mono font-bold text-[#E8652B] tracking-wider">
              {{ currentContact.contactPhone }}
            </span>
          </div>

          <div v-if="currentContact.contactNote" class="bg-warm-50 rounded-2xl px-6 py-3">
            <p class="text-lg text-warm-600">💡 {{ currentContact.contactNote }}</p>
          </div>

          <div v-if="currentContact.customNote" class="bg-orange-50 rounded-2xl px-6 py-3">
            <p class="text-lg text-orange-700">📝 {{ currentContact.customNote }}</p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center gap-4">
        <button
          @click="goPrev"
          :disabled="currentIndex === 0"
          class="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg"
        >
          <ChevronLeft class="h-7 w-7 text-warm-600" />
        </button>

        <button
          @click="toggleAutoPlay"
          class="flex items-center gap-2 rounded-2xl px-6 py-4 text-lg font-semibold transition-all shadow-md hover:shadow-lg"
          :style="autoPlay
            ? { backgroundColor: '#5C9460', color: 'white' }
            : { backgroundColor: '#E8652B', color: 'white' }"
        >
          <Volume2 class="h-6 w-6" />
          {{ autoPlay ? '自动播放中' : '自动播放' }}
        </button>

        <button
          @click="goNext"
          :disabled="currentIndex === sortedContacts.length - 1"
          class="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg"
        >
          <ChevronRight class="h-7 w-7 text-warm-600" />
        </button>
      </div>

      <div class="flex items-center justify-center gap-2 flex-wrap">
        <button
          v-for="(c, idx) in sortedContacts"
          :key="c.contactId"
          @click="goTo(idx)"
          class="w-3 h-3 rounded-full transition-all"
          :style="idx === currentIndex
            ? { backgroundColor: '#E8652B', transform: 'scale(1.3)' }
            : { backgroundColor: '#F0E0D0' }"
          :title="c.contactName"
        />
      </div>

      <div v-if="pkg.familyReminder" class="rounded-2xl bg-blue-50 border border-blue-200 p-5">
        <div class="flex items-start gap-3">
          <AlertTriangle class="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-semibold text-blue-700 mb-1">家属提醒</p>
            <p class="text-base text-blue-600">{{ pkg.familyReminder }}</p>
          </div>
        </div>
      </div>

      <div v-if="sortedContacts.filter(c => c.isKeyPoint).length > 0" class="rounded-2xl bg-[#FFF8F0] p-5">
        <p class="text-sm font-semibold text-warm-700 mb-3 flex items-center gap-2">
          <Star class="h-4 w-4 text-[#E8652B] fill-[#E8652B]" />
          重点联系人快速查看
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="c in sortedContacts.filter(c => c.isKeyPoint)"
            :key="c.contactId"
            @click="goTo(sortedContacts.indexOf(c))"
            class="rounded-xl bg-white px-4 py-3 cursor-pointer hover:shadow-md transition-shadow border border-orange-200"
          >
            <p class="text-sm font-bold text-warm-800 truncate">{{ c.contactName }}</p>
            <p class="text-xs text-warm-500 font-mono mt-1">{{ c.contactPhone }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
