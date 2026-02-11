/**
 * Single Label API Routes
 * 
 * GET /api/labels/[id] - Get a single label
 * PUT /api/labels/[id] - Update a label
 * DELETE /api/labels/[id] - Delete a label
 */

import { NextRequest, NextResponse } from 'next/server';
import { labelsService } from '@/lib/services';
import { updateLabelSchema } from '@/lib/validations';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const label = await labelsService.getById(id);
    
    if (!label) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: `Label with id "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: label,
    });
  } catch (error) {
    console.error('Error fetching label:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch label' },
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
    const validationResult = updateLabelSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }
    
    const label = await labelsService.update(id, validationResult.data);
    
    return NextResponse.json({
      success: true,
      data: label,
    });
  } catch (error) {
    console.error('Error updating label:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to update label' },
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
    
    await labelsService.delete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting label:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to delete label' },
      { status: 500 }
    );
  }
}
