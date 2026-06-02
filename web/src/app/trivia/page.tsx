import courses from '@/data/courses.json'
import TriviaGame from '@/components/TriviaGame'
import { getDailySeed, makeSeededRandom } from '@/lib/seed'
import { generateTriviaQuestion } from '@/lib/questions'
import type { Course } from '@/lib/types'

export default function TriviaPage() {
  const dailyRand = makeSeededRandom(getDailySeed() + 2)
  const dailyQuestion = generateTriviaQuestion(courses as Course[], dailyRand)

  return <TriviaGame dailyQuestion={dailyQuestion} />
}
