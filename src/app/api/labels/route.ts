/**
 * Labels API Routes
 * 
 * GET /api/labels - Get all labels
 * POST /api/labels - Create a new label
 */

import { NextRequest, NextResponse } from 'next/server';
import { labelsService } from '@/lib/services';
import { createLabelSchema } from '@/lib/validations';
import { AppError, ValidationError } from '@/lib/errors';

export async function GET() {
  try {
    const labels = await labelsService.getAll();
    
    return NextResponse.json({
      success: true,
      data: labels,
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createLabelSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const label = await labelsService.create(validationResult.data);
    
    return NextResponse.json({
      success: true,
      data: label,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to create label' },
      { status: 500 }
    );
  }
}
