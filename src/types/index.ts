export type UserRole = 'player' | 'admin'
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested'

export interface Profile {
  user_id: string
  username: string
  role: UserRole
  created_at: string
}

export interface PlayerProgress {
  user_id: string
  phase_no: number
  unlocked_at: string
  completed_at: string | null
}

export interface Submission {
  id: string
  user_id: string
  phase_no: number
  answer: string
  status: SubmissionStatus
  admin_message: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface Transmission {
  id: string
  user_id: string
  phase_no: number
  coordinates: string
  message: string | null
  created_at: string
  created_by: string
}


export interface OperatorMessage {
  id: string
  user_id: string
  phase_no: number | null
  body: string
  created_at: string
  created_by: string
}

export interface ActivityEvent {
  id: string
  user_id: string
  event_type: string
  label: string
  created_at: string
}

export interface PhaseDefinition {
  no: number
  roman: string
  code: string
  name: string
  documents: string
  subtitle: string
  sector: string
  flavor: 'bank' | 'intel' | 'oac' | 'collapse'
}

export interface AdminSubmissionRow extends Submission {
  profiles?: { username: string } | null
}
