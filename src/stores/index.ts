import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Contact, ContactGroup, LayoutConfig, CardFormat, FontSize, DrillSession, DrillHistoryRecord, DrillContactAttempt, ContactResult, ListeningPackage, PackageContact, FollowUpItem, FollowUpPriority, FollowUpStatus, StatsData, EmergencyItem, EmergencyItemType, EmergencyUrgency, FindFeedback, EmergencyItemActivity, LeavingChecklist, LeavingChecklistScene, ChecklistItem, ChecklistItemCategory, LeavingSession, LeavingSessionStatus, ExecutingStep, ChecklistStepStatus, ReturnConfirmRecord, ReturnConfirmType, ChecklistActivity, ChecklistStatsData, ChecklistFollowUpSource } from '@/types'
import { generateId, GROUP_LABELS, GROUP_COLORS, CONTACT_RESULT_LABELS, DRILL_MODES, PACKAGE_DEFAULT_GUIDE_TEXTS, FOLLOW_UP_PRIORITY_LABELS, FOLLOW_UP_STATUS_LABELS, EMERGENCY_ITEM_TYPE_LABELS, EMERGENCY_ITEM_TYPE_COLORS, FIND_FEEDBACK_LABELS, LEAVING_SCENES, LEAVING_SCENE_LABELS, CHECKLIST_ITEM_CATEGORY_LABELS } from '@/types'

const STORAGE_KEY_CONTACTS = 'phonebook-contacts'
const STORAGE_KEY_LAYOUT = 'phonebook-layout'

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

const DEFAULT_GROUP_ORDER: ContactGroup[] = ['family', 'neighbor', 'community', 'hospital', 'repair', 'pharmacy']

const DEFAULT_CONTACTS: Contact[] = [
  { id: 'c1', name: '张小明（儿子）', phone: '138 0013 8000', group: 'family', priority: 0, color: GROUP_COLORS.family, note: '24小时开机', isEmergency: true },
  { id: 'c2', name: '李小红（女儿）', phone: '139 0013 9000', group: 'family', priority: 1, color: GROUP_COLORS.family, note: '住隔壁小区', isEmergency: true },
  { id: 'c3', name: '王大伟（老伴）', phone: '136 0013 6000', group: 'family', priority: 2, color: GROUP_COLORS.family, note: '', isEmergency: false },
  { id: 'c4', name: '张阿姨（对门）', phone: '010-6600 1001', group: 'neighbor', priority: 0, color: GROUP_COLORS.neighbor, note: '热心助人', isEmergency: true },
  { id: 'c5', name: '李师傅（3楼）', phone: '010-6600 1003', group: 'neighbor', priority: 1, color: GROUP_COLORS.neighbor, note: '退休电工', isEmergency: false },
  { id: 'c6', name: '赵网格员', phone: '137 0010 0110', group: 'community', priority: 0, color: GROUP_COLORS.community, note: '社区居委会', isEmergency: true },
  { id: 'c7', name: '社区居委会', phone: '010-6600 2000', group: 'community', priority: 1, color: GROUP_COLORS.community, note: '工作日8:00-18:00', isEmergency: false },
  { id: 'c8', name: '协和医院急诊', phone: '010-6915 6119', group: 'hospital', priority: 0, color: GROUP_COLORS.hospital, note: '24小时急诊', isEmergency: true },
  { id: 'c9', name: '社区卫生中心', phone: '010-6600 3000', group: 'hospital', priority: 1, color: GROUP_COLORS.hospital, note: '医保定点', isEmergency: false },
  { id: 'c10', name: '张医生（家庭医生）', phone: '135 0010 0120', group: 'hospital', priority: 2, color: GROUP_COLORS.hospital, note: '', isEmergency: false },
  { id: 'c11', name: '王师傅（水电维修）', phone: '130 0010 0119', group: 'repair', priority: 0, color: GROUP_COLORS.repair, note: '随叫随到', isEmergency: false },
  { id: 'c12', name: '小李（家电维修）', phone: '131 0010 0120', group: 'repair', priority: 1, color: GROUP_COLORS.repair, note: '空调冰箱洗衣机', isEmergency: false },
  { id: 'c13', name: '管道疏通老李', phone: '132 0010 0121', group: 'repair', priority: 2, color: GROUP_COLORS.repair, note: '', isEmergency: false },
  { id: 'c14', name: '同仁堂大药房', phone: '010-6600 4000', group: 'pharmacy', priority: 0, color: GROUP_COLORS.pharmacy, note: '24小时售药', isEmergency: true },
  { id: 'c15', name: '社区药店', phone: '010-6600 4001', group: 'pharmacy', priority: 1, color: GROUP_COLORS.pharmacy, note: '可送药上门', isEmergency: false },
]

export const useContactStore = defineStore('contacts', () => {
  const storedContacts = loadFromStorage<Contact[] | null>(STORAGE_KEY_CONTACTS, null)
  const contacts = ref<Contact[]>(
    storedContacts !== null ? storedContacts : DEFAULT_CONTACTS
  )

  const groupedContacts = computed(() => {
    const groups: Record<ContactGroup, Contact[]> = {
      family: [], neighbor: [], community: [], hospital: [], repair: [], pharmacy: [],
    }
    for (const c of contacts.value) {
      groups[c.group].push(c)
    }
    for (const key of Object.keys(groups) as ContactGroup[]) {
      groups[key].sort((a, b) => {
        if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1
        return a.priority - b.priority
      })
    }
    return groups
  })

  const emergencyContacts = computed(() =>
    contacts.value.filter(c => c.isEmergency).sort((a, b) => a.priority - b.priority)
  )

  function addContact(data: Omit<Contact, 'id'>) {
    contacts.value.push({ ...data, id: generateId() })
  }

  function updateContact(id: string, data: Partial<Contact>) {
    const idx = contacts.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      contacts.value[idx] = { ...contacts.value[idx], ...data }
    }
  }

  function removeContact(id: string) {
    contacts.value = contacts.value.filter(c => c.id !== id)
  }

  function reorderInGroup(groupId: ContactGroup, fromIndex: number, toIndex: number) {
    const list = groupedContacts.value[groupId]
    const ids = list.map(c => c.id)
    const [moved] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, moved)
    ids.forEach((cid, i) => {
      const c = contacts.value.find(x => x.id === cid)
      if (c) c.priority = i
    })
  }

  function moveContactToGroup(contactId: string, newGroup: ContactGroup) {
    const c = contacts.value.find(x => x.id === contactId)
    if (c) c.group = newGroup
  }

  watch(contacts, (val) => saveToStorage(STORAGE_KEY_CONTACTS, val), { deep: true })

  return {
    contacts,
    groupedContacts,
    emergencyContacts,
    addContact,
    updateContact,
    removeContact,
    reorderInGroup,
    moveContactToGroup,
  }
})

export const useLayoutStore = defineStore('layout', () => {
  const defaultLayout: LayoutConfig = {
    format: 'fridge' as CardFormat,
    fontSize: 'large' as FontSize,
    accentColor: '#E8652B',
    groupOrder: [...DEFAULT_GROUP_ORDER],
  }

  const layout = ref<LayoutConfig>(loadFromStorage<LayoutConfig>(STORAGE_KEY_LAYOUT, defaultLayout))

  function setFormat(format: CardFormat) {
    layout.value.format = format
  }

  function setFontSize(size: FontSize) {
    layout.value.fontSize = size
  }

  function setAccentColor(color: string) {
    layout.value.accentColor = color
  }

  function setGroupOrder(order: ContactGroup[]) {
    layout.value.groupOrder = order
  }

  function resetLayout() {
    layout.value = { ...defaultLayout, groupOrder: [...DEFAULT_GROUP_ORDER] }
  }

  watch(layout, (val) => saveToStorage(STORAGE_KEY_LAYOUT, val), { deep: true })

  return {
    layout,
    setFormat,
    setFontSize,
    setAccentColor,
    setGroupOrder,
    resetLayout,
  }
})

const STORAGE_KEY_DRILL_SESSION = 'phonebook-drill-session'
const STORAGE_KEY_DRILL_HISTORY = 'phonebook-drill-history'
const MAX_HISTORY_RECORDS = 10

export const useDrillStore = defineStore('drill', () => {
  const session = ref<DrillSession | null>(loadFromStorage<DrillSession | null>(STORAGE_KEY_DRILL_SESSION, null))
  const history = ref<DrillHistoryRecord[]>(loadFromStorage<DrillHistoryRecord[]>(STORAGE_KEY_DRILL_HISTORY, []))

  let timerHandle: ReturnType<typeof setInterval> | null = null

  const hasActiveSession = computed(() => session.value !== null && session.value.status === 'running')

  function buildQueue(contacts: Contact[], groupOrder: ContactGroup[]): DrillContactAttempt[] {
    const grouped: Record<ContactGroup, Contact[]> = {
      family: [], neighbor: [], community: [], hospital: [], repair: [], pharmacy: [],
    }
    for (const c of contacts) {
      grouped[c.group].push(c)
    }
    for (const key of Object.keys(grouped) as ContactGroup[]) {
      grouped[key].sort((a, b) => {
        if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1
        return a.priority - b.priority
      })
    }
    const queue: DrillContactAttempt[] = []
    const seen = new Set<string>()
    for (const group of groupOrder) {
      for (const c of grouped[group]) {
        if (!seen.has(c.id)) {
          seen.add(c.id)
          queue.push({
            contactId: c.id,
            contactName: c.name,
            contactPhone: c.phone,
            contactGroup: c.group,
            contactNote: c.note,
            result: null,
            note: '',
            timestamp: 0,
          })
        }
      }
    }
    return queue
  }

  function startDrill(scenarioId: string, contacts: Contact[], customGroupOrder?: ContactGroup[]) {
    stopTimer()
    const mode = DRILL_MODES.find(m => m.id === scenarioId)
    const groupOrder = customGroupOrder ?? mode?.groupOrder ?? DRILL_MODES[0].groupOrder
    const scenarioName = mode?.name ?? '自定义场景'
    const queue = buildQueue(contacts, groupOrder)
    if (queue.length === 0) return
    session.value = {
      id: generateId(),
      scenarioId,
      scenarioName,
      status: 'running',
      queue,
      currentIndex: 0,
      startedAt: Date.now(),
      elapsedSeconds: 0,
      finishedAt: null,
    }
    startTimer()
  }

  function startTimer() {
    stopTimer()
    timerHandle = setInterval(() => {
      if (session.value && session.value.status === 'running') {
        session.value.elapsedSeconds++
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerHandle) {
      clearInterval(timerHandle)
      timerHandle = null
    }
  }

  function markResult(result: ContactResult) {
    if (!session.value) return
    const attempt = session.value.queue[session.value.currentIndex]
    if (!attempt) return
    attempt.result = result
    attempt.timestamp = Date.now()

    if (result === 'no-answer' || result === 'wrong-number') {
      const nextIdx = session.value.currentIndex + 1
      if (nextIdx < session.value.queue.length) {
        session.value.currentIndex = nextIdx
      } else {
        finishDrill()
      }
    } else if (result === 'help-done') {
      finishDrill()
    } else if (result === 'connected' || result === 'call-later') {
      const nextIdx = session.value.currentIndex + 1
      if (nextIdx < session.value.queue.length) {
        session.value.currentIndex = nextIdx
      } else {
        finishDrill()
      }
    }
  }

  function updateAttemptNote(note: string) {
    if (!session.value) return
    const attempt = session.value.queue[session.value.currentIndex]
    if (attempt) attempt.note = note
  }

  function skipToNext() {
    if (!session.value) return
    const nextIdx = session.value.currentIndex + 1
    if (nextIdx < session.value.queue.length) {
      session.value.currentIndex = nextIdx
    }
  }

  function resetDrill() {
    stopTimer()
    session.value = null
  }

  function finishDrill() {
    if (!session.value) return
    stopTimer()
    session.value.status = 'finished'
    session.value.finishedAt = Date.now()
  }

  function saveToHistory() {
    if (!session.value || session.value.status !== 'finished') return
    const s = session.value
    const attempts = s.queue.filter(a => a.result !== null)
    const connected = attempts.filter(a => a.result === 'connected' || a.result === 'help-done').length
    const failed = attempts.filter(a => a.result === 'no-answer' || a.result === 'wrong-number').length
    const later = attempts.filter(a => a.result === 'call-later').length

    const lines: string[] = []
    lines.push(`演练模式：${s.scenarioName}`)
    lines.push(`共尝试 ${attempts.length} 位联系人，已接通 ${connected} 位，未接通 ${failed} 位，稍后再拨 ${later} 位。`)

    const helpDone = attempts.find(a => a.result === 'help-done')
    if (helpDone) {
      lines.push(`✓ ${helpDone.contactName} 已完成求助。`)
    }

    const noAnswerIds = attempts.filter(a => a.result === 'no-answer' || a.result === 'wrong-number').map(a => a.contactName)
    if (noAnswerIds.length > 0) {
      lines.push(`⚠ ${noAnswerIds.join('、')} 未能联系上，建议后续跟进。`)
    }

    const callLaterNames = attempts.filter(a => a.result === 'call-later').map(a => a.contactName)
    if (callLaterNames.length > 0) {
      lines.push(`⏳ ${callLaterNames.join('、')} 需要稍后再拨。`)
    }

    const unattempted = s.queue.filter(a => a.result === null)
    if (unattempted.length > 0) {
      lines.push(`未联系：${unattempted.map(a => a.contactName).join('、')}。`)
    }

    const record: DrillHistoryRecord = {
      id: s.id,
      scenarioId: s.scenarioId,
      scenarioName: s.scenarioName,
      attempts: [...attempts],
      startedAt: s.startedAt,
      finishedAt: s.finishedAt ?? Date.now(),
      elapsedSeconds: s.elapsedSeconds,
      summary: lines.join('\n'),
    }

    history.value.unshift(record)
    if (history.value.length > MAX_HISTORY_RECORDS) {
      history.value = history.value.slice(0, MAX_HISTORY_RECORDS)
    }

    session.value = null
  }

  function deleteHistoryRecord(id: string) {
    history.value = history.value.filter(r => r.id !== id)
  }

  function clearAllHistory() {
    history.value = []
  }

  function recoverSession(contacts: Contact[]) {
    if (!session.value) return
    if (session.value.status === 'running') {
      const currentId = session.value.queue[session.value.currentIndex]?.contactId
      const stillExists = contacts.some(c => c.id === currentId)
      if (!stillExists) {
        let found = false
        for (let i = session.value.currentIndex + 1; i < session.value.queue.length; i++) {
          if (contacts.some(c => c.id === session.value!.queue[i].contactId)) {
            session.value.currentIndex = i
            found = true
            break
          }
        }
        if (!found) {
          finishDrill()
          return
        }
      }
      session.value.queue = session.value.queue.map(a => {
        const live = contacts.find(c => c.id === a.contactId)
        if (!live) return { ...a, contactName: a.contactName + '（已删除）', contactPhone: a.contactPhone }
        return {
          ...a,
          contactName: live.name,
          contactPhone: live.phone,
          contactGroup: live.group,
          contactNote: live.note,
        }
      })
      startTimer()
    }
  }

  watch(session, (val) => saveToStorage(STORAGE_KEY_DRILL_SESSION, val), { deep: true })
  watch(history, (val) => saveToStorage(STORAGE_KEY_DRILL_HISTORY, val), { deep: true })

  return {
    session,
    history,
    hasActiveSession,
    startDrill,
    markResult,
    updateAttemptNote,
    skipToNext,
    resetDrill,
    finishDrill,
    saveToHistory,
    deleteHistoryRecord,
    clearAllHistory,
    recoverSession,
  }
})

const STORAGE_KEY_PACKAGES = 'phonebook-packages'

const DEFAULT_PACKAGES: ListeningPackage[] = [
  {
    id: 'p1',
    title: '紧急联系速查',
    purpose: '突发紧急情况时快速找到关键联系人',
    guideText: '您好，这是紧急联系资料包。遇到紧急情况时，请按照以下顺序联系，先拨打急救电话，再联系家人。',
    familyReminder: '请家属定期检查资料包中的联系电话是否有效，每月更新一次。',
    contacts: [
      { contactId: 'c8', contactName: '协和医院急诊', contactPhone: '010-6915 6119', contactGroup: 'hospital', contactNote: '24小时急诊', customNote: '第一时间拨打', order: 0, isKeyPoint: true },
      { contactId: 'c1', contactName: '张小明（儿子）', contactPhone: '138 0013 8000', contactGroup: 'family', contactNote: '24小时开机', customNote: '', order: 1, isKeyPoint: true },
      { contactId: 'c2', contactName: '李小红（女儿）', contactPhone: '139 0013 9000', contactGroup: 'family', contactNote: '住隔壁小区', customNote: '', order: 2, isKeyPoint: true },
      { contactId: 'c6', contactName: '赵网格员', contactPhone: '137 0010 0110', contactGroup: 'community', contactNote: '社区居委会', customNote: '', order: 3, isKeyPoint: false },
      { contactId: 'c4', contactName: '张阿姨（对门）', contactPhone: '010-6600 1001', contactGroup: 'neighbor', contactNote: '热心助人', customNote: '', order: 4, isKeyPoint: false },
    ],
    isHighlighted: true,
    order: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'p2',
    title: '日常问候清单',
    purpose: '每天与家人朋友保持联络',
    guideText: '今天也记得和家人朋友打个招呼哦，一句问候温暖人心。',
    familyReminder: '请家属协助老人每天完成日常问候联络。',
    contacts: [
      { contactId: 'c3', contactName: '王大伟（老伴）', contactPhone: '136 0013 6000', contactGroup: 'family', contactNote: '', customNote: '每天早上通电话', order: 0, isKeyPoint: true },
      { contactId: 'c1', contactName: '张小明（儿子）', contactPhone: '138 0013 8000', contactGroup: 'family', contactNote: '24小时开机', customNote: '周末视频通话', order: 1, isKeyPoint: false },
      { contactId: 'c2', contactName: '李小红（女儿）', contactPhone: '139 0013 9000', contactGroup: 'family', contactNote: '住隔壁小区', customNote: '', order: 2, isKeyPoint: false },
      { contactId: 'c4', contactName: '张阿姨（对门）', contactPhone: '010-6600 1001', contactGroup: 'neighbor', contactNote: '热心助人', customNote: '常来往', order: 3, isKeyPoint: false },
    ],
    isHighlighted: false,
    order: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export const usePackageStore = defineStore('packages', () => {
  const packages = ref<ListeningPackage[]>(
    loadFromStorage<ListeningPackage[]>(STORAGE_KEY_PACKAGES, DEFAULT_PACKAGES)
  )

  const sortedPackages = computed(() => {
    return [...packages.value].sort((a, b) => {
      if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1
      return a.order - b.order
    })
  })

  function getPackageById(id: string): ListeningPackage | undefined {
    return packages.value.find(p => p.id === id)
  }

  function createPackage(data: Partial<ListeningPackage> = {}) {
    const now = Date.now()
    const newPackage: ListeningPackage = {
      id: generateId(),
      title: data.title || '新资料包',
      purpose: data.purpose || '',
      guideText: data.guideText || PACKAGE_DEFAULT_GUIDE_TEXTS[0],
      familyReminder: data.familyReminder || '',
      contacts: data.contacts || [],
      isHighlighted: data.isHighlighted || false,
      order: packages.value.length,
      createdAt: now,
      updatedAt: now,
    }
    packages.value.push(newPackage)
    return newPackage
  }

  function updatePackage(id: string, data: Partial<ListeningPackage>) {
    const idx = packages.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      packages.value[idx] = { ...packages.value[idx], ...data, updatedAt: Date.now() }
    }
  }

  function deletePackage(id: string) {
    packages.value = packages.value.filter(p => p.id !== id)
    packages.value.forEach((p, i) => { p.order = i })
  }

  function toggleHighlight(id: string) {
    const pkg = packages.value.find(p => p.id === id)
    if (pkg) {
      pkg.isHighlighted = !pkg.isHighlighted
      pkg.updatedAt = Date.now()
    }
  }

  function reorderPackages(fromIndex: number, toIndex: number) {
    const arr = [...sortedPackages.value]
    const [moved] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, moved)
    arr.forEach((p, i) => { p.order = i })
    packages.value = [...arr]
  }

  function addContactToPackage(packageId: string, contact: Contact) {
    const pkg = packages.value.find(p => p.id === packageId)
    if (!pkg) return
    if (pkg.contacts.some(c => c.contactId === contact.id)) return
    const packageContact: PackageContact = {
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactGroup: contact.group,
      contactNote: contact.note,
      customNote: '',
      order: pkg.contacts.length,
      isKeyPoint: contact.isEmergency,
    }
    pkg.contacts.push(packageContact)
    pkg.updatedAt = Date.now()
  }

  function removeContactFromPackage(packageId: string, contactId: string) {
    const pkg = packages.value.find(p => p.id === packageId)
    if (!pkg) return
    pkg.contacts = pkg.contacts.filter(c => c.contactId !== contactId)
    pkg.contacts.forEach((c, i) => { c.order = i })
    pkg.updatedAt = Date.now()
  }

  function updatePackageContact(packageId: string, contactId: string, data: Partial<PackageContact>) {
    const pkg = packages.value.find(p => p.id === packageId)
    if (!pkg) return
    const idx = pkg.contacts.findIndex(c => c.contactId === contactId)
    if (idx !== -1) {
      pkg.contacts[idx] = { ...pkg.contacts[idx], ...data }
      pkg.updatedAt = Date.now()
    }
  }

  function reorderPackageContacts(packageId: string, fromIndex: number, toIndex: number) {
    const pkg = packages.value.find(p => p.id === packageId)
    if (!pkg) return
    const arr = [...pkg.contacts].sort((a, b) => a.order - b.order)
    const [moved] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, moved)
    arr.forEach((c, i) => { c.order = i })
    pkg.contacts = [...arr]
    pkg.updatedAt = Date.now()
  }

  function syncWithContacts(contacts: Contact[]) {
    for (const pkg of packages.value) {
      pkg.contacts = pkg.contacts.map(pc => {
        const live = contacts.find(c => c.id === pc.contactId)
        if (!live) return pc
        return {
          ...pc,
          contactName: live.name,
          contactPhone: live.phone,
          contactGroup: live.group,
          contactNote: live.note,
        }
      }).filter(pc => {
        return contacts.some(c => c.id === pc.contactId)
      })
      pkg.contacts.forEach((c, i) => { c.order = i })
    }
  }

  watch(packages, (val) => saveToStorage(STORAGE_KEY_PACKAGES, val), { deep: true })

  return {
    packages,
    sortedPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    toggleHighlight,
    reorderPackages,
    addContactToPackage,
    removeContactFromPackage,
    updatePackageContact,
    reorderPackageContacts,
    syncWithContacts,
  }
})

const STORAGE_KEY_FOLLOW_UPS = 'phonebook-followups'

const DEFAULT_FOLLOW_UPS: FollowUpItem[] = [
  {
    id: 'f1',
    title: '联系张小明确认周末回家吃饭',
    description: '问问儿子这周末是否有空回家，顺便提醒他带点常用药。',
    contactId: 'c1',
    contactName: '张小明（儿子）',
    dueDate: Date.now() + 86400000 * 2,
    priority: 'high',
    status: 'pending',
    createdAt: Date.now() - 86400000,
    completedAt: null,
    sourceItemId: null,
    sourceItemName: '',
  },
  {
    id: 'f2',
    title: '预约下周一社区医院体检',
    description: '年度体检快到期了，需要提前打电话预约。',
    contactId: null,
    contactName: '',
    dueDate: Date.now() + 86400000 * 5,
    priority: 'medium',
    status: 'pending',
    createdAt: Date.now() - 86400000 * 2,
    completedAt: null,
    sourceItemId: null,
    sourceItemName: '',
  },
  {
    id: 'f3',
    title: '给王师傅打电话修空调',
    description: '最近天气热了，客厅空调有点不制冷，找王师傅来看看。',
    contactId: 'c10',
    contactName: '王师傅（空调维修）',
    dueDate: Date.now() + 86400000,
    priority: 'high',
    status: 'pending',
    createdAt: Date.now() - 3600000,
    completedAt: null,
    sourceItemId: null,
    sourceItemName: '',
  },
  {
    id: 'f4',
    title: '和张阿姨约好一起去超市',
    description: '对门张阿姨说想一起去买菜，约个时间一起去。',
    contactId: 'c4',
    contactName: '张阿姨（对门）',
    dueDate: null,
    priority: 'low',
    status: 'pending',
    createdAt: Date.now() - 86400000 * 3,
    completedAt: null,
    sourceItemId: null,
    sourceItemName: '',
  },
  {
    id: 'f5',
    title: '完成本月应急演练',
    description: '每月一次的应急拨号演练，熟悉紧急联系流程。',
    contactId: null,
    contactName: '',
    dueDate: Date.now() - 86400000,
    priority: 'medium',
    status: 'done',
    createdAt: Date.now() - 86400000 * 10,
    completedAt: Date.now() - 86400000 * 2,
    sourceItemId: null,
    sourceItemName: '',
  },
]

export const useFollowUpStore = defineStore('followUps', () => {
  const items = ref<FollowUpItem[]>(
    loadFromStorage<FollowUpItem[]>(STORAGE_KEY_FOLLOW_UPS, DEFAULT_FOLLOW_UPS)
  )

  const pendingItems = computed(() =>
    items.value.filter(i => i.status === 'pending').sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const pa = priorityOrder[a.priority]
      const pb = priorityOrder[b.priority]
      if (pa !== pb) return pa - pb
      return (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity)
    })
  )

  const doneItems = computed(() =>
    items.value.filter(i => i.status === 'done').sort((a, b) =>
      (b.completedAt ?? 0) - (a.completedAt ?? 0)
    )
  )

  function addItem(data: Partial<FollowUpItem>) {
    const now = Date.now()
    const newItem: FollowUpItem = {
      id: generateId(),
      title: data.title || '新待办',
      description: data.description || '',
      contactId: data.contactId ?? null,
      contactName: data.contactName || '',
      dueDate: data.dueDate ?? null,
      priority: data.priority || 'medium',
      status: 'pending',
      createdAt: now,
      completedAt: null,
      sourceItemId: data.sourceItemId ?? null,
      sourceItemName: data.sourceItemName || '',
    }
    items.value.unshift(newItem)
    return newItem
  }

  function updateItem(id: string, data: Partial<FollowUpItem>) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], ...data }
    }
  }

  function deleteItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function toggleStatus(id: string) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      if (item.status === 'pending') {
        item.status = 'done'
        item.completedAt = Date.now()
      } else {
        item.status = 'pending'
        item.completedAt = null
      }
    }
  }

  function clearDone() {
    items.value = items.value.filter(i => i.status === 'pending')
  }

  watch(items, (val) => saveToStorage(STORAGE_KEY_FOLLOW_UPS, val), { deep: true })

  return {
    items,
    pendingItems,
    doneItems,
    addItem,
    updateItem,
    deleteItem,
    toggleStatus,
    clearDone,
  }
})

const STORAGE_KEY_EMERGENCY_ITEMS = 'phonebook-emergency-items'
const STORAGE_KEY_EMERGENCY_ACTIVITIES = 'phonebook-emergency-activities'

const DEFAULT_EMERGENCY_ITEMS: EmergencyItem[] = [
  {
    id: 'ei1', name: '医保卡', type: 'medical', location: '卧室床头柜第二层抽屉',
    findHint: '在老花镜旁边的小盒子里', photoDescription: '蓝色卡片，正面有社保标志',
    expiryDate: null, checkDate: Date.now() + 86400000 * 90,
    contactId: 'c9', contactName: '社区卫生中心', packageId: 'p1', packageName: '紧急联系速查',
    urgency: 'high', needsPeriodicReview: true, reviewIntervalDays: 90, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 30, updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'ei2', name: '身份证', type: 'id', location: '客厅电视柜左侧抽屉',
    findHint: '红色皮套里，和户口本放在一起', photoDescription: '二代身份证，正面有本人照片',
    expiryDate: Date.now() + 86400000 * 365, checkDate: null,
    contactId: null, contactName: '', packageId: null, packageName: '',
    urgency: 'high', needsPeriodicReview: false, reviewIntervalDays: null, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 60, updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'ei3', name: '病历本', type: 'medical', location: '书房书架第二层',
    findHint: '蓝色文件夹，标签写着"病历"', photoDescription: '蓝色文件夹，内含就诊记录',
    expiryDate: null, checkDate: Date.now() + 86400000 * 30,
    contactId: 'c10', contactName: '张医生（家庭医生）', packageId: 'p1', packageName: '紧急联系速查',
    urgency: 'high', needsPeriodicReview: true, reviewIntervalDays: 180, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 90, updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'ei4', name: '常用药（降压药）', type: 'medical', location: '厨房餐边柜上层',
    findHint: '白色药瓶，标签上有红色标记', photoDescription: '白色药瓶，红色标签',
    expiryDate: Date.now() + 86400000 * 60, checkDate: null,
    contactId: 'c14', contactName: '同仁堂大药房', packageId: null, packageName: '',
    urgency: 'high', needsPeriodicReview: true, reviewIntervalDays: 30, lastReviewedAt: Date.now() - 86400000 * 5,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 120, updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'ei5', name: '手电筒', type: 'home-safety', location: '客厅电视柜右侧抽屉',
    findHint: '和电池放在一起，长筒形', photoDescription: '黑色长筒手电，带备用电池',
    expiryDate: null, checkDate: Date.now() + 86400000 * 180,
    contactId: null, contactName: '', packageId: null, packageName: '',
    urgency: 'medium', needsPeriodicReview: true, reviewIntervalDays: 180, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 200, updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'ei6', name: '电闸位置', type: 'home-safety', location: '玄关进门左手边配电箱',
    findHint: '进门左手边墙上灰色铁箱，需向上推盖子打开', photoDescription: '灰色铁箱，内有多个开关',
    expiryDate: null, checkDate: null,
    contactId: 'c11', contactName: '王师傅（水电维修）', packageId: null, packageName: '',
    urgency: 'high', needsPeriodicReview: false, reviewIntervalDays: null, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 300, updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'ei7', name: '燃气阀门', type: 'home-safety', location: '厨房灶台下方管道上',
    findHint: '灶台下方，红色把手横向是关，纵向是开', photoDescription: '红色把手阀门，横向关纵向开',
    expiryDate: null, checkDate: null,
    contactId: 'c11', contactName: '王师傅（水电维修）', packageId: null, packageName: '',
    urgency: 'high', needsPeriodicReview: false, reviewIntervalDays: null, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 300, updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'ei8', name: '家门钥匙（备用）', type: 'travel', location: '对门张阿姨家保管',
    findHint: '张阿姨（对门）保管了一把备用钥匙', photoDescription: '银色钥匙，带红色钥匙扣',
    expiryDate: null, checkDate: null,
    contactId: 'c4', contactName: '张阿姨（对门）', packageId: null, packageName: '',
    urgency: 'medium', needsPeriodicReview: false, reviewIntervalDays: null, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 365, updatedAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'ei9', name: '工具箱', type: 'repair', location: '阳台储物柜底层',
    findHint: '红色工具箱，里面有螺丝刀、扳手、胶带等', photoDescription: '红色塑料工具箱，内有常用工具',
    expiryDate: null, checkDate: Date.now() + 86400000 * 365,
    contactId: 'c12', contactName: '小李（家电维修）', packageId: null, packageName: '',
    urgency: 'low', needsPeriodicReview: true, reviewIntervalDays: 365, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 200, updatedAt: Date.now() - 86400000 * 40,
  },
  {
    id: 'ei10', name: '老年优待证', type: 'travel', location: '出门随身包内层口袋',
    findHint: '绿色小本，放在随身包里侧拉链袋', photoDescription: '绿色小本，印有"老年优待证"',
    expiryDate: null, checkDate: Date.now() + 86400000 * 180,
    contactId: null, contactName: '', packageId: null, packageName: '',
    urgency: 'low', needsPeriodicReview: true, reviewIntervalDays: 365, lastReviewedAt: null,
    findFeedback: null, feedbackNote: '', feedbackAt: null,
    createdAt: Date.now() - 86400000 * 180, updatedAt: Date.now() - 86400000 * 20,
  },
]

const DEFAULT_EMERGENCY_ACTIVITIES: EmergencyItemActivity[] = [
  { id: 'ea1', itemId: 'ei1', itemName: '医保卡', action: 'added', detail: '新增物品"医保卡"', timestamp: Date.now() - 86400000 * 30 },
  { id: 'ea2', itemId: 'ei6', itemName: '电闸位置', action: 'added', detail: '新增物品"电闸位置"', timestamp: Date.now() - 86400000 * 30 },
]

export const useEmergencyStore = defineStore('emergency', () => {
  const items = ref<EmergencyItem[]>(
    loadFromStorage<EmergencyItem[]>(STORAGE_KEY_EMERGENCY_ITEMS, DEFAULT_EMERGENCY_ITEMS)
  )
  const activities = ref<EmergencyItemActivity[]>(
    loadFromStorage<EmergencyItemActivity[]>(STORAGE_KEY_EMERGENCY_ACTIVITIES, DEFAULT_EMERGENCY_ACTIVITIES)
  )

  const groupedItems = computed(() => {
    const groups: Record<EmergencyItemType, EmergencyItem[]> = {
      medical: [], id: [], 'home-safety': [], travel: [], repair: [], other: [],
    }
    for (const item of items.value) {
      groups[item.type].push(item)
    }
    return groups
  })

  const highUrgencyItems = computed(() =>
    items.value.filter(i => i.urgency === 'high')
  )

  const expiringItems = computed(() => {
    const now = Date.now()
    const threshold = 30 * 86400000
    return items.value.filter(i => {
      if (i.expiryDate && i.expiryDate - now < threshold) return true
      if (i.checkDate && i.checkDate - now < threshold) return true
      if (i.needsPeriodicReview && i.reviewIntervalDays && i.lastReviewedAt) {
        const nextReview = i.lastReviewedAt + (i.reviewIntervalDays * 86400000)
        if (nextReview - now < threshold) return true
      }
      return false
    })
  })

  function getItemById(id: string): EmergencyItem | undefined {
    return items.value.find(i => i.id === id)
  }

  function addItem(data: Partial<EmergencyItem>) {
    const now = Date.now()
    const newItem: EmergencyItem = {
      id: generateId(),
      name: data.name || '新物品',
      type: data.type || 'other',
      location: data.location || '',
      findHint: data.findHint || '',
      photoDescription: data.photoDescription || '',
      expiryDate: data.expiryDate ?? null,
      checkDate: data.checkDate ?? null,
      contactId: data.contactId ?? null,
      contactName: data.contactName || '',
      packageId: data.packageId ?? null,
      packageName: data.packageName || '',
      urgency: data.urgency || 'medium',
      needsPeriodicReview: data.needsPeriodicReview ?? false,
      reviewIntervalDays: data.reviewIntervalDays ?? null,
      lastReviewedAt: data.lastReviewedAt ?? null,
      findFeedback: null,
      feedbackNote: '',
      feedbackAt: null,
      createdAt: now,
      updatedAt: now,
    }
    items.value.push(newItem)
    addActivity(newItem.id, newItem.name, 'added', `新增物品"${newItem.name}"`)
    return newItem
  }

  function updateItem(id: string, data: Partial<EmergencyItem>) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      const old = items.value[idx]
      if (data.location !== undefined && data.location !== old.location) {
        addActivity(id, old.name, 'location-changed', `"${old.name}"位置从"${old.location}"变更为"${data.location}"`)
      }
      items.value[idx] = { ...items.value[idx], ...data, updatedAt: Date.now() }
    }
  }

  function deleteItem(id: string) {
    items.value = items.value.filter(i => i.id !== id)
    activities.value = activities.value.filter(a => a.itemId !== id)
  }

  function setFindFeedback(id: string, feedback: FindFeedback, note: string) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    const oldFeedback = item.findFeedback
    item.findFeedback = feedback
    item.feedbackNote = note
    item.feedbackAt = Date.now()
    item.updatedAt = Date.now()
    addActivity(id, item.name, 'feedback', `"${item.name}"查找反馈：${FIND_FEEDBACK_LABELS[feedback]}${note ? ' - ' + note : ''}`)
    if ((feedback === 'unclear-location' || feedback === 'need-family-confirm') && oldFeedback !== feedback) {
      const followUpStore = useFollowUpStore()
      followUpStore.addItem({
        title: feedback === 'unclear-location'
          ? `确认"${item.name}"的存放位置`
          : `家人确认"${item.name}"的情况`,
        description: `老人查找"${item.name}"后反馈：${FIND_FEEDBACK_LABELS[feedback]}。${note ? '备注：' + note : ''}。物品当前位置记录：${item.location || '未记录'}。`,
        contactId: item.contactId,
        contactName: item.contactName,
        priority: item.urgency === 'high' ? 'high' : 'medium',
        sourceItemId: item.id,
        sourceItemName: item.name,
      })
    }
  }

  function markReviewed(id: string) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      item.lastReviewedAt = Date.now()
      item.updatedAt = Date.now()
      addActivity(id, item.name, 'reviewed', `"${item.name}"已完成复查`)
    }
  }

  function addActivity(itemId: string, itemName: string, action: EmergencyItemActivity['action'], detail: string) {
    activities.value.unshift({
      id: generateId(),
      itemId,
      itemName,
      action,
      detail,
      timestamp: Date.now(),
    })
    if (activities.value.length > 100) {
      activities.value = activities.value.slice(0, 100)
    }
  }

  function syncWithContacts(contacts: Contact[]) {
    for (const item of items.value) {
      if (item.contactId) {
        const live = contacts.find(c => c.id === item.contactId)
        if (!live) {
          item.contactName = item.contactName ? item.contactName + '（已删除）' : '联系人已删除'
        } else {
          item.contactName = live.name
        }
      }
    }
  }

  function syncWithPackages(packages: ListeningPackage[]) {
    for (const item of items.value) {
      if (item.packageId) {
        const live = packages.find(p => p.id === item.packageId)
        if (!live) {
          item.packageName = item.packageName ? item.packageName + '（已删除）' : '资料包已删除'
        } else {
          item.packageName = live.title
        }
      }
    }
  }

  watch(items, (val) => saveToStorage(STORAGE_KEY_EMERGENCY_ITEMS, val), { deep: true })
  watch(activities, (val) => saveToStorage(STORAGE_KEY_EMERGENCY_ACTIVITIES, val), { deep: true })

  return {
    items,
    activities,
    groupedItems,
    highUrgencyItems,
    expiringItems,
    getItemById,
    addItem,
    updateItem,
    deleteItem,
    setFindFeedback,
    markReviewed,
    addActivity,
    syncWithContacts,
    syncWithPackages,
  }
})

export const useStatsStore = defineStore('stats', () => {
  const contactStore = useContactStore()
  const packageStore = usePackageStore()
  const drillStore = useDrillStore()
  const followUpStore = useFollowUpStore()
  const emergencyStore = useEmergencyStore()

  const stats = computed<StatsData>(() => {
    const groupCounts: Record<ContactGroup, number> = {
      family: 0, neighbor: 0, community: 0, hospital: 0, repair: 0, pharmacy: 0,
    }
    for (const c of contactStore.contacts) {
      groupCounts[c.group]++
    }

    const emergencyItemTypeCounts: Record<EmergencyItemType, number> = {
      medical: 0, id: 0, 'home-safety': 0, travel: 0, repair: 0, other: 0,
    }
    for (const item of emergencyStore.items) {
      emergencyItemTypeCounts[item.type]++
    }

    const feedbackDistribution: Record<FindFeedback, number> = {
      found: 0, 'not-found': 0, 'unclear-location': 0, 'need-family-confirm': 0,
    }
    for (const item of emergencyStore.items) {
      if (item.findFeedback) {
        feedbackDistribution[item.findFeedback]++
      }
    }

    const highUrgencyTotal = emergencyStore.highUrgencyItems.length
    const highUrgencyWithFeedback = emergencyStore.highUrgencyItems.filter(i => i.findFeedback).length
    const highUrgencyCoverage = highUrgencyTotal > 0 ? Math.round((highUrgencyWithFeedback / highUrgencyTotal) * 100) : 0

    return {
      totalContacts: contactStore.contacts.length,
      emergencyContacts: contactStore.emergencyContacts.length,
      groupCounts,
      totalPackages: packageStore.packages.length,
      highlightedPackages: packageStore.packages.filter(p => p.isHighlighted).length,
      totalDrills: drillStore.history.length,
      totalFollowUps: followUpStore.items.length,
      completedFollowUps: followUpStore.doneItems.length,
      pendingFollowUps: followUpStore.pendingItems.length,
      totalEmergencyItems: emergencyStore.items.length,
      emergencyItemTypeCounts,
      expiringOrReviewCount: emergencyStore.expiringItems.length,
      feedbackDistribution,
      highUrgencyCoverage,
    }
  })

  return {
    stats,
  }
})

const STORAGE_KEY_LEAVING_CHECKLISTS = 'phonebook-leaving-checklists'
const STORAGE_KEY_LEAVING_SESSION = 'phonebook-leaving-session'
const STORAGE_KEY_LEAVING_HISTORY = 'phonebook-leaving-history'
const STORAGE_KEY_RETURN_CONFIRMS = 'phonebook-return-confirms'
const STORAGE_KEY_CHECKLIST_ACTIVITIES = 'phonebook-checklist-activities'

function buildDefaultChecklistItems(scene: LeavingChecklistScene): ChecklistItem[] {
  const templates: Record<LeavingChecklistScene, { name: string; category: ChecklistItemCategory; isKeyPoint: boolean; reminder: string }[]> = {
    'hospital-visit': [
      { name: '紧急联系卡', category: 'contact-card', isKeyPoint: true, reminder: '带上打印好的联系人卡' },
      { name: '身份证', category: 'id', isKeyPoint: true, reminder: '挂号和就诊必需' },
      { name: '医保卡', category: 'id', isKeyPoint: true, reminder: '用于医保结算' },
      { name: '病历本', category: 'medicine', isKeyPoint: true, reminder: '包含过往就诊记录' },
      { name: '常用药品', category: 'medicine', isKeyPoint: true, reminder: '按服药清单准备' },
      { name: '家门钥匙', category: 'key', isKeyPoint: true, reminder: '别把自己锁在门外' },
      { name: '手机', category: 'phone', isKeyPoint: true, reminder: '确认电量充足' },
      { name: '手机充电器', category: 'emergency-item', isKeyPoint: false, reminder: '长时间外出必备' },
      { name: '复诊预约单', category: 'emergency-item', isKeyPoint: true, reminder: '确认时间和科室' },
    ],
    'family-visit': [
      { name: '紧急联系卡', category: 'contact-card', isKeyPoint: true, reminder: '随身携带应急' },
      { name: '家门钥匙', category: 'key', isKeyPoint: true, reminder: '回家要开门' },
      { name: '手机', category: 'phone', isKeyPoint: true, reminder: '保持通讯畅通' },
      { name: '身份证', category: 'id', isKeyPoint: false, reminder: '长途出行建议携带' },
      { name: '伴手礼/物品', category: 'emergency-item', isKeyPoint: false, reminder: '给亲戚带的礼物' },
      { name: '常用药', category: 'medicine', isKeyPoint: true, reminder: '按时服药别忘记' },
    ],
    'grocery': [
      { name: '家门钥匙', category: 'key', isKeyPoint: true, reminder: '买菜回来要开门' },
      { name: '手机', category: 'phone', isKeyPoint: true, reminder: '支付和联系用' },
      { name: '购物袋', category: 'emergency-item', isKeyPoint: false, reminder: '环保又方便' },
      { name: '买菜清单', category: 'emergency-item', isKeyPoint: false, reminder: '避免买错或漏买' },
    ],
    'community': [
      { name: '紧急联系卡', category: 'contact-card', isKeyPoint: true, reminder: '活动时间长时必备' },
      { name: '家门钥匙', category: 'key', isKeyPoint: true, reminder: '活动结束回家' },
      { name: '手机', category: 'phone', isKeyPoint: true, reminder: '保持联系' },
      { name: '老年证/优待证', category: 'id', isKeyPoint: false, reminder: '活动可能需要' },
      { name: '常用药', category: 'medicine', isKeyPoint: true, reminder: '外出时间长要按时吃' },
    ],
    'emergency-evac': [
      { name: '紧急联系卡', category: 'contact-card', isKeyPoint: true, reminder: '第一时间带上' },
      { name: '身份证', category: 'id', isKeyPoint: true, reminder: '证明身份' },
      { name: '家门钥匙', category: 'key', isKeyPoint: true, reminder: '情况稳定后回家' },
      { name: '手机', category: 'phone', isKeyPoint: true, reminder: '联系家人和救援' },
      { name: '应急药品包', category: 'medicine', isKeyPoint: true, reminder: '急救和常用药' },
      { name: '关闭燃气', category: 'safety-check', isKeyPoint: true, reminder: '总阀门顺时针关闭' },
      { name: '关闭电源', category: 'safety-check', isKeyPoint: true, reminder: '拉下电闸或拔插头' },
      { name: '手电筒', category: 'emergency-item', isKeyPoint: true, reminder: '断电时照明' },
      { name: '饮用水', category: 'emergency-item', isKeyPoint: true, reminder: '至少两瓶' },
      { name: '薄外套', category: 'emergency-item', isKeyPoint: false, reminder: '夜间或降温用' },
    ],
  }
  const template = templates[scene] || []
  return template.map((t, i) => ({
    id: generateId(),
    name: t.name,
    category: t.category,
    order: i,
    isKeyPoint: t.isKeyPoint,
    reminder: t.reminder,
    stepNote: '',
    linkedEmergencyItemId: null,
    linkedEmergencyItemName: '',
    linkedContactId: null,
    linkedContactName: '',
  }))
}

const DEFAULT_CHECKLISTS: LeavingChecklist[] = LEAVING_SCENES.map((scene, idx) => ({
  id: 'lc-' + scene.id,
  scene: scene.id,
  name: scene.name,
  description: scene.description,
  items: buildDefaultChecklistItems(scene.id),
  linkedContactIds: ['c1', 'c2'],
  linkedContactNames: '张小明（儿子）、李小红（女儿）',
  estimatedDuration: scene.id === 'grocery' ? '30分钟-1小时' : scene.id === 'hospital-visit' ? '2-4小时' : scene.id === 'emergency-evac' ? '视情况而定' : '1-3小时',
  reminderText: scene.id === 'emergency-evac' ? '保持冷静，按步骤逐一检查，安全第一！' : '出门前逐项检查，不要着急，确认安全再关门。',
  keySteps: scene.id === 'emergency-evac' ? '1.先关火关电关燃气\n2.带好随身关键物品\n3.确认邻居是否需要帮助\n4.沿安全通道撤离' : '1.按清单逐项检查\n2.重点项不能遗漏\n3.锁好门再离开',
  createdAt: Date.now() - 86400000 * (idx + 1),
  updatedAt: Date.now() - 86400000 * idx,
  order: idx,
  isHighlighted: scene.id === 'hospital-visit' || scene.id === 'emergency-evac',
}))

export const useLeavingChecklistStore = defineStore('leavingChecklist', () => {
  const checklists = ref<LeavingChecklist[]>(
    loadFromStorage<LeavingChecklist[]>(STORAGE_KEY_LEAVING_CHECKLISTS, DEFAULT_CHECKLISTS)
  )

  const sessionStore = useLeavingSessionStore()

  const sortedChecklists = computed(() =>
    [...checklists.value].sort((a, b) => {
      if (a.isHighlighted !== b.isHighlighted) return a.isHighlighted ? -1 : 1
      return a.order - b.order
    })
  )

  function getChecklistById(id: string): LeavingChecklist | undefined {
    return checklists.value.find(c => c.id === id)
  }

  function createChecklist(data: Partial<LeavingChecklist> & { scene: LeavingChecklistScene }) {
    const now = Date.now()
    const newChecklist: LeavingChecklist = {
      id: generateId(),
      scene: data.scene,
      name: data.name || LEAVING_SCENE_LABELS[data.scene],
      description: data.description || LEAVING_SCENES.find(s => s.id === data.scene)?.description || '',
      items: data.items && data.items.length > 0 ? data.items : buildDefaultChecklistItems(data.scene),
      linkedContactIds: data.linkedContactIds || [],
      linkedContactNames: data.linkedContactNames || '',
      estimatedDuration: data.estimatedDuration || '1-2小时',
      reminderText: data.reminderText || '出门前请逐项检查，确认好再离开。',
      keySteps: data.keySteps || '',
      createdAt: now,
      updatedAt: now,
      order: checklists.value.length,
      isHighlighted: data.isHighlighted || false,
    }
    checklists.value.push(newChecklist)
    sessionStore.addActivity('checklist-created', newChecklist.id, newChecklist.name, null, `创建了离家清单"${newChecklist.name}"`)
    return newChecklist
  }

  function updateChecklist(id: string, data: Partial<LeavingChecklist>) {
    const idx = checklists.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      const old = checklists.value[idx]
      checklists.value[idx] = { ...checklists.value[idx], ...data, updatedAt: Date.now() }
      sessionStore.addActivity('checklist-updated', id, old.name, null, `更新了离家清单"${old.name}"`)
    }
  }

  function deleteChecklist(id: string) {
    const checklist = checklists.value.find(c => c.id === id)
    checklists.value = checklists.value.filter(c => c.id !== id)
    checklists.value.forEach((c, i) => { c.order = i })
    if (checklist) {
      sessionStore.addActivity('checklist-deleted', id, checklist.name, null, `删除了离家清单"${checklist.name}"`)
    }
  }

  function toggleHighlight(id: string) {
    const cl = checklists.value.find(c => c.id === id)
    if (cl) {
      cl.isHighlighted = !cl.isHighlighted
      cl.updatedAt = Date.now()
    }
  }

  function addItem(checklistId: string, data: Partial<ChecklistItem> & { category: ChecklistItemCategory; name: string }) {
    const cl = checklists.value.find(c => c.id === checklistId)
    if (!cl) return
    const newItem: ChecklistItem = {
      id: generateId(),
      name: data.name,
      category: data.category,
      order: cl.items.length,
      isKeyPoint: data.isKeyPoint ?? false,
      reminder: data.reminder || '',
      stepNote: data.stepNote || '',
      linkedEmergencyItemId: data.linkedEmergencyItemId ?? null,
      linkedEmergencyItemName: data.linkedEmergencyItemName || '',
      linkedContactId: data.linkedContactId ?? null,
      linkedContactName: data.linkedContactName || '',
    }
    cl.items.push(newItem)
    cl.updatedAt = Date.now()
    return newItem
  }

  function updateItem(checklistId: string, itemId: string, data: Partial<ChecklistItem>) {
    const cl = checklists.value.find(c => c.id === checklistId)
    if (!cl) return
    const idx = cl.items.findIndex(i => i.id === itemId)
    if (idx !== -1) {
      cl.items[idx] = { ...cl.items[idx], ...data }
      cl.updatedAt = Date.now()
    }
  }

  function removeItem(checklistId: string, itemId: string) {
    const cl = checklists.value.find(c => c.id === checklistId)
    if (!cl) return
    cl.items = cl.items.filter(i => i.id !== itemId)
    cl.items.forEach((i, idx) => { i.order = idx })
    cl.updatedAt = Date.now()
  }

  function reorderItems(checklistId: string, fromIndex: number, toIndex: number) {
    const cl = checklists.value.find(c => c.id === checklistId)
    if (!cl) return
    const arr = [...cl.items].sort((a, b) => a.order - b.order)
    const [moved] = arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, moved)
    arr.forEach((i, idx) => { i.order = idx })
    cl.items = [...arr]
    cl.updatedAt = Date.now()
  }

  function syncWithContacts(contacts: Contact[]) {
    for (const cl of checklists.value) {
      const names = cl.linkedContactIds
        .map(id => contacts.find(c => c.id === id)?.name)
        .filter(Boolean) as string[]
      cl.linkedContactNames = names.join('、')
    }
  }

  function syncWithEmergencyItems(items: EmergencyItem[]) {
    for (const cl of checklists.value) {
      for (const it of cl.items) {
        if (it.linkedEmergencyItemId) {
          const live = items.find(ei => ei.id === it.linkedEmergencyItemId)
          it.linkedEmergencyItemName = live?.name || it.linkedEmergencyItemName || '物品已删除'
        }
      }
    }
  }

  watch(checklists, (val) => saveToStorage(STORAGE_KEY_LEAVING_CHECKLISTS, val), { deep: true })

  return {
    checklists,
    sortedChecklists,
    getChecklistById,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    toggleHighlight,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    syncWithContacts,
    syncWithEmergencyItems,
  }
})

export const useLeavingSessionStore = defineStore('leavingSession', () => {
  const followUpStore = useFollowUpStore()
  const session = ref<LeavingSession | null>(loadFromStorage<LeavingSession | null>(STORAGE_KEY_LEAVING_SESSION, null))
  const history = ref<LeavingSession[]>(loadFromStorage<LeavingSession[]>(STORAGE_KEY_LEAVING_HISTORY, []))
  const returnConfirms = ref<ReturnConfirmRecord[]>(loadFromStorage<ReturnConfirmRecord[]>(STORAGE_KEY_RETURN_CONFIRMS, []))
  const activities = ref<ChecklistActivity[]>(loadFromStorage<ChecklistActivity[]>(STORAGE_KEY_CHECKLIST_ACTIVITIES, []))

  const hasActiveSession = computed(() =>
    session.value !== null && (session.value.status === 'executing' || session.value.status === 'checking')
  )

  const remainingSteps = computed(() => {
    if (!session.value) return 0
    return session.value.steps.filter(s => s.status === 'pending').length
  })

  const keyPointSteps = computed(() => {
    if (!session.value) return []
    return session.value.steps.filter(s => s.isKeyPoint)
  })

  const unconfirmedKeyPoints = computed(() => {
    return keyPointSteps.value.filter(s => s.status === 'pending' || s.status === 'not-found')
  })

  function startSession(checklist: LeavingChecklist) {
    const now = Date.now()
    const steps: ExecutingStep[] = checklist.items
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        status: 'pending' as ChecklistStepStatus,
        note: '',
        linkedEmergencyItemId: item.linkedEmergencyItemId,
        linkedEmergencyItemName: item.linkedEmergencyItemName,
        linkedContactId: item.linkedContactId,
        linkedContactName: item.linkedContactName,
        isKeyPoint: item.isKeyPoint,
        timestamp: 0,
      }))
    session.value = {
      id: generateId(),
      checklistId: checklist.id,
      checklistName: checklist.name,
      scene: checklist.scene,
      status: 'executing',
      steps,
      currentStepIndex: 0,
      startedAt: now,
      estimatedEndAt: null,
      finishedAt: null,
      returnConfirmedAt: null,
    }
    addActivity('session-started', checklist.id, checklist.name, session.value.id, `开始执行离家清单"${checklist.name}"`)
  }

  function setStepStatus(stepIndex: number, status: ChecklistStepStatus, note: string = '') {
    if (!session.value) return
    const step = session.value.steps[stepIndex]
    if (!step) return
    step.status = status
    step.note = note
    step.timestamp = Date.now()

    if (status === 'need-help') {
      const source: ChecklistFollowUpSource = {
        checklistId: session.value.checklistId,
        checklistName: session.value.checklistName,
        sessionId: session.value.id,
        itemId: step.itemId,
        itemName: step.itemName,
        stepIndex,
        linkedEmergencyItemId: step.linkedEmergencyItemId,
        linkedEmergencyItemName: step.linkedEmergencyItemName,
        linkedContactId: step.linkedContactId,
        linkedContactName: step.linkedContactName,
      }
      followUpStore.addItem({
        title: `协助确认"${step.itemName}"`,
        description: `老人在执行离家清单"${session.value.checklistName}"的第${stepIndex + 1}步"${step.itemName}"时需要家人帮忙。${note ? '备注：' + note : ''}`,
        priority: step.isKeyPoint ? 'high' : 'medium',
        sourceItemId: step.linkedEmergencyItemId,
        sourceItemName: step.linkedEmergencyItemName,
        contactId: step.linkedContactId,
        contactName: step.linkedContactName,
        checklistSource: source,
      })
      addActivity('session-abnormal', session.value.checklistId, session.value.checklistName, session.value.id,
        `"${session.value.checklistName}"第${stepIndex + 1}步"${step.itemName}"需要家人帮忙`)
    }

    if (status === 'not-found') {
      const source: ChecklistFollowUpSource = {
        checklistId: session.value.checklistId,
        checklistName: session.value.checklistName,
        sessionId: session.value.id,
        itemId: step.itemId,
        itemName: step.itemName,
        stepIndex,
        linkedEmergencyItemId: step.linkedEmergencyItemId,
        linkedEmergencyItemName: step.linkedEmergencyItemName,
        linkedContactId: step.linkedContactId,
        linkedContactName: step.linkedContactName,
      }
      followUpStore.addItem({
        title: `找不到"${step.itemName}"，请确认位置`,
        description: `老人在执行离家清单"${session.value.checklistName}"时找不到"${step.itemName}"。${note ? '备注：' + note : ''}。${step.linkedEmergencyItemName ? '关联物品：' + step.linkedEmergencyItemName : ''}`,
        priority: step.isKeyPoint ? 'high' : 'medium',
        sourceItemId: step.linkedEmergencyItemId,
        sourceItemName: step.linkedEmergencyItemName,
        checklistSource: source,
      })
      addActivity('session-abnormal', session.value.checklistId, session.value.checklistName, session.value.id,
        `"${session.value.checklistName}"第${stepIndex + 1}步"${step.itemName}"找不到`)
    }
  }

  function goToStep(index: number) {
    if (!session.value) return
    if (index >= 0 && index < session.value.steps.length) {
      session.value.currentStepIndex = index
    }
  }

  function nextStep() {
    if (!session.value) return
    const next = session.value.currentStepIndex + 1
    if (next < session.value.steps.length) {
      session.value.currentStepIndex = next
    }
  }

  function prevStep() {
    if (!session.value) return
    const prev = session.value.currentStepIndex - 1
    if (prev >= 0) {
      session.value.currentStepIndex = prev
    }
  }

  function resetAllSteps() {
    if (!session.value) return
    for (const step of session.value.steps) {
      step.status = 'pending'
      step.note = ''
      step.timestamp = 0
    }
    session.value.currentStepIndex = 0
    session.value.status = 'executing'
  }

  function finishExecution() {
    if (!session.value) return
    session.value.status = 'return-confirm'
    session.value.finishedAt = Date.now()
    addActivity('session-completed', session.value.checklistId, session.value.checklistName, session.value.id,
      `离家清单"${session.value.checklistName}"执行完成，待回家确认`)
  }

  function submitReturnConfirm(confirmType: ReturnConfirmType, forgotItems: string[] = [], notes: string = '') {
    if (!session.value) return
    const now = Date.now()
    const record: ReturnConfirmRecord = {
      id: generateId(),
      sessionId: session.value.id,
      checklistId: session.value.checklistId,
      checklistName: session.value.checklistName,
      scene: session.value.scene,
      confirmType,
      forgotItems,
      notes,
      createdAt: now,
    }
    returnConfirms.value.unshift(record)
    session.value.returnConfirmedAt = now
    session.value.status = 'completed'

    if (confirmType === 'forgot-items') {
      for (const itemName of forgotItems) {
        followUpStore.addItem({
          title: `回家发现忘带"${itemName}"`,
          description: `执行离家清单"${session.value.checklistName}"后回家确认发现忘带"${itemName}"。${notes ? '备注：' + notes : ''}`,
          priority: 'medium',
          checklistSource: {
            checklistId: session.value.checklistId,
            checklistName: session.value.checklistName,
            sessionId: session.value.id,
            itemId: '',
            itemName,
            stepIndex: -1,
            linkedEmergencyItemId: null,
            linkedEmergencyItemName: '',
            linkedContactId: null,
            linkedContactName: '',
          },
        })
      }
    }

    if (confirmType === 'need-notes' && notes) {
      followUpStore.addItem({
        title: `离家清单补充说明需关注`,
        description: `离家清单"${session.value.checklistName}"返回补充说明：${notes}`,
        priority: 'low',
        checklistSource: {
          checklistId: session.value.checklistId,
          checklistName: session.value.checklistName,
          sessionId: session.value.id,
          itemId: '',
          itemName: '',
          stepIndex: -1,
          linkedEmergencyItemId: null,
          linkedEmergencyItemName: '',
          linkedContactId: null,
          linkedContactName: '',
        },
      })
    }

    const confirmLabelMap: Record<ReturnConfirmType, string> = {
      'safe-home': '已安全到家',
      'forgot-items': `忘带物品（${forgotItems.join('、')}）`,
      'need-notes': '需要补充说明',
    }
    addActivity('return-confirmed', session.value.checklistId, session.value.checklistName, session.value.id,
      `回家确认：${confirmLabelMap[confirmType]}`)

    history.value.unshift({ ...session.value })
    if (history.value.length > 50) {
      history.value = history.value.slice(0, 50)
    }
    session.value = null
  }

  function clearSession() {
    session.value = null
  }

  function addActivity(action: ChecklistActivity['action'], checklistId: string, checklistName: string, sessionId: string | null, detail: string) {
    activities.value.unshift({
      id: generateId(),
      action,
      checklistId,
      checklistName,
      sessionId,
      detail,
      timestamp: Date.now(),
    })
    if (activities.value.length > 200) {
      activities.value = activities.value.slice(0, 200)
    }
  }

  const checklistStats = computed<ChecklistStatsData>(() => {
    const checklistStore = useLeavingChecklistStore()
    const sceneCounts: Record<LeavingChecklistScene, number> = {
      'hospital-visit': 0, 'family-visit': 0, 'grocery': 0, 'community': 0, 'emergency-evac': 0,
    }
    const abnormalDist: Record<ChecklistStepStatus, number> = {
      'pending': 0, 'done': 0, 'not-found': 0, 'skip': 0, 'need-help': 0,
    }
    const returnRatio: Record<ReturnConfirmType, number> = {
      'safe-home': 0, 'forgot-items': 0, 'need-notes': 0,
    }

    const completedHistory = history.value.filter(h => h.status === 'completed')
    for (const h of completedHistory) {
      sceneCounts[h.scene]++
      for (const step of h.steps) {
        abnormalDist[step.status]++
      }
    }

    for (const rc of returnConfirms.value) {
      returnRatio[rc.confirmType]++
    }

    let highRiskTotal = 0
    let highRiskDone = 0
    for (const h of completedHistory) {
      const keySteps = h.steps.filter(s => s.isKeyPoint)
      highRiskTotal += keySteps.length
      highRiskDone += keySteps.filter(s => s.status === 'done' || s.status === 'skip').length
    }

    return {
      totalChecklists: checklistStore.checklists.length,
      sceneExecutionCounts: sceneCounts,
      abnormalStepDistribution: abnormalDist,
      returnConfirmRatio: returnRatio,
      totalReturnConfirms: returnConfirms.value.length,
      highRiskStepCompletionRate: highRiskTotal > 0 ? Math.round((highRiskDone / highRiskTotal) * 100) : 0,
      totalSessions: history.value.length,
      completedSessions: completedHistory.length,
    }
  })

  watch(session, (val) => saveToStorage(STORAGE_KEY_LEAVING_SESSION, val), { deep: true })
  watch(history, (val) => saveToStorage(STORAGE_KEY_LEAVING_HISTORY, val), { deep: true })
  watch(returnConfirms, (val) => saveToStorage(STORAGE_KEY_RETURN_CONFIRMS, val), { deep: true })
  watch(activities, (val) => saveToStorage(STORAGE_KEY_CHECKLIST_ACTIVITIES, val), { deep: true })

  return {
    session,
    history,
    returnConfirms,
    activities,
    hasActiveSession,
    remainingSteps,
    keyPointSteps,
    unconfirmedKeyPoints,
    checklistStats,
    startSession,
    setStepStatus,
    goToStep,
    nextStep,
    prevStep,
    resetAllSteps,
    finishExecution,
    submitReturnConfirm,
    clearSession,
    addActivity,
  }
})
