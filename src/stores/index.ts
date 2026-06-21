import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Contact, ContactGroup, LayoutConfig, CardFormat, FontSize } from '@/types'
import { generateId, GROUP_LABELS, GROUP_COLORS } from '@/types'

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
    storedContacts && storedContacts.length >= 3 ? storedContacts : DEFAULT_CONTACTS
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
