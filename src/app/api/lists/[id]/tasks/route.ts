/**
 * List Tasks API Routes
 * 
 * GET /api/lists/[id]/tasks - Get all tasks in a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksService, listsService } from '@/lib/services';
import { AppError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Verify list exists
    const list = await listsService.getById(id);
    if (!list) {
      throw new NotFoundError('List', id);
    }
    
    const tasks = await tasksService.getByListId(id);
    
    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching list tasks:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch list tasks' },
      { status: 500 }
    );
  }
}
