import type { Course, HLPair, HLMetric, TriviaQuestion } from './types'

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const pool = [...arr]
  const result: T[] = []
  while (result.length < n && pool.length > 0) {
    const i = Math.floor(rand() * pool.length)
    result.push(pool.splice(i, 1)[0])
  }
  return result
}

export function generateHLPair(courses: Course[], rand: () => number): HLPair {
  const metric: HLMetric = rand() < 0.5 ? 'gpa' : 'failRate'

  // Keep trying until we find a pair with a meaningful difference
  for (let attempt = 0; attempt < 50; attempt++) {
    const [a, b] = pickN(courses, 2, rand)
    if (!a || !b) continue

    const valA = metric === 'gpa' ? a.avgGpa : a.failRate
    const valB = metric === 'gpa' ? b.avgGpa : b.failRate
    const diff = Math.abs(valA - valB)
    const minDiff = metric === 'gpa' ? 0.2 : 0.02

    if (diff >= minDiff) {
      const answer: 'a' | 'b' = valA >= valB ? 'a' : 'b'
      return { courseA: a, courseB: b, metric, answer }
    }
  }

  // Fallback: just pick any two different courses
  const [a, b] = pickN(courses, 2, rand)
  const valA = metric === 'gpa' ? a.avgGpa : a.failRate
  const valB = metric === 'gpa' ? b.avgGpa : b.failRate
  return { courseA: a, courseB: b, metric, answer: valA >= valB ? 'a' : 'b' }
}

export function generateTriviaQuestion(courses: Course[], rand: () => number): TriviaQuestion {
  const useSubjectMode = rand() < 0.5

  if (useSubjectMode) {
    return generateSubjectQuestion(courses, rand)
  }
  return generateSuperlativeQuestion(courses, rand)
}

function generateSubjectQuestion(courses: Course[], rand: () => number): TriviaQuestion {
  // Group by subject
  const bySubject = new Map<string, Course[]>()
  for (const c of courses) {
    const key = c.subjectAbbrev
    if (!bySubject.has(key)) bySubject.set(key, [])
    bySubject.get(key)!.push(c)
  }

  // Find subjects with enough courses (at least 4)
  const validSubjects = [...bySubject.entries()].filter(([, cs]) => cs.length >= 4)
  if (validSubjects.length === 0) return generateSuperlativeQuestion(courses, rand)

  const [subjectAbbrev, subjectCourses] = pick(validSubjects, rand)
  const isLowest = rand() < 0.5
  const metric: HLMetric = rand() < 0.6 ? 'gpa' : 'failRate'

  const options = pickN(subjectCourses, 4, rand)
  const sorted = [...options].sort((a, b) =>
    metric === 'gpa' ? a.avgGpa - b.avgGpa : a.failRate - b.failRate
  )

  const correctCourse = isLowest ? sorted[0] : sorted[sorted.length - 1]
  const correctIndex = options.indexOf(correctCourse)

  const superlative = isLowest ? 'lowest' : 'highest'
  const metricLabel = metric === 'gpa' ? 'average GPA' : 'fail rate'

  return {
    text: `Which ${subjectAbbrev} course had the ${superlative} ${metricLabel}?`,
    options,
    correctIndex,
    metric,
    metricLabel,
  }
}

function generateSuperlativeQuestion(courses: Course[], rand: () => number): TriviaQuestion {
  const isLowest = rand() < 0.5
  const metric: HLMetric = rand() < 0.6 ? 'gpa' : 'failRate'

  // Pick 4 courses from different subjects for variety
  const bySubject = new Map<string, Course[]>()
  for (const c of courses) {
    if (!bySubject.has(c.subjectAbbrev)) bySubject.set(c.subjectAbbrev, [])
    bySubject.get(c.subjectAbbrev)!.push(c)
  }

  const subjects = [...bySubject.keys()]
  const options: Course[] = []

  for (let attempt = 0; attempt < 20 && options.length < 4; attempt++) {
    const subj = pick(subjects, rand)
    const pool = bySubject.get(subj)!
    const candidate = pick(pool, rand)
    if (!options.find(c => c.uuid === candidate.uuid)) {
      options.push(candidate)
    }
  }

  if (options.length < 4) {
    const extras = pickN(
      courses.filter(c => !options.find(o => o.uuid === c.uuid)),
      4 - options.length,
      rand
    )
    options.push(...extras)
  }

  const sorted = [...options].sort((a, b) =>
    metric === 'gpa' ? a.avgGpa - b.avgGpa : a.failRate - b.failRate
  )

  const correctCourse = isLowest ? sorted[0] : sorted[sorted.length - 1]
  const correctIndex = options.indexOf(correctCourse)

  const superlative = isLowest ? 'lowest' : 'highest'
  const metricLabel = metric === 'gpa' ? 'average GPA' : 'fail rate'

  return {
    text: `Which of these courses had the ${superlative} ${metricLabel}?`,
    options,
    correctIndex,
    metric,
    metricLabel,
  }
}
