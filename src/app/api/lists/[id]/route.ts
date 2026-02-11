/**
 * Single List API Routes
 * 
 * GET /api/lists/[id] - Get a single list
 * PUT /api/lists/[id] - Update a list
 * DELETE /api/lists/[id] - Delete a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { listsService } from '@/lib/services';
import { updateListSchema } from '@/lib/validations';
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
    
    const listWithCounts = await listsService.getWithTaskCounts(id);
    
    if (!listWithCounts) {
      throw new NotFoundError('List', id);
    }
    
    const data = {
      ...listWithCounts.list,
      task_count: listWithCounts.taskCount,
      completed_task_count: listWithCounts.completedTaskCount,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch list' },
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
    const validationResult = updateListSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }
    
    const list = await listsService.update(id, validationResult.data);
    
    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error('Error updating list:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update list' },
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
    
    await listsService.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to delete list' },
      { status: 500 }
    );
  }
}
