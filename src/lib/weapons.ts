// Albion Online weapon/build names organized by role category
// Colors match the Excel color scheme

export interface WeaponDef {
  name: string
  category: RoleCategory
}

export type RoleCategory =
  | 'tank'
  | 'healer'
  | 'support'
  | 'melee-dps'
  | 'ranged-dps'
  | 'mount'
  | 'flex'

export const CATEGORY_COLORS: Record<RoleCategory, { bg: string; text: string; border: string; dot: string }> = {
  'tank':       { bg: 'bg-blue-900/40',    text: 'text-blue-300',    border: 'border-blue-700/50',    dot: 'bg-blue-400' },
  'healer':     { bg: 'bg-green-900/40',   text: 'text-green-300',   border: 'border-green-700/50',   dot: 'bg-green-400' },
  'support':    { bg: 'bg-purple-900/40',  text: 'text-purple-300',  border: 'border-purple-700/50',  dot: 'bg-purple-400' },
  'melee-dps':  { bg: 'bg-red-900/40',     text: 'text-red-300',     border: 'border-red-700/50',     dot: 'bg-red-400' },
  'ranged-dps': { bg: 'bg-amber-900/40',   text: 'text-amber-300',   border: 'border-amber-700/50',   dot: 'bg-amber-400' },
  'mount':      { bg: 'bg-gray-800/60',    text: 'text-gray-300',    border: 'border-gray-600/50',    dot: 'bg-gray-400' },
  'flex':       { bg: 'bg-teal-900/40',    text: 'text-teal-300',    border: 'border-teal-700/50',    dot: 'bg-teal-400' },
}

export const CATEGORY_LABELS: Record<RoleCategory, string> = {
  'tank': 'Tank',
  'healer': 'Healer',
  'support': 'Support',
  'melee-dps': 'Melee DPS',
  'ranged-dps': 'Ranged DPS',
  'mount': 'Mount / Battlemount',
  'flex': 'Flex / Looter',
}

export const ALBION_WEAPONS: WeaponDef[] = [
  // Tanks
  { name: 'Clumper', category: 'tank' },
  { name: 'Bedrock', category: 'tank' },
  { name: 'Bastion', category: 'tank' },
  { name: 'Locus', category: 'tank' },
  { name: 'Ironclad', category: 'tank' },

  // Healers
  { name: 'Hallowfall', category: 'healer' },
  { name: 'Exalted (back)', category: 'healer' },
  { name: 'Exalted (front)', category: 'healer' },
  { name: 'FILL (Heal)', category: 'healer' },
  { name: 'Lifetouch', category: 'healer' },

  // Support
  { name: '1H Arcane', category: 'support' },
  { name: 'Occult', category: 'support' },
  { name: 'Hoarfrost', category: 'support' },
  { name: 'Permafrost', category: 'support' },
  { name: 'Frostbite', category: 'support' },
  { name: 'BMS', category: 'support' },
  { name: 'Oath', category: 'support' },
  { name: 'Holy', category: 'support' },
  { name: 'Lifecurse', category: 'support' },
  { name: 'Root', category: 'support' },
  { name: 'Witchwork', category: 'support' },

  // Melee DPS
  { name: 'Pole Hammer', category: 'melee-dps' },
  { name: '1H Hammer', category: 'melee-dps' },
  { name: 'GA', category: 'melee-dps' },
  { name: 'Rift Glaive', category: 'melee-dps' },
  { name: 'Carving', category: 'melee-dps' },
  { name: 'Damnation', category: 'melee-dps' },
  { name: 'Spiked', category: 'melee-dps' },
  { name: 'Wailing', category: 'melee-dps' },
  { name: 'Dawnsong', category: 'melee-dps' },
  { name: 'Perma', category: 'melee-dps' },
  { name: 'Incubus', category: 'melee-dps' },
  { name: 'Spirit', category: 'melee-dps' },
  { name: 'Realm', category: 'melee-dps' },
  { name: 'RotCaller', category: 'melee-dps' },
  { name: 'Forgebark', category: 'melee-dps' },
  { name: 'Rampt/Blight', category: 'melee-dps' },
  { name: 'BrimStone', category: 'melee-dps' },
  { name: 'Cobra', category: 'melee-dps' },

  // Ranged DPS
  { name: 'Balista', category: 'ranged-dps' },
  { name: 'Venom Basi', category: 'ranged-dps' },
  { name: 'Chariot', category: 'ranged-dps' },

  // Mounts / Battlemounts
  { name: 'Beetle', category: 'mount' },
  { name: 'Behemoth', category: 'mount' },
  { name: 'Eagle', category: 'mount' },
  { name: 'Invis Bridled', category: 'mount' },
  { name: 'Charger', category: 'mount' },

  // Flex / Looter
  { name: 'Looter', category: 'flex' },
  { name: 'Flex', category: 'flex' },
  { name: 'Fill Stuff', category: 'flex' },
]

// Get the category for a given weapon name
export function getWeaponCategory(name: string): RoleCategory | null {
  const found = ALBION_WEAPONS.find(w => w.name.toLowerCase() === name.toLowerCase())
  return found?.category ?? null
}

export function getCategoryColors(roleName: string) {
  const cat = getWeaponCategory(roleName)
  return cat ? CATEGORY_COLORS[cat] : CATEGORY_COLORS['flex']
}

// ZvZ preset comp templates
export interface CompTemplate {
  name: string
  parties: {
    name: string
    slots: { roleName: string; capacity: number }[]
  }[]
}

export const COMP_TEMPLATES: CompTemplate[] = [
  {
    name: 'Standard ZvZ (20v20)',
    parties: [
      {
        name: 'Party 1',
        slots: [
          { roleName: 'Clumper', capacity: 1 },
          { roleName: 'Pole Hammer', capacity: 1 },
          { roleName: '1H Arcane', capacity: 1 },
          { roleName: 'GA', capacity: 1 },
          { roleName: 'GA', capacity: 1 },
          { roleName: 'Bedrock', capacity: 1 },
          { roleName: 'Bedrock', capacity: 1 },
          { roleName: 'Occult', capacity: 1 },
          { roleName: 'Spirit', capacity: 1 },
          { roleName: 'Realm', capacity: 1 },
          { roleName: 'Incubus', capacity: 1 },
          { roleName: 'RotCaller', capacity: 1 },
          { roleName: 'Damnation', capacity: 1 },
          { roleName: 'Spiked', capacity: 1 },
          { roleName: 'Dawnsong', capacity: 1 },
          { roleName: 'Perma', capacity: 1 },
          { roleName: 'Hallowfall', capacity: 1 },
          { roleName: 'Hallowfall', capacity: 1 },
          { roleName: 'Beetle', capacity: 1 },
          { roleName: 'Behemoth', capacity: 1 },
        ],
      },
    ],
  },
  {
    name: 'Crystal League (5v5)',
    parties: [
      {
        name: 'Team',
        slots: [
          { roleName: 'Clumper', capacity: 1 },
          { roleName: '1H Arcane', capacity: 1 },
          { roleName: 'GA', capacity: 1 },
          { roleName: 'Hallowfall', capacity: 1 },
          { roleName: 'Occult', capacity: 1 },
        ],
      },
    ],
  },
  {
    name: 'Hellgate (2v2)',
    parties: [
      {
        name: 'Pair 1',
        slots: [
          { roleName: 'GA', capacity: 1 },
          { roleName: 'Hallowfall', capacity: 1 },
        ],
      },
    ],
  },
  {
    name: 'Roads / Small Scale',
    parties: [
      {
        name: 'Group',
        slots: [
          { roleName: 'Clumper', capacity: 1 },
          { roleName: '1H Arcane', capacity: 1 },
          { roleName: 'GA', capacity: 2 },
          { roleName: 'Hallowfall', capacity: 1 },
          { roleName: 'Occult', capacity: 1 },
        ],
      },
    ],
  },
]
