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

export type EmergencyItemType = 'medical' | 'id' | 'home-safety' | 'travel' | 'repair' | 'other'
export type EmergencyUrgency = 'high' | 'medium' | 'low'
export type FindFeedback = 'found' | 'not-found' | 'unclear-location' | 'need-family-confirm'

export const EMERGENCY_ITEM_TYPE_LABELS: Record<EmergencyItemType, string> = {
  medical: '医疗',
  id: '证件',
  'home-safety': '家居安全',
  travel: '出行',
  repair: '维修',
  other: '其他',
}

export const EMERGENCY_ITEM_TYPE_COLORS: Record<EmergencyItemType, string> = {
  medical: '#D94F4F',
  id: '#5B9BD5',
  'home-safety': '#E8A838',
  travel: '#7BAE7F',
  repair: '#E8652B',
  other: '#9B6DB7',
}

export const EMERGENCY_ITEM_TYPE_ICONS: Record<EmergencyItemType, string> = {
  medical: 'heart-pulse',
  id: 'credit-card',
  'home-safety': 'shield',
  travel: 'car',
  repair: 'wrench',
  other: 'box',
}

export const EMERGENCY_URGENCY_LABELS: Record<EmergencyUrgency, string> = {
  high: '紧急',
  medium: '一般',
  low: '不急',
}

export const EMERGENCY_URGENCY_COLORS: Record<EmergencyUrgency, string> = {
  high: '#D94F4F',
  medium: '#E8A838',
  low: '#7BAE7F',
}

export const FIND_FEEDBACK_LABELS: Record<FindFeedback, string> = {
  found: '已找到',
  'not-found': '没找到',
  'unclear-location': '位置不清楚',
  'need-family-confirm': '需要家人确认',
}

export const FIND_FEEDBACK_COLORS: Record<FindFeedback, string> = {
  found: '#5C9460',
  'not-found': '#D94F4F',
  'unclear-location': '#E8A838',
  'need-family-confirm': '#5B9BD5',
}

export interface EmergencyItem {
  id: string
  name: string
  type: EmergencyItemType
  location: string
  findHint: string
  photoDescription: string
  expiryDate: number | null
  checkDate: number | null
  contactId: string | null
  contactName: string
  packageId: string | null
  packageName: string
  urgency: EmergencyUrgency
  needsPeriodicReview: boolean
  reviewIntervalDays: number | null
  lastReviewedAt: number | null
  findFeedback: FindFeedback | null
  feedbackNote: string
  feedbackAt: number | null
  createdAt: number
  updatedAt: number
}

export interface ElderlyScenario {
  id: string
  name: string
  description: string
  icon: string
  itemTypes: EmergencyItemType[]
  itemKeywords: string[]
}

export const ELDERLY_SCENARIOS: ElderlyScenario[] = [
  {
    id: 'sudden-illness',
    name: '突发就医',
    description: '突发疾病需要就医时，优先准备这些物品',
    icon: 'heart-pulse',
    itemTypes: ['medical', 'id'],
    itemKeywords: ['医保', '身份证', '病历', '常用药', '急救'],
  },
  {
    id: 'power-outage',
    name: '家中停电',
    description: '停电时需要找到的物品和位置',
    icon: 'zap-off',
    itemTypes: ['home-safety', 'repair'],
    itemKeywords: ['手电', '电闸', '维修', '燃气', '阀门'],
  },
  {
    id: 'going-out',
    name: '出门办事',
    description: '出门时需要携带的证件和物品',
    icon: 'door-open',
    itemTypes: ['id', 'travel'],
    itemKeywords: ['钥匙', '身份证', '公交', '老年证', '钱包'],
  },
  {
    id: 'home-repair',
    name: '家中维修',
    description: '家中设备故障时需要的工具和联系人',
    icon: 'wrench',
    itemTypes: ['repair', 'home-safety'],
    itemKeywords: ['工具', '电闸', '水阀', '燃气', '维修'],
  },
]

export interface EmergencyItemActivity {
  id: string
  itemId: string
  itemName: string
  action: 'added' | 'location-changed' | 'feedback' | 'expired' | 'reviewed'
  detail: string
  timestamp: number
}

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
  sourceItemId: string | null
  sourceItemName: string
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
  totalEmergencyItems: number
  emergencyItemTypeCounts: Record<EmergencyItemType, number>
  expiringOrReviewCount: number
  feedbackDistribution: Record<FindFeedback, number>
  highUrgencyCoverage: number
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
  totalEmergencyItems: number
  emergencyItemTypeCounts: Record<EmergencyItemType, number>
  expiringOrReviewCount: number
  feedbackDistribution: Record<FindFeedback, number>
  highUrgencyCoverage: number
}

export const PACKAGE_DEFAULT_GUIDE_TEXTS = [
  '您好，这是您的紧急联系资料包，请慢慢查看。',
  '请记住这些重要的联系人和电话号码。',
  '遇到紧急情况时，请按照顺序联系。',
  '每天回顾一遍，加深记忆。',
]

export type LeavingChecklistScene = 'hospital-visit' | 'family-visit' | 'grocery' | 'community' | 'emergency-evac'

export const LEAVING_SCENES: { id: LeavingChecklistScene; name: string; icon: string; color: string; description: string }[] = [
  { id: 'hospital-visit', name: '去医院复诊', icon: 'heart-pulse', color: '#D94F4F', description: '前往医院看病、复诊或检查' },
  { id: 'family-visit', name: '短途探亲', icon: 'users', color: '#E8652B', description: '去亲戚家做客或探亲' },
  { id: 'grocery', name: '楼下买菜', icon: 'shopping-bag', color: '#7BAE7F', description: '日常买菜或采购生活用品' },
  { id: 'community', name: '社区活动', icon: 'building-2', color: '#5B9BD5', description: '参加社区组织的活动或事务' },
  { id: 'emergency-evac', name: '紧急避险', icon: 'alert-triangle', color: '#E8A838', description: '遇到紧急情况需要疏散避险' },
]

export const LEAVING_SCENE_LABELS: Record<LeavingChecklistScene, string> = {
  'hospital-visit': '去医院复诊',
  'family-visit': '短途探亲',
  'grocery': '楼下买菜',
  'community': '社区活动',
  'emergency-evac': '紧急避险',
}

export const LEAVING_SCENE_ICONS: Record<LeavingChecklistScene, string> = {
  'hospital-visit': 'heart-pulse',
  'family-visit': 'users',
  'grocery': 'shopping-bag',
  'community': 'building-2',
  'emergency-evac': 'alert-triangle',
}

export const LEAVING_SCENE_COLORS: Record<LeavingChecklistScene, string> = {
  'hospital-visit': '#D94F4F',
  'family-visit': '#E8652B',
  'grocery': '#7BAE7F',
  'community': '#5B9BD5',
  'emergency-evac': '#E8A838',
}

export type ChecklistItemCategory = 'contact-card' | 'id' | 'medicine' | 'key' | 'phone' | 'safety-check' | 'emergency-item'

export const CHECKLIST_ITEM_CATEGORY_LABELS: Record<ChecklistItemCategory, string> = {
  'contact-card': '联系人卡',
  'id': '证件',
  'medicine': '药品',
  'key': '钥匙',
  'phone': '手机',
  'safety-check': '电源/燃气检查',
  'emergency-item': '应急物品',
}

export const CHECKLIST_ITEM_CATEGORY_ICONS: Record<ChecklistItemCategory, string> = {
  'contact-card': 'id-card',
  'id': 'credit-card',
  'medicine': 'pill',
  'key': 'key',
  'phone': 'smartphone',
  'safety-check': 'shield-check',
  'emergency-item': 'package',
}

export const CHECKLIST_ITEM_CATEGORY_COLORS: Record<ChecklistItemCategory, string> = {
  'contact-card': '#5B9BD5',
  'id': '#9B6DB7',
  'medicine': '#D94F4F',
  'key': '#E8A838',
  'phone': '#7BAE7F',
  'safety-check': '#5C9460',
  'emergency-item': '#E8652B',
}

export interface ChecklistItem {
  id: string
  name: string
  category: ChecklistItemCategory
  order: number
  isKeyPoint: boolean
  reminder: string
  stepNote: string
  linkedEmergencyItemId: string | null
  linkedEmergencyItemName: string
  linkedContactId: string | null
  linkedContactName: string
}

export interface LeavingChecklist {
  id: string
  scene: LeavingChecklistScene
  name: string
  description: string
  items: ChecklistItem[]
  linkedContactIds: string[]
  linkedContactNames: string
  estimatedDuration: string
  reminderText: string
  keySteps: string
  createdAt: number
  updatedAt: number
  order: number
  isHighlighted: boolean
}

export type ChecklistStepStatus = 'pending' | 'done' | 'not-found' | 'skip' | 'need-help'

export const CHECKLIST_STEP_STATUS_LABELS: Record<ChecklistStepStatus, string> = {
  'pending': '待确认',
  'done': '已带上',
  'not-found': '找不到',
  'skip': '不需要',
  'need-help': '需要家人帮忙',
}

export const CHECKLIST_STEP_STATUS_COLORS: Record<ChecklistStepStatus, string> = {
  'pending': '#B8A08A',
  'done': '#5C9460',
  'not-found': '#D94F4F',
  'skip': '#8B7355',
  'need-help': '#5B9BD5',
}

export interface ExecutingStep {
  itemId: string
  itemName: string
  category: ChecklistItemCategory
  status: ChecklistStepStatus
  note: string
  linkedEmergencyItemId: string | null
  linkedEmergencyItemName: string
  linkedContactId: string | null
  linkedContactName: string
  isKeyPoint: boolean
  timestamp: number
}

export type LeavingSessionStatus = 'selecting' | 'executing' | 'checking' | 'return-confirm' | 'completed'

export interface LeavingSession {
  id: string
  checklistId: string
  checklistName: string
  scene: LeavingChecklistScene
  status: LeavingSessionStatus
  steps: ExecutingStep[]
  currentStepIndex: number
  startedAt: number
  estimatedEndAt: number | null
  finishedAt: number | null
  returnConfirmedAt: number | null
}

export type ReturnConfirmType = 'safe-home' | 'forgot-items' | 'need-notes'

export const RETURN_CONFIRM_LABELS: Record<ReturnConfirmType, string> = {
  'safe-home': '已安全到家',
  'forgot-items': '忘带物品',
  'need-notes': '需要补充说明',
}

export const RETURN_CONFIRM_COLORS: Record<ReturnConfirmType, string> = {
  'safe-home': '#5C9460',
  'forgot-items': '#D94F4F',
  'need-notes': '#E8A838',
}

export interface ReturnConfirmRecord {
  id: string
  sessionId: string
  checklistId: string
  checklistName: string
  scene: LeavingChecklistScene
  confirmType: ReturnConfirmType
  forgotItems: string[]
  notes: string
  createdAt: number
}

export type ChecklistActivityAction =
  | 'checklist-created'
  | 'checklist-updated'
  | 'checklist-deleted'
  | 'session-started'
  | 'session-abnormal'
  | 'session-completed'
  | 'return-confirmed'

export interface ChecklistActivity {
  id: string
  action: ChecklistActivityAction
  checklistId: string
  checklistName: string
  sessionId: string | null
  detail: string
  timestamp: number
}

export interface ChecklistFollowUpSource {
  checklistId: string
  checklistName: string
  sessionId: string
  itemId: string
  itemName: string
  stepIndex: number
  linkedEmergencyItemId: string | null
  linkedEmergencyItemName: string
  linkedContactId: string | null
  linkedContactName: string
}

declare module '@/types' {
  interface FollowUpItem {
    checklistSource?: ChecklistFollowUpSource | null
    nightCareSource?: NightFollowUpSource | null
  }
}

export interface ChecklistStatsData {
  totalChecklists: number
  sceneExecutionCounts: Record<LeavingChecklistScene, number>
  abnormalStepDistribution: Record<ChecklistStepStatus, number>
  returnConfirmRatio: Record<ReturnConfirmType, number>
  totalReturnConfirms: number
  highRiskStepCompletionRate: number
  totalSessions: number
  completedSessions: number
}

export interface NightCheckItem {
  id: string
  name: string
  description: string
  order: number
  isKeyPoint: boolean
  reminder: string
  stepNote: string
  linkedEmergencyItemId: string | null
  linkedEmergencyItemName: string
  linkedContactId: string | null
  linkedContactName: string
}

export interface NightCarePlan {
  id: string
  name: string
  icon: string
  startTime: string
  endTime: string
  checkItems: NightCheckItem[]
  linkedContactIds: string[]
  linkedContactNames: string
  linkedEmergencyItemIds: string[]
  linkedEmergencyItemNames: string
  keyRisks: string
  reminderText: string
  needsRepeatReminder: boolean
  abnormalHandlingAdvice: string
  order: number
  isHighlighted: boolean
  createdAt: number
  updatedAt: number
}

export const NIGHT_CARE_DEFAULT_PLANS = [
  { id: 'bedtime-check', name: '睡前检查', icon: 'moon', startTime: '21:00', endTime: '22:00', description: '睡前巡查确认安全' },
  { id: 'midnight-check', name: '半夜起身', icon: 'lamp', startTime: '02:00', endTime: '03:00', description: '起夜时的安全确认' },
  { id: 'medicine-reminder', name: '服药提醒', icon: 'pill', startTime: '21:30', endTime: '22:00', description: '夜间服药时间提醒' },
  { id: 'safety-confirm', name: '门窗燃气确认', icon: 'shield-check', startTime: '22:00', endTime: '22:30', description: '确认门窗燃气关闭' },
  { id: 'morning-visit', name: '清晨回访', icon: 'sunrise', startTime: '06:00', endTime: '07:00', description: '清晨确认老人状况' },
]

export const NIGHT_CARE_PLAN_COLORS: Record<string, string> = {
  'bedtime-check': '#7B68EE',
  'midnight-check': '#E8A838',
  'medicine-reminder': '#D94F4F',
  'safety-confirm': '#5C9460',
  'morning-visit': '#E8652B',
}

export type NightCareFeedback = 'confirmed' | 'remind-later' | 'not-clear' | 'need-family'

export const NIGHT_CARE_FEEDBACK_LABELS: Record<NightCareFeedback, string> = {
  'confirmed': '已确认',
  'remind-later': '稍后提醒',
  'not-clear': '没看清',
  'need-family': '需要家人处理',
}

export const NIGHT_CARE_FEEDBACK_COLORS: Record<NightCareFeedback, string> = {
  'confirmed': '#5C9460',
  'remind-later': '#E8A838',
  'not-clear': '#B8A08A',
  'need-family': '#5B9BD5',
}

export interface NightExecutingStep {
  itemId: string
  itemName: string
  status: NightCareFeedback
  note: string
  linkedEmergencyItemId: string | null
  linkedEmergencyItemName: string
  linkedContactId: string | null
  linkedContactName: string
  isKeyPoint: boolean
  timestamp: number
}

export type NightCareSessionStatus = 'selecting' | 'executing' | 'checking' | 'completed'

export interface NightCareSession {
  id: string
  planId: string
  planName: string
  status: NightCareSessionStatus
  steps: NightExecutingStep[]
  currentStepIndex: number
  startedAt: number
  finishedAt: number | null
}

export interface NightCareHistory {
  id: string
  planId: string
  planName: string
  steps: NightExecutingStep[]
  startedAt: number
  finishedAt: number
  summary: string
  abnormalCount: number
}

export type NightCareActivityAction =
  | 'plan-created'
  | 'plan-updated'
  | 'plan-deleted'
  | 'session-started'
  | 'session-abnormal'
  | 'session-completed'

export interface NightCareActivity {
  id: string
  action: NightCareActivityAction
  planId: string
  planName: string
  sessionId: string | null
  detail: string
  timestamp: number
}

export interface NightFollowUpSource {
  planId: string
  planName: string
  sessionId: string
  itemId: string
  itemName: string
  stepIndex: number
  linkedEmergencyItemId: string | null
  linkedEmergencyItemName: string
  linkedContactId: string | null
  linkedContactName: string
}

export interface NightCareStatsData {
  totalPlans: number
  highlightedPlans: number
  totalSessions: number
  completedSessions: number
  abnormalStepDistribution: Record<NightCareFeedback, number>
  keyPointCompletionRate: number
  planExecutionCounts: Record<string, number>
  totalAbnormal: number
  familyHandlingCount: number
}
