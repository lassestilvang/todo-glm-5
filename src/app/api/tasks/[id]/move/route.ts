/**
 * Task Move API Route
 * 
 * POST /api/tasks/[id]/move - Move task to a different list
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksService } from '@/lib/services';
import { moveTaskSchema } from '@/lib/validations';
import { AppError, ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = moveTaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const task = await tasksService.moveToList(id, validationResult.data.listId);
    
    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error moving task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to move task' },
      { status: 500 }
    );
  }
}
