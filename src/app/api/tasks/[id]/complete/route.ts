/**
 * Task Complete API Routes
 * 
 * POST /api/tasks/[id]/complete - Mark task as complete
 * DELETE /api/tasks/[id]/complete - Mark task as incomplete
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksService } from '@/lib/services';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const task = await tasksService.complete(id);
    
    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to complete task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const task = await tasksService.uncomplete(id);
    
    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error uncompleting task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to mark task as incomplete' },
      { status: 500 }
    );
  }
}
