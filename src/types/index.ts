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

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}
