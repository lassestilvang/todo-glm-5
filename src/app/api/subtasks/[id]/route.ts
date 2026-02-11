/**
 * Single Subtask API Routes
 * 
 * PUT /api/subtasks/[id] - Update a subtask
 * DELETE /api/subtasks/[id] - Delete a subtask
 */

import { NextRequest, NextResponse } from 'next/server';
import { subtasksService } from '@/lib/services';
import { updateSubtaskSchema } from '@/lib/validations';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = updateSubtaskSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }
    
    const subtask = await subtasksService.update(id, validationResult.data);
    
    return NextResponse.json({
      success: true,
      data: subtask,
    });
  } catch (error) {
    console.error('Error updating subtask:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update subtask' },
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
    
    await subtasksService.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Subtask deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to delete subtask' },
      { status: 500 }
    );
  }
}
