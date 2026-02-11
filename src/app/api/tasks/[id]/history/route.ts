/**
 * Task History API Route
 * 
 * GET /api/tasks/[id]/history - Get task change history
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksService } from '@/lib/services';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Verify task exists
    const task = await tasksService.getById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: `Task with id "${id}" not found` },
        { status: 404 }
      );
    }
    
    const history = await tasksService.getHistory(id);
    
    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching task history:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch task history' },
      { status: 500 }
    );
  }
}
