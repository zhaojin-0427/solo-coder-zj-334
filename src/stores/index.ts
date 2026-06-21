import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Contact, ContactGroup, LayoutConfig, CardFormat, FontSize, DrillSession, DrillHistoryRecord, DrillContactAttempt, ContactResult, ListeningPackage, PackageContact, FollowUpItem, FollowUpPriority, FollowUpStatus, StatsData } from '@/types'
import { generateId, GROUP_LABELS, GROUP_COLORS, CONTACT_RESULT_LABELS, DRILL_MODES, PACKAGE_DEFAULT_GUIDE_TEXTS, FOLLOW_UP_PRIORITY_LABELS, FOLLOW_UP_STATUS_LABELS } from '@/types'

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

export const useStatsStore = defineStore('stats', () => {
  const contactStore = useContactStore()
  const packageStore = usePackageStore()
  const drillStore = useDrillStore()
  const followUpStore = useFollowUpStore()

  const stats = computed<StatsData>(() => {
    const groupCounts: Record<ContactGroup, number> = {
      family: 0, neighbor: 0, community: 0, hospital: 0, repair: 0, pharmacy: 0,
    }
    for (const c of contactStore.contacts) {
      groupCounts[c.group]++
    }

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
    }
  })

  return {
    stats,
  }
})
