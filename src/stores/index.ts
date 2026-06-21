import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Contact, ContactGroup, LayoutConfig, CardFormat, FontSize, DrillSession, DrillHistoryRecord, DrillContactAttempt, ContactResult } from '@/types'
import { generateId, GROUP_LABELS, GROUP_COLORS, CONTACT_RESULT_LABELS, DRILL_MODES } from '@/types'

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
