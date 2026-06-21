export type ContactGroup = 'family' | 'neighbor' | 'community' | 'hospital' | 'repair' | 'pharmacy'

export interface Contact {
  id: string
  name: string
  phone: string
  group: ContactGroup
  priority: number
  color: string
  note: string
  isEmergency: boolean
}

export type CardFormat = 'phone-side' | 'fridge' | 'pocket'
export type FontSize = 'medium' | 'large' | 'extra-large'

export interface LayoutConfig {
  format: CardFormat
  fontSize: FontSize
  accentColor: string
  groupOrder: ContactGroup[]
}

export interface Scenario {
  id: string
  name: string
  description: string
  icon: string
  groupOrder: ContactGroup[]
}

export const GROUP_LABELS: Record<ContactGroup, string> = {
  family: '亲属',
  neighbor: '邻居',
  community: '社区网格员',
  hospital: '常去医院',
  repair: '维修师傅',
  pharmacy: '药店',
}

export const GROUP_COLORS: Record<ContactGroup, string> = {
  family: '#E8652B',
  neighbor: '#7BAE7F',
  community: '#5B9BD5',
  hospital: '#D94F4F',
  repair: '#E8A838',
  pharmacy: '#9B6DB7',
}

export const FONT_SIZE_MAP: Record<FontSize, { label: string; base: string; name: string; phone: string; group: string }> = {
  medium: { label: '中号', base: 'text-card-md', name: 'text-card-lg', phone: 'text-card-xl', group: 'text-card-md' },
  large: { label: '大号', base: 'text-card-lg', name: 'text-card-xl', phone: 'text-card-2xl', group: 'text-card-lg' },
  'extra-large': { label: '超大号', base: 'text-card-xl', name: 'text-card-2xl', phone: 'text-card-2xl', group: 'text-card-xl' },
}

export const FORMAT_LABELS: Record<CardFormat, string> = {
  'phone-side': '电话机旁',
  fridge: '冰箱门',
  pocket: '随身口袋卡',
}

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'emergency',
    name: '突发急救',
    description: '遇到突发疾病或意外伤害时，按以下顺序联系',
    icon: 'heart',
    groupOrder: ['hospital', 'family', 'community', 'pharmacy', 'neighbor', 'repair'],
  },
  {
    id: 'repair',
    name: '设备维修',
    description: '家中水电设备故障时，按以下顺序联系',
    icon: 'wrench',
    groupOrder: ['repair', 'community', 'neighbor', 'family', 'pharmacy', 'hospital'],
  },
  {
    id: 'pharmacy',
    name: '购药求助',
    description: '需要购买药品或咨询用药时，按以下顺序联系',
    icon: 'pill',
    groupOrder: ['pharmacy', 'hospital', 'family', 'community', 'neighbor', 'repair'],
  },
  {
    id: 'daily',
    name: '日常联络',
    description: '日常联系和社区事务，按以下顺序联系',
    icon: 'phone',
    groupOrder: ['family', 'neighbor', 'community', 'pharmacy', 'hospital', 'repair'],
  },
]

export type ContactResult = 'connected' | 'no-answer' | 'wrong-number' | 'call-later' | 'help-done'

export const CONTACT_RESULT_LABELS: Record<ContactResult, string> = {
  'connected': '已接通',
  'no-answer': '无人接听',
  'wrong-number': '号码错误',
  'call-later': '稍后再拨',
  'help-done': '已完成求助',
}

export const CONTACT_RESULT_COLORS: Record<ContactResult, string> = {
  'connected': '#7BAE7F',
  'no-answer': '#E8A838',
  'wrong-number': '#D94F4F',
  'call-later': '#5B9BD5',
  'help-done': '#5C9460',
}

export interface DrillContactAttempt {
  contactId: string
  contactName: string
  contactPhone: string
  contactGroup: ContactGroup
  contactNote: string
  result: ContactResult | null
  note: string
  timestamp: number
}

export type DrillStatus = 'selecting' | 'running' | 'finished'

export interface DrillSession {
  id: string
  scenarioId: string
  scenarioName: string
  status: DrillStatus
  queue: DrillContactAttempt[]
  currentIndex: number
  startedAt: number
  elapsedSeconds: number
  finishedAt: number | null
}

export interface DrillHistoryRecord {
  id: string
  scenarioId: string
  scenarioName: string
  attempts: DrillContactAttempt[]
  startedAt: number
  finishedAt: number
  elapsedSeconds: number
  summary: string
}

export const DRILL_MODES = [
  { id: 'emergency', name: '突发急救', icon: 'heart', groupOrder: ['hospital', 'family', 'community', 'pharmacy', 'neighbor', 'repair'] as ContactGroup[] },
  { id: 'repair', name: '设备维修', icon: 'wrench', groupOrder: ['repair', 'community', 'neighbor', 'family', 'pharmacy', 'hospital'] as ContactGroup[] },
  { id: 'pharmacy', name: '购药求助', icon: 'pill', groupOrder: ['pharmacy', 'hospital', 'family', 'community', 'neighbor', 'repair'] as ContactGroup[] },
  { id: 'daily', name: '日常联络', icon: 'phone', groupOrder: ['family', 'neighbor', 'community', 'pharmacy', 'hospital', 'repair'] as ContactGroup[] },
  { id: 'custom', name: '自定义场景', icon: 'settings', groupOrder: ['family', 'neighbor', 'community', 'hospital', 'repair', 'pharmacy'] as ContactGroup[] },
]

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export interface PackageContact {
  contactId: string
  contactName: string
  contactPhone: string
  contactGroup: ContactGroup
  contactNote: string
  customNote: string
  order: number
  isKeyPoint: boolean
}

export interface ListeningPackage {
  id: string
  title: string
  purpose: string
  guideText: string
  familyReminder: string
  contacts: PackageContact[]
  isHighlighted: boolean
  order: number
  createdAt: number
  updatedAt: number
}

export type FollowUpPriority = 'high' | 'medium' | 'low'
export type FollowUpStatus = 'pending' | 'done'

export interface FollowUpItem {
  id: string
  title: string
  description: string
  contactId: string | null
  contactName: string
  dueDate: number | null
  priority: FollowUpPriority
  status: FollowUpStatus
  createdAt: number
  completedAt: number | null
}

export const FOLLOW_UP_PRIORITY_LABELS: Record<FollowUpPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

export const FOLLOW_UP_PRIORITY_COLORS: Record<FollowUpPriority, string> = {
  high: '#D94F4F',
  medium: '#E8A838',
  low: '#7BAE7F',
}

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: '待处理',
  done: '已完成',
}

export interface StatsData {
  totalContacts: number
  emergencyContacts: number
  groupCounts: Record<ContactGroup, number>
  totalPackages: number
  highlightedPackages: number
  totalDrills: number
  totalFollowUps: number
  completedFollowUps: number
  pendingFollowUps: number
}

export const PACKAGE_DEFAULT_GUIDE_TEXTS = [
  '您好，这是您的紧急联系资料包，请慢慢查看。',
  '请记住这些重要的联系人和电话号码。',
  '遇到紧急情况时，请按照顺序联系。',
  '每天回顾一遍，加深记忆。',
]
