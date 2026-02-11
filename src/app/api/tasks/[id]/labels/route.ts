/**
 * Task Labels API Routes
 * 
 * GET /api/tasks/[id]/labels - Get labels for a task
 * POST /api/tasks/[id]/labels - Add a label to a task
 * DELETE /api/tasks/[id]/labels - Remove a label from a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { labelsService, tasksService } from '@/lib/services';
import { taskLabelSchema } from '@/lib/validations';
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
    
    const labels = await labelsService.getTaskLabels(id);
    
    return NextResponse.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    console.error('Error fetching task labels:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch task labels' },
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
    const validationResult = taskLabelSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    await labelsService.addToTask(id, validationResult.data.labelId);
    
    // Return updated labels
    const labels = await labelsService.getTaskLabels(id);
    
    return NextResponse.json({
      success: true,
      data: labels,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding label to task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to add label to task' },
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
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get('labelId');
    
    if (!labelId) {
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: 'Label ID is required' },
        { status: 400 }
      );
    }
    
    await labelsService.removeFromTask(id, labelId);
    
    // Return updated labels
    const labels = await labelsService.getTaskLabels(id);
    
    return NextResponse.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    console.error('Error removing label from task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to remove label from task' },
      { status: 500 }
    );
  }
}
