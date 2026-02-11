/**
 * Week View API Route
 * 
 * GET /api/views/week - Get tasks for next 7 days
 */

import { NextResponse } from 'next/server';
import { tasksService } from '@/lib/services';
import { AppError } from '@/lib/errors';

export async function GET() {
  try {
    const tasks = await tasksService.getWeek();
    
    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching week tasks:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch week tasks' },
      { status: 500 }
    );
  }
}
