/**
 * Lists API Routes
 * 
 * GET /api/lists - Get all lists with task counts
 * POST /api/lists - Create a new list
 */

import { NextRequest, NextResponse } from 'next/server';
import { listsService } from '@/lib/services';
import { createListSchema } from '@/lib/validations';
import { AppError, ValidationError } from '@/lib/errors';

export async function GET() {
  try {
    const listsWithCounts = await listsService.getAllWithTaskCounts();
    
    const data = listsWithCounts.map(({ list, taskCount, completedTaskCount }) => ({
      ...list,
      task_count: taskCount,
      completed_task_count: completedTaskCount,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createListSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const list = await listsService.create(validationResult.data);
    
    return NextResponse.json({
      success: true,
      data: list,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to create list' },
      { status: 500 }
    );
  }
}
