<script setup lang="ts">
import ContactForm from '@/components/ContactForm.vue'
import GroupSortPanel from '@/components/GroupSortPanel.vue'
import CardLayout from '@/components/CardLayout.vue'
import PrintPreview from '@/components/PrintPreview.vue'
import ScenarioPreview from '@/components/ScenarioPreview.vue'
import DrillDrill from '@/components/DrillDrill.vue'
import { ref } from 'vue'
import { BookOpen, Layers, LayoutGrid, Printer, Zap, PhoneCall } from 'lucide-vue-next'

const activeTab = ref<'input' | 'group' | 'layout' | 'print' | 'scenario' | 'drill'>('input')

const tabs = [
  { key: 'input' as const, label: '联系人录入', icon: BookOpen },
  { key: 'group' as const, label: '分组排序', icon: Layers },
  { key: 'layout' as const, label: '卡片排版', icon: LayoutGrid },
  { key: 'print' as const, label: '打印预览', icon: Printer },
  { key: 'scenario' as const, label: '场景预演', icon: Zap },
  { key: 'drill' as const, label: '应急演练', icon: PhoneCall },
]
</script>

<template>
  <div class="min-h-screen" style="background: #FFF8F0;">
    <header class="sticky top-0 z-40 border-b" style="background: rgba(255,248,240,0.92); backdrop-filter: blur(12px); border-color: #F0E0D0;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: #E8652B;">
              <BookOpen class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-bold" style="font-family: 'Noto Serif SC', serif; color: #3D2C2C;">
                家庭电话本
              </h1>
              <p class="text-xs" style="color: #9C8B7A;">大字应急联系卡生成器</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <nav class="sticky top-16 z-30 border-b no-print" style="background: rgba(255,248,240,0.92); backdrop-filter: blur(12px); border-color: #F0E0D0;">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-1 overflow-x-auto py-2 scrollbar-thin">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'text-white shadow-md'
              : 'hover:bg-white/50'"
            :style="activeTab === tab.key ? { background: '#E8652B' } : { color: '#8B7355' }"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div class="lg:grid lg:grid-cols-12 lg:gap-8">
        <div class="lg:col-span-5 space-y-6" v-show="activeTab === 'input' || activeTab === 'group'">
          <div v-show="activeTab === 'input'">
            <ContactForm />
          </div>
          <div v-show="activeTab === 'group'">
            <GroupSortPanel />
          </div>
        </div>

        <div class="lg:col-span-7 space-y-6" v-show="activeTab === 'input' || activeTab === 'group'">
          <CardLayout />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'layout'">
          <CardLayout />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'print'">
          <PrintPreview />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'scenario'">
          <ScenarioPreview />
        </div>

        <div class="lg:col-span-12" v-show="activeTab === 'drill'">
          <DrillDrill />
        </div>
      </div>
    </main>

    <footer class="border-t py-6 text-center text-sm no-print" style="border-color: #F0E0D0; color: #B8A08A;">
      家庭电话本 · 大字应急联系卡生成器 — 让紧急联系信息一目了然
    </footer>
  </div>
</template>
