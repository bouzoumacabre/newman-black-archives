export type UserRole = 'player' | 'manager' | 'admin'
export type AccountStatus = 'pending' | 'approved' | 'rejected'
export type MissionStatus = 'active' | 'awaiting_validation' | 'validated'

export interface Profile {
  user_id: string
  username: string
  role: UserRole
  status: AccountStatus
  created_at: string
}

export interface Mission {
  id: string
  user_id: string
  title: string
  brief: string | null
  image_path: string | null
  status: MissionStatus
  created_at: string
  completed_at: string | null
  validated_at: string | null
}

export interface ChatMessage {
  id: string
  user_id: string
  body: string
  created_at: string
  profiles?: { username: string } | null
}

export interface ActivityEvent {
  id: string
  user_id: string
  event_type: string
  label: string
  created_at: string
}
