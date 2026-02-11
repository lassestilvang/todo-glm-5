/**
 * Task Subtasks API Routes
 * 
 * GET /api/tasks/[id]/subtasks - Get subtasks for a task
 * POST /api/tasks/[id]/subtasks - Create a subtask
 */

import { NextRequest, NextResponse } from 'next/server';
import { subtasksService, tasksService } from '@/lib/services';
import { createSubtaskSchema } from '@/lib/validations';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';

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
      throw new NotFoundError('Task', id);
    }
    
    const subtasks = await subtasksService.getByTaskId(id);
    
    return NextResponse.json({
      success: true,
      data: subtasks,
    });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch subtasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = createSubtaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const subtask = await subtasksService.create(id, { task_id: id, ...validationResult.data });
    
    return NextResponse.json({
      success: true,
      data: subtask,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to create subtask' },
      { status: 500 }
    );
  }
}
