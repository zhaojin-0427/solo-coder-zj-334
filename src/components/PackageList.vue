<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePackageStore } from '@/stores'
import { Package, Star, Plus, Trash2, Edit, Play, ChevronUp, ChevronDown, BookOpen } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'play', id: string): void
}>()

const packageStore = usePackageStore()

const showDeleteConfirm = ref<string | null>(null)

function handleCreate() {
  const newPkg = packageStore.createPackage({ title: '新资料包' })
  emit('edit', newPkg.id)
}

function handleDelete(id: string) {
  packageStore.deletePackage(id)
  showDeleteConfirm.value = null
}

function moveUp(idx: number) {
  if (idx > 0) {
    packageStore.reorderPackages(idx, idx - 1)
  }
}

function moveDown(idx: number) {
  if (idx < packageStore.sortedPackages.length - 1) {
    packageStore.reorderPackages(idx, idx + 1)
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">回听资料包</h2>
      <button
        @click="handleCreate"
        class="flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
        style="background: #E8652B;"
      >
        <Plus class="h-5 w-5" />
        新建资料包
      </button>
    </div>

    <div class="rounded-2xl bg-[#FFF8F0] px-5 py-4">
      <div class="flex items-start gap-3">
        <BookOpen class="mt-0.5 h-5 w-5 shrink-0 text-[#E8652B]" />
        <p class="text-sm font-medium text-warm-800">
          将重要联系人整理成资料包，方便日常回顾和紧急时快速查阅。支持设置导览语、重点标记和家属提醒。
        </p>
      </div>
    </div>

    <div v-if="packageStore.sortedPackages.length === 0" class="rounded-2xl bg-white/60 px-5 py-10 text-center">
      <Package class="mx-auto mb-3 h-12 w-12 text-warm-300" />
      <p class="text-lg text-warm-400">暂无资料包</p>
      <p class="text-sm text-warm-300 mt-1">点击上方"新建资料包"开始创建</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(pkg, idx) in packageStore.sortedPackages"
        :key="pkg.id"
        class="group rounded-2xl bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden transition-all hover:shadow-md hover:bg-white"
      >
        <div class="flex items-stretch">
          <div
            class="w-1.5 shrink-0"
            :style="{ backgroundColor: pkg.isHighlighted ? '#E8652B' : '#F0E0D0' }"
          />
          <div class="flex-1 p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-bold text-warm-900 truncate">{{ pkg.title }}</h3>
                  <Star
                    v-if="pkg.isHighlighted"
                    class="h-4 w-4 shrink-0 text-[#E8652B] fill-[#E8652B]"
                  />
                </div>
                <p v-if="pkg.purpose" class="text-sm text-warm-500 mt-1 line-clamp-1">{{ pkg.purpose }}</p>
                <p class="text-xs text-warm-400 mt-2">
                  {{ pkg.contacts.length }} 位联系人 · 更新于 {{ formatDate(pkg.updatedAt) }}
                </p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click="emit('play', pkg.id)"
                  class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#d45a24]"
                  style="background: #E8652B;"
                >
                  <Play class="h-4 w-4" />
                  <span class="hidden sm:inline">查看</span>
                </button>
                <button
                  @click="emit('edit', pkg.id)"
                  class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
                >
                  <Edit class="h-4 w-4" />
                  <span class="hidden sm:inline">编辑</span>
                </button>
                <button
                  @click="packageStore.toggleHighlight(pkg.id)"
                  class="rounded-xl p-2 text-warm-400 hover:text-[#E8652B] hover:bg-orange-50 transition-colors"
                  :title="pkg.isHighlighted ? '取消重点' : '设为重点'"
                >
                  <Star
                    class="h-4 w-4"
                    :class="pkg.isHighlighted ? 'text-[#E8652B] fill-[#E8652B]' : ''"
                  />
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-col border-l border-warm-100">
            <button
              @click="moveUp(idx)"
              :disabled="idx === 0"
              class="flex-1 px-2 text-warm-400 hover:text-[#E8652B] hover:bg-warm-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp class="h-4 w-4 mx-auto" />
            </button>
            <button
              @click="moveDown(idx)"
              :disabled="idx === packageStore.sortedPackages.length - 1"
              class="flex-1 px-2 text-warm-400 hover:text-[#E8652B] hover:bg-warm-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-t border-warm-100"
            >
              <ChevronDown class="h-4 w-4 mx-auto" />
            </button>
          </div>
        </div>

        <div v-if="showDeleteConfirm === pkg.id" class="px-4 pb-4">
          <div class="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center justify-between">
            <span class="text-sm text-red-600">确定删除这个资料包吗？</span>
            <div class="flex items-center gap-2">
              <button
                @click="showDeleteConfirm = null"
                class="text-sm text-warm-500 hover:text-warm-700"
              >
                取消
              </button>
              <button
                @click="handleDelete(pkg.id)"
                class="text-sm font-semibold text-red-500 hover:text-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="pt-4 border-t border-warm-100">
      <p class="text-sm text-warm-400 text-center">
        共 {{ packageStore.sortedPackages.length }} 个资料包，{{ packageStore.sortedPackages.filter(p => p.isHighlighted).length }} 个重点
      </p>
    </div>
  </div>
</template>
