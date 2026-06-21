<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContactStore, usePackageStore, useFollowUpStore, useDrillStore } from '@/stores'
import {
  Share2, Download, Upload, Copy, Check, Users, FileText,
  AlertCircle, Smartphone, QrCode, Mail, MessageSquare, ChevronRight
} from 'lucide-vue-next'

const contactStore = useContactStore()
const packageStore = usePackageStore()
const followUpStore = useFollowUpStore()
const drillStore = useDrillStore()

const copied = ref(false)
const shareCode = ref('')
const importData = ref('')
const importError = ref('')
const activeTab = ref<'export' | 'import'>('export')
const exportType = ref<'all' | 'contacts' | 'packages'>('all')

function generateShareCode() {
  const data: Record<string, unknown> = {}

  if (exportType.value === 'all' || exportType.value === 'contacts') {
    data.contacts = contactStore.contacts
  }
  if (exportType.value === 'all' || exportType.value === 'packages') {
    data.packages = packageStore.packages
  }

  const jsonStr = JSON.stringify(data)
  shareCode.value = btoa(unescape(encodeURIComponent(jsonStr)))
}

function copyShareCode() {
  if (!shareCode.value) return
  navigator.clipboard.writeText(shareCode.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function downloadAsFile() {
  if (!shareCode.value) generateShareCode()
  if (!shareCode.value) return

  const blob = new Blob([shareCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `家庭电话本_分享码_${new Date().toLocaleDateString('zh-CN')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function importFromCode() {
  importError.value = ''
  if (!importData.value.trim()) {
    importError.value = '请输入分享码'
    return
  }

  try {
    const jsonStr = decodeURIComponent(escape(atob(importData.value.trim())))
    const data = JSON.parse(jsonStr)

    if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
      if (confirm(`确认导入 ${data.contacts.length} 位联系人吗？这将覆盖现有联系人数据。`)) {
        contactStore.contacts.splice(0, contactStore.contacts.length, ...data.contacts)
      }
    }

    if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
      if (confirm(`确认导入 ${data.packages.length} 个资料包吗？这将覆盖现有资料包。`)) {
        packageStore.packages.splice(0, packageStore.packages.length, ...data.packages)
      }
    }

    importData.value = ''
    alert('导入成功！')
  } catch {
    importError.value = '分享码格式错误，请检查后重试'
  }
}

function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    importData.value = (e.target?.result as string) || ''
  }
  reader.readAsText(file)
}

function handleJsonImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = (e.target?.result as string) || ''
      const json = JSON.parse(content)
      importData.value = btoa(unescape(encodeURIComponent(JSON.stringify(json))))
    } catch {
      importError.value = '文件格式错误'
    }
  }
  reader.readAsText(file)
}

const dataSummary = computed(() => {
  return {
    contacts: contactStore.contacts.length,
    packages: packageStore.packages.length,
    followUps: followUpStore.items.length,
    drills: drillStore.history.length,
  }
})

generateShareCode()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="font-serif text-2xl font-bold text-warm-900">家庭共享</h2>
    </div>

    <div class="rounded-2xl bg-[#FFF8F0] px-5 py-4">
      <div class="flex items-start gap-3">
        <Share2 class="mt-0.5 h-5 w-5 shrink-0 text-[#E8652B]" />
        <div>
          <p class="text-sm font-medium text-warm-800">
            将电话本和资料包分享给家人，让全家都能查看和更新联系信息。
          </p>
          <p class="text-xs text-warm-500 mt-1">
            支持生成分享码、导出文件，或从分享码/文件导入。
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <Users class="h-6 w-6 mx-auto mb-2 text-[#E8652B]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.contacts }}</p>
        <p class="text-sm text-warm-500">位联系人</p>
      </div>
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <FileText class="h-6 w-6 mx-auto mb-2 text-[#7BAE7F]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.packages }}</p>
        <p class="text-sm text-warm-500">个资料包</p>
      </div>
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <AlertCircle class="h-6 w-6 mx-auto mb-2 text-[#E8A838]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.followUps }}</p>
        <p class="text-sm text-warm-500">项待办</p>
      </div>
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <Smartphone class="h-6 w-6 mx-auto mb-2 text-[#5B9BD5]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.drills }}</p>
        <p class="text-sm text-warm-500">次演练</p>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        @click="activeTab = 'export'"
        class="flex-1 rounded-xl px-4 py-3 text-base font-medium transition-colors"
        :style="activeTab === 'export'
          ? { backgroundColor: '#E8652B', color: 'white' }
          : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
      >
        <Download class="h-5 w-5 inline-block mr-2" />
        导出/分享
      </button>
      <button
        @click="activeTab = 'import'"
        class="flex-1 rounded-xl px-4 py-3 text-base font-medium transition-colors"
        :style="activeTab === 'import'
          ? { backgroundColor: '#5B9BD5', color: 'white' }
          : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
      >
        <Upload class="h-5 w-5 inline-block mr-2" />
        导入/接收
      </button>
    </div>

    <div v-if="activeTab === 'export'" class="space-y-5">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800">选择分享内容</h3>
        <div class="space-y-2">
          <label
            v-for="opt in [
              { value: 'all', label: '全部数据', desc: '联系人 + 资料包 + 待办事项' },
              { value: 'contacts', label: '仅联系人', desc: '只分享联系人信息' },
              { value: 'packages', label: '仅资料包', desc: '只分享回听资料包' },
            ]"
            :key="opt.value"
            class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
            :class="exportType === opt.value ? 'bg-orange-50 border-2 border-[#E8652B]' : 'bg-warm-50 border-2 border-transparent hover:bg-warm-100'"
          >
            <input
              type="radio"
              :value="opt.value"
              v-model="exportType"
              @change="generateShareCode"
              class="w-5 h-5 accent-[#E8652B]"
            />
            <div class="flex-1">
              <p class="font-semibold text-warm-800">{{ opt.label }}</p>
              <p class="text-sm text-warm-500">{{ opt.desc }}</p>
            </div>
            <ChevronRight class="h-5 w-5 text-warm-300" />
          </label>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
          <QrCode class="h-5 w-5 text-[#E8652B]" />
          分享码
        </h3>
        <p class="text-sm text-warm-500">
          将下方分享码发送给家人，对方在"导入/接收"中粘贴即可导入数据。
        </p>
        <div class="relative">
          <textarea
            :value="shareCode"
            readonly
            rows="4"
            class="w-full rounded-xl border border-warm-200 px-4 py-3 text-xs font-mono bg-warm-50 text-warm-600 break-all"
          />
          <button
            @click="copyShareCode"
            class="absolute top-2 right-2 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#d45a24]"
            style="background: #E8652B;"
          >
            <Check v-if="copied" class="h-4 w-4" />
            <Copy v-else class="h-4 w-4" />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>

        <div class="flex gap-3">
          <button
            @click="generateShareCode"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-warm-600 border border-warm-200 bg-white hover:bg-warm-50 transition-colors"
          >
            <Share2 class="h-5 w-5" />
            重新生成
          </button>
          <button
            @click="downloadAsFile"
            class="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#d45a24]"
            style="background: #E8652B;"
          >
            <Download class="h-5 w-5" />
            下载文件
          </button>
        </div>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-3">
        <h3 class="text-lg font-bold text-warm-800">分享方式</h3>
        <div class="grid grid-cols-2 gap-3">
          <button class="flex items-center gap-3 rounded-xl p-4 bg-green-50 hover:bg-green-100 transition-colors text-left">
            <MessageSquare class="h-6 w-6 text-green-500" />
            <div>
              <p class="font-semibold text-green-700">微信分享</p>
              <p class="text-xs text-green-500">发送给家人</p>
            </div>
          </button>
          <button class="flex items-center gap-3 rounded-xl p-4 bg-blue-50 hover:bg-blue-100 transition-colors text-left">
            <Mail class="h-6 w-6 text-blue-500" />
            <div>
              <p class="font-semibold text-blue-700">邮件发送</p>
              <p class="text-xs text-blue-500">发送到邮箱</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="space-y-5">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800">粘贴分享码</h3>
        <textarea
          v-model="importData"
          placeholder="在此粘贴分享码..."
          rows="4"
          class="w-full rounded-xl border border-warm-200 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]/40 focus:border-[#5B9BD5] bg-white"
        />

        <p v-if="importError" class="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle class="h-4 w-4" />
          {{ importError }}
        </p>

        <button
          @click="importFromCode"
          :disabled="!importData.trim()"
          class="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-white shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style="background: #5B9BD5;"
        >
          <Upload class="h-5 w-5" />
          导入数据
        </button>
      </div>

      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800">从文件导入</h3>
        <p class="text-sm text-warm-500">选择之前导出的分享码文件或 JSON 文件</p>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-200 p-6 cursor-pointer hover:border-[#5B9BD5] hover:bg-blue-50 transition-colors">
            <FileText class="h-8 w-8 text-warm-400 mb-2" />
            <p class="text-sm font-medium text-warm-600">分享码文件</p>
            <p class="text-xs text-warm-400">.txt 格式</p>
            <input type="file" accept=".txt" class="hidden" @change="handleFileImport" />
          </label>
          <label class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-warm-200 p-6 cursor-pointer hover:border-[#5B9BD5] hover:bg-blue-50 transition-colors">
            <FileText class="h-8 w-8 text-warm-400 mb-2" />
            <p class="text-sm font-medium text-warm-600">JSON 文件</p>
            <p class="text-xs text-warm-400">.json 格式</p>
            <input type="file" accept=".json" class="hidden" @change="handleJsonImport" />
          </label>
        </div>
      </div>

      <div class="rounded-2xl bg-yellow-50 border border-yellow-200 p-4">
        <div class="flex items-start gap-3">
          <AlertCircle class="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-semibold text-yellow-800">导入须知</p>
            <ul class="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• 导入将覆盖现有的同类型数据</li>
              <li>• 请确保分享码来源可信</li>
              <li>• 建议在导入前先导出备份现有数据</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
