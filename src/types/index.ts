import { EventStatus, SignupStatus, UserRole } from '@prisma/client'

export type { EventStatus, SignupStatus, UserRole }

export interface EventWithParties {
  id: string
  title: string
  description: string | null
  startTime: string
  timezone: string
  locationNote: string | null
  status: EventStatus
  createdById: string
  createdAt: string
  updatedAt: string
  createdBy: { discordName: string; avatarUrl: string | null }
  parties: PartyWithSlots[]
}

export interface PartyWithSlots {
  id: string
  eventId: string
  name: string
  displayOrder: number
  roleSlots: RoleSlotWithAssignments[]
}

export interface RoleSlotWithAssignments {
  id: string
  partyId: string
  roleName: string
  capacity: number
  tags: string[]
  minIp: number | null
  displayOrder: number
  assignments: AssignmentWithUser[]
}

export interface AssignmentWithUser {
  id: string
  eventId: string
  userId: string
  roleSlotId: string
  signupId: string
  assignedById: string
  assignedAt: string
  user: {
    id: string
    discordName: string
    avatarUrl: string | null
  }
}

export interface SignupWithUser {
  id: string
  eventId: string
  userId: string
  preferredRoles: string[]
  note: string | null
  status: SignupStatus
  createdAt: string
  updatedAt: string
  user: {
    id: string
    discordName: string
    avatarUrl: string | null
  }
  assignment: AssignmentWithUser | null
}

export interface ApiError {
  error: string
  details?: string
}
