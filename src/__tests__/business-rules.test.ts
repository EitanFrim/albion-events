import { describe, it, expect } from '@jest/globals'

// ---- Business rule: max 3 preferred roles per signup ----
function validatePreferredRoles(roles: string[]): { valid: boolean; error?: string } {
  if (roles.length === 0) return { valid: false, error: 'At least one role required' }
  if (roles.length > 3) return { valid: false, error: 'Maximum 3 preferred roles allowed' }
  const unique = new Set(roles)
  if (unique.size !== roles.length) return { valid: false, error: 'Duplicate roles not allowed' }
  return { valid: true }
}

// ---- Business rule: slot capacity enforcement ----
function canAssignToSlot(slot: { capacity: number; assignments: unknown[] }): boolean {
  return slot.assignments.length < slot.capacity
}

// ---- Business rule: one assignment per user per event ----
function hasExistingAssignment(
  assignments: Array<{ eventId: string; userId: string }>,
  eventId: string,
  userId: string
): boolean {
  return assignments.some(a => a.eventId === eventId && a.userId === userId)
}

// ---- Business rule: event status governs editability ----
type EventStatus = 'DRAFT' | 'PUBLISHED' | 'LOCKED' | 'COMPLETED'

function canPlayerEditSignup(status: EventStatus): boolean {
  return status === 'PUBLISHED'
}

function canAdminAssign(status: EventStatus): boolean {
  return status !== 'COMPLETED'
}

// ---- Permission checks ----
type UserRole = 'ADMIN' | 'PLAYER'

function canCreateEvent(role: UserRole): boolean {
  return role === 'ADMIN'
}

function canViewDraftEvent(role: UserRole): boolean {
  return role === 'ADMIN'
}

function canEditOthersSignup(requesterId: string, ownerId: string, role: UserRole): boolean {
  return role === 'ADMIN' || requesterId === ownerId
}

// ====================
// Tests
// ====================

describe('Max 3 preferred roles rule', () => {
  it('rejects empty role list', () => {
    expect(validatePreferredRoles([])).toMatchObject({ valid: false })
  })

  it('accepts 1 role', () => {
    expect(validatePreferredRoles(['Tank'])).toMatchObject({ valid: true })
  })

  it('accepts exactly 3 roles', () => {
    expect(validatePreferredRoles(['Tank', 'Healer', 'DPS Melee'])).toMatchObject({ valid: true })
  })

  it('rejects 4 roles', () => {
    expect(validatePreferredRoles(['Tank', 'Healer', 'DPS Melee', 'Scout'])).toMatchObject({ valid: false })
  })

  it('rejects duplicate roles', () => {
    expect(validatePreferredRoles(['Tank', 'Tank', 'Healer'])).toMatchObject({ valid: false })
  })
})

describe('Slot capacity enforcement', () => {
  it('allows assignment when slot has space', () => {
    const slot = { capacity: 2, assignments: [{}] }
    expect(canAssignToSlot(slot)).toBe(true)
  })

  it('blocks assignment when slot is at capacity', () => {
    const slot = { capacity: 2, assignments: [{}, {}] }
    expect(canAssignToSlot(slot)).toBe(false)
  })

  it('allows assignment to fresh slot', () => {
    const slot = { capacity: 1, assignments: [] }
    expect(canAssignToSlot(slot)).toBe(true)
  })

  it('blocks assignment to capacity-1 slot that is full', () => {
    const slot = { capacity: 1, assignments: [{}] }
    expect(canAssignToSlot(slot)).toBe(false)
  })
})

describe('One assignment per user per event', () => {
  const assignments = [
    { eventId: 'event1', userId: 'user1' },
    { eventId: 'event2', userId: 'user1' },
  ]

  it('detects existing assignment', () => {
    expect(hasExistingAssignment(assignments, 'event1', 'user1')).toBe(true)
  })

  it('allows assignment in different event', () => {
    expect(hasExistingAssignment(assignments, 'event3', 'user1')).toBe(false)
  })

  it('allows different user in same event', () => {
    expect(hasExistingAssignment(assignments, 'event1', 'user2')).toBe(false)
  })
})

describe('Event status governs editability', () => {
  it('allows player edit when PUBLISHED', () => {
    expect(canPlayerEditSignup('PUBLISHED')).toBe(true)
  })

  it('blocks player edit when DRAFT', () => {
    expect(canPlayerEditSignup('DRAFT')).toBe(false)
  })

  it('blocks player edit when LOCKED', () => {
    expect(canPlayerEditSignup('LOCKED')).toBe(false)
  })

  it('blocks player edit when COMPLETED', () => {
    expect(canPlayerEditSignup('COMPLETED')).toBe(false)
  })

  it('admin can assign in LOCKED status', () => {
    expect(canAdminAssign('LOCKED')).toBe(true)
  })

  it('admin cannot assign in COMPLETED status', () => {
    expect(canAdminAssign('COMPLETED')).toBe(false)
  })
})

describe('Permission checks', () => {
  it('only admins can create events', () => {
    expect(canCreateEvent('ADMIN')).toBe(true)
    expect(canCreateEvent('PLAYER')).toBe(false)
  })

  it('only admins can view DRAFT events', () => {
    expect(canViewDraftEvent('ADMIN')).toBe(true)
    expect(canViewDraftEvent('PLAYER')).toBe(false)
  })

  it('players can only edit their own signup', () => {
    expect(canEditOthersSignup('userA', 'userA', 'PLAYER')).toBe(true)
    expect(canEditOthersSignup('userA', 'userB', 'PLAYER')).toBe(false)
  })

  it('admins can edit any signup', () => {
    expect(canEditOthersSignup('admin', 'anyUser', 'ADMIN')).toBe(true)
  })
})
