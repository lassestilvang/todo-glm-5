/**
 * Single Task API Routes
 * 
 * GET /api/tasks/[id] - Get a single task with all relations
 * PUT /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksService, subtasksService, labelsService, remindersService, attachmentsService, listsService } from '@/lib/services';
import { updateTaskSchema } from '@/lib/validations';
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
    
    const task = await tasksService.getById(id);
    
    if (!task) {
      throw new NotFoundError('Task', id);
    }
    
    // Fetch related data
    const [list, subtasks, labels, reminders, attachments] = await Promise.all([
      listsService.getById(task.list_id),
      subtasksService.getByTaskId(id),
      labelsService.getTaskLabels(id),
      remindersService.getByTaskId(id),
      attachmentsService.getByTaskId(id),
    ]);
    
    const data = {
      ...task,
      list,
      subtasks,
      labels,
      reminders,
      attachments,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = updateTaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }
    
    const task = await tasksService.update(id, validationResult.data);
    
    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update task' },
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
    
    await tasksService.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
