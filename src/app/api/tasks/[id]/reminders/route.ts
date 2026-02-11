/**
 * Task Reminders API Routes
 * 
 * GET /api/tasks/[id]/reminders - Get reminders for a task
 * POST /api/tasks/[id]/reminders - Create a reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { remindersService, tasksService } from '@/lib/services';
import { createReminderSchema } from '@/lib/validations';
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
    
    const reminders = await remindersService.getByTaskId(id);
    
    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch reminders' },
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
    const validationResult = createReminderSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const reminder = await remindersService.create(id, { task_id: id, ...validationResult.data });
    
    return NextResponse.json({
      success: true,
      data: reminder,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
