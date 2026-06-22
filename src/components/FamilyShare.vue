<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContactStore, usePackageStore, useFollowUpStore, useDrillStore, useEmergencyStore, useLeavingSessionStore, useLeavingChecklistStore } from '@/stores'
import {
  Share2, Download, Upload, Copy, Check, Users, FileText,
  AlertCircle, Smartphone, QrCode, Mail, MessageSquare, ChevronRight, MapPin, Clock, Plus, RefreshCw,
  HeartPulse, ShoppingBag, Building2, Home, ListChecks, DoorOpen, CheckCircle2, XCircle
} from 'lucide-vue-next'
import type { ChecklistActivityAction } from '@/types'

const contactStore = useContactStore()
const packageStore = usePackageStore()
const followUpStore = useFollowUpStore()
const drillStore = useDrillStore()
const emergencyStore = useEmergencyStore()
const sessionStore = useLeavingSessionStore()
const checklistStore = useLeavingChecklistStore()

const copied = ref(false)
const shareCode = ref('')
const importData = ref('')
const importError = ref('')
const activeTab = ref<'export' | 'import' | 'activity'>('activity')
const exportType = ref<'all' | 'contacts' | 'packages' | 'emergency' | 'leaving'>('all')
const activityFilter = ref<'all' | 'emergency' | 'leaving'>('all')

function generateShareCode() {
  const data: Record<string, unknown> = {}

  if (exportType.value === 'all' || exportType.value === 'contacts') {
    data.contacts = contactStore.contacts
  }
  if (exportType.value === 'all' || exportType.value === 'packages') {
    data.packages = packageStore.packages
  }
  if (exportType.value === 'all' || exportType.value === 'emergency') {
    data.emergencyItems = emergencyStore.items
    data.emergencyActivities = emergencyStore.activities
  }
  if (exportType.value === 'all' || exportType.value === 'leaving') {
    data.checklists = checklistStore.checklists
    data.leavingSessions = sessionStore.history
    data.leavingActivities = sessionStore.activities
    data.returnConfirms = sessionStore.returnConfirms
  }
  if (exportType.value === 'all') {
    data.followUps = followUpStore.items
    data.drills = drillStore.history
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
    let importedCount = 0

    if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
      if (confirm(`确认导入 ${data.contacts.length} 位联系人吗？这将覆盖现有联系人数据。`)) {
        contactStore.contacts.splice(0, contactStore.contacts.length, ...data.contacts)
        importedCount++
      }
    }

    if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
      if (confirm(`确认导入 ${data.packages.length} 个资料包吗？这将覆盖现有资料包。`)) {
        packageStore.packages.splice(0, packageStore.packages.length, ...data.packages)
        importedCount++
      }
    }

    if (data.emergencyItems && Array.isArray(data.emergencyItems) && data.emergencyItems.length > 0) {
      if (confirm(`确认导入 ${data.emergencyItems.length} 件应急物品吗？这将覆盖现有物品数据。`)) {
        emergencyStore.items.splice(0, emergencyStore.items.length, ...data.emergencyItems)
        importedCount++
      }
    }

    if (data.emergencyActivities && Array.isArray(data.emergencyActivities) && data.emergencyActivities.length > 0) {
      emergencyStore.activities.splice(0, emergencyStore.activities.length, ...data.emergencyActivities)
      importedCount++
    }

    if (data.checklists && Array.isArray(data.checklists) && data.checklists.length > 0) {
      if (confirm(`确认导入 ${data.checklists.length} 份离家清单吗？这将覆盖现有清单数据。`)) {
        checklistStore.checklists.splice(0, checklistStore.checklists.length, ...data.checklists)
        importedCount++
      }
    }

    if (data.leavingSessions && Array.isArray(data.leavingSessions) && data.leavingSessions.length > 0) {
      sessionStore.history.splice(0, sessionStore.history.length, ...data.leavingSessions)
      importedCount++
    }

    if (data.leavingActivities && Array.isArray(data.leavingActivities) && data.leavingActivities.length > 0) {
      sessionStore.activities.splice(0, sessionStore.activities.length, ...data.leavingActivities)
      importedCount++
    }

    if (data.returnConfirms && Array.isArray(data.returnConfirms) && data.returnConfirms.length > 0) {
      sessionStore.returnConfirms.splice(0, sessionStore.returnConfirms.length, ...data.returnConfirms)
      importedCount++
    }

    if (data.followUps && Array.isArray(data.followUps) && data.followUps.length > 0) {
      if (confirm(`确认导入 ${data.followUps.length} 项待跟进事项吗？这将覆盖现有待办数据。`)) {
        followUpStore.items.splice(0, followUpStore.items.length, ...data.followUps)
        importedCount++
      }
    }

    if (data.drills && Array.isArray(data.drills) && data.drills.length > 0) {
      drillStore.history.splice(0, drillStore.history.length, ...data.drills)
      importedCount++
    }

    importData.value = ''
    alert(`导入成功！已导入 ${importedCount} 类数据。`)
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
    emergencyItems: emergencyStore.items.length,
    checklists: checklistStore.checklists.length,
    leavingSessions: sessionStore.history.length,
    returnConfirms: sessionStore.returnConfirms.length,
  }
})

interface MergedActivity {
  id: string
  type: 'emergency' | 'leaving'
  detail: string
  timestamp: number
  action: string
}

const recentActivities = computed<MergedActivity[]>(() => {
  const emergencyActs: MergedActivity[] = emergencyStore.activities.map(a => ({
    id: 'em-' + a.id,
    type: 'emergency',
    detail: a.detail,
    timestamp: a.timestamp,
    action: a.action,
  }))
  const leavingActs: MergedActivity[] = sessionStore.activities.map(a => ({
    id: 'lv-' + a.id,
    type: 'leaving',
    detail: a.detail,
    timestamp: a.timestamp,
    action: a.action,
  }))
  let merged = [...emergencyActs, ...leavingActs]
  if (activityFilter.value === 'emergency') merged = emergencyActs
  if (activityFilter.value === 'leaving') merged = leavingActs
  return merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30)
})

function formatActivityTime(ts: number) {
  const now = Date.now()
  const diff = now - ts
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 86400000 * 7) return Math.floor(diff / 86400000) + '天前'
  return new Date(ts).toLocaleDateString('zh-CN')
}

const EMERGENCY_ACTIVITY_ICONS: Record<string, typeof Plus> = {
  added: Plus,
  'location-changed': MapPin,
  feedback: MessageSquare,
  expired: AlertCircle,
  reviewed: RefreshCw,
}

const EMERGENCY_ACTIVITY_COLORS: Record<string, string> = {
  added: '#5C9460',
  'location-changed': '#5B9BD5',
  feedback: '#E8A838',
  expired: '#D94F4F',
  reviewed: '#7BAE7F',
}

const LEAVING_ACTIVITY_ICONS: Record<ChecklistActivityAction, typeof Plus> = {
  'checklist-created': Plus,
  'checklist-updated': RefreshCw,
  'checklist-deleted': XCircle,
  'session-started': DoorOpen,
  'session-abnormal': AlertCircle,
  'session-completed': CheckCircle2,
  'return-confirmed': Home,
}

const LEAVING_ACTIVITY_COLORS: Record<ChecklistActivityAction, string> = {
  'checklist-created': '#5C9460',
  'checklist-updated': '#5B9BD5',
  'checklist-deleted': '#8B7355',
  'session-started': '#E8652B',
  'session-abnormal': '#D94F4F',
  'session-completed': '#7BAE7F',
  'return-confirmed': '#E8A838',
}

function getActivityIcon(activity: MergedActivity) {
  if (activity.type === 'emergency') {
    return EMERGENCY_ACTIVITY_ICONS[activity.action] || Plus
  }
  return LEAVING_ACTIVITY_ICONS[activity.action as ChecklistActivityAction] || ListChecks
}

function getActivityColor(activity: MergedActivity) {
  if (activity.type === 'emergency') {
    return EMERGENCY_ACTIVITY_COLORS[activity.action] || '#8B7355'
  }
  return LEAVING_ACTIVITY_COLORS[activity.action as ChecklistActivityAction] || '#8B7355'
}

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

    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
        <MapPin class="h-6 w-6 mx-auto mb-2 text-[#D94F4F]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.emergencyItems }}</p>
        <p class="text-sm text-warm-500">件应急物品</p>
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
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <ListChecks class="h-6 w-6 mx-auto mb-2 text-[#8B7355]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.checklists }}</p>
        <p class="text-sm text-warm-500">份离家清单</p>
      </div>
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <DoorOpen class="h-6 w-6 mx-auto mb-2 text-[#E8652B]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.leavingSessions }}</p>
        <p class="text-sm text-warm-500">次离家</p>
      </div>
      <div class="rounded-2xl bg-white/70 p-4 text-center">
        <Home class="h-6 w-6 mx-auto mb-2 text-[#7BAE7F]" />
        <p class="text-2xl font-bold text-warm-900">{{ dataSummary.returnConfirms }}</p>
        <p class="text-sm text-warm-500">次回家确认</p>
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
      <button
        @click="activeTab = 'activity'"
        class="flex-1 rounded-xl px-4 py-3 text-base font-medium transition-colors"
        :style="activeTab === 'activity'
          ? { backgroundColor: '#7BAE7F', color: 'white' }
          : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
      >
        <Clock class="h-5 w-5 inline-block mr-2" />
        家庭动态
      </button>
    </div>

    <div v-if="activeTab === 'export'" class="space-y-5">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <h3 class="text-lg font-bold text-warm-800">选择分享内容</h3>
        <div class="space-y-2">
          <label
            v-for="opt in [
              { value: 'all', label: '全部数据', desc: '联系人 + 资料包 + 应急物品 + 离家清单 + 待办 + 演练' },
              { value: 'contacts', label: '仅联系人', desc: '只分享联系人信息' },
              { value: 'packages', label: '仅资料包', desc: '只分享回听资料包' },
              { value: 'emergency', label: '仅应急物品', desc: '应急物品 + 物品动态' },
              { value: 'leaving', label: '仅离家清单', desc: '离家清单 + 会话记录 + 动态' },
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

    <div v-else-if="activeTab === 'import'" class="space-y-5">
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

    <div v-if="activeTab === 'activity'" class="space-y-5">
      <div class="rounded-2xl bg-white shadow-sm p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-warm-800 flex items-center gap-2">
            <Clock class="h-5 w-5 text-[#7BAE7F]" />
            家庭动态
          </h3>
        </div>
        <p class="text-sm text-warm-500">查看应急物品动态和离家清单动态，按时间倒序排列</p>

        <div class="flex gap-2">
          <button
            @click="activityFilter = 'all'"
            class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            :style="activityFilter === 'all'
              ? { backgroundColor: '#7BAE7F', color: 'white' }
              : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
          >
            全部
          </button>
          <button
            @click="activityFilter = 'leaving'"
            class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            :style="activityFilter === 'leaving'
              ? { backgroundColor: '#E8652B', color: 'white' }
              : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
          >
            离家
          </button>
          <button
            @click="activityFilter = 'emergency'"
            class="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            :style="activityFilter === 'emergency'
              ? { backgroundColor: '#5B9BD5', color: 'white' }
              : { backgroundColor: '#FFF8F0', color: '#8B7355' }"
          >
            物品
          </button>
        </div>

        <div v-if="recentActivities.length === 0" class="rounded-xl bg-warm-50 p-8 text-center">
          <Clock class="mx-auto mb-3 h-10 w-10 text-warm-300" />
          <p class="text-warm-400">暂无动态</p>
          <p class="text-sm text-warm-300 mt-1">物品变更和离家活动会在这里显示</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="flex items-start gap-3 p-3 rounded-xl bg-warm-50/50"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              :style="{ backgroundColor: getActivityColor(activity) + '20' }"
            >
              <component
                :is="getActivityIcon(activity)"
                class="h-4 w-4"
                :style="{ color: getActivityColor(activity) }"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-warm-700">{{ activity.detail }}</p>
              <p class="text-xs text-warm-400 mt-1">{{ formatActivityTime(activity.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
