import courses from '@/data/courses.json'
import HigherLowerGame from '@/components/HigherLowerGame'
import { getDailySeed, makeSeededRandom } from '@/lib/seed'
import { generateHLPair } from '@/lib/questions'
import type { Course } from '@/lib/types'

export default function HomePage() {
  const dailyRand = makeSeededRandom(getDailySeed() + 1)
  const dailyPair = generateHLPair(courses as Course[], dailyRand)

  return <HigherLowerGame dailyPair={dailyPair} />
}
