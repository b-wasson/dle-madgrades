export interface Course {
  uuid: string
  name: string
  number: number
  subjectCode: string
  subjectName: string
  subjectAbbrev: string
  avgGpa: number
  failRate: number
  totalStudents: number
}

export type HLMetric = 'gpa' | 'failRate'

export interface HLPair {
  courseA: Course
  courseB: Course
  metric: HLMetric
  answer: 'a' | 'b'
}

export interface TriviaQuestion {
  text: string
  options: Course[]
  correctIndex: number
  metric: HLMetric
  metricLabel: string
}

export interface DailyRecord {
  date: string
  answered: boolean
  correct: boolean
}

export interface GameStats {
  streak: number
  bestStreak: number
}

export interface DailyStats {
  total: number
  correct: number
}
