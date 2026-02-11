/**
 * Tasks API Routes
 * 
 * GET /api/tasks - Get all tasks with filtering
 * POST /api/tasks - Create a new task
 */

import { NextRequest, NextResponse } from 'next/server';
import { tasksService } from '@/lib/services';
import { createTaskSchema, taskQuerySchema } from '@/lib/validations';
import { AppError, ValidationError } from '@/lib/errors';
import { format, startOfDay, endOfDay, addDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query params object
    const queryParams = {
      listId: searchParams.get('listId') ?? undefined,
      completed: searchParams.get('completed') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      today: searchParams.get('today') ?? undefined,
      week: searchParams.get('week') ?? undefined,
      upcoming: searchParams.get('upcoming') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };
    
    // Validate query params
    const validationResult = taskQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }
    
    const query = validationResult.data;
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Handle special view filters
    if (query.overdue) {
      const tasks = await tasksService.getOverdue();
      return NextResponse.json({
        success: true,
        data: tasks,
      });
    }
    
    if (query.today) {
      const tasks = await tasksService.getToday();
      return NextResponse.json({
        success: true,
        data: tasks,
      });
    }
    
    if (query.week) {
      const tasks = await tasksService.getWeek();
      return NextResponse.json({
        success: true,
        data: tasks,
      });
    }
    
    if (query.upcoming) {
      const tasks = await tasksService.getUpcoming();
      return NextResponse.json({
        success: true,
        data: tasks,
      });
    }
    
    // Standard filtering
    const filterOptions: {
      listId?: string;
      isCompleted?: boolean;
      priority?: number;
      dueDateFrom?: string;
      dueDateTo?: string;
    } = {};
    
    if (query.listId) {
      filterOptions.listId = query.listId;
    }
    
    if (query.completed !== undefined) {
      filterOptions.isCompleted = query.completed;
    }
    
    if (query.priority !== undefined) {
      filterOptions.priority = query.priority;
    }
    
    const tasks = await tasksService.getAll(filterOptions);
    
    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createTaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const task = await tasksService.create(validationResult.data as import('@/types').CreateTaskRequest);
    
    return NextResponse.json({
      success: true,
      data: task,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to create task' },
      { status: 500 }
    );
  }
}
