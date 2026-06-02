export const runtime = 'edge'

import { NextResponse } from 'next/server'
import courses from '@/data/courses.json'
import { generateHLPair } from '@/lib/questions'
import type { Course } from '@/lib/types'

export async function GET() {
  const pair = generateHLPair(courses as Course[], Math.random)
  return NextResponse.json(pair)
}
