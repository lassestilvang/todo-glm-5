/**
 * Lists Reorder API Route
 * 
 * POST /api/lists/reorder - Reorder lists
 */

import { NextRequest, NextResponse } from 'next/server';
import { listsService } from '@/lib/services';
import { reorderListsSchema } from '@/lib/validations';
import { AppError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = reorderListsSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    await listsService.reorder(validationResult.data.listIds);
    
    return NextResponse.json({
      success: true,
      message: 'Lists reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering lists:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to reorder lists' },
      { status: 500 }
    );
  }
}
