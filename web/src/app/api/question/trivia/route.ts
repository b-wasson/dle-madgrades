export const runtime = 'edge'

import { NextResponse } from 'next/server'
import courses from '@/data/courses.json'
import { generateTriviaQuestion } from '@/lib/questions'
import type { Course } from '@/lib/types'

export async function GET() {
  const question = generateTriviaQuestion(courses as Course[], Math.random)
  return NextResponse.json(question)
}
