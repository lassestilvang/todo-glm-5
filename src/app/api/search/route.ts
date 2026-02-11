/**
 * Search API Route
 * 
 * GET /api/search - Search across all entities
 * Query params: q (query), type (tasks|lists|labels|all), limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/services';
import { searchQuerySchema } from '@/lib/validations';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Build query params object
    const queryParams = {
      q: searchParams.get('q') ?? '',
      type: (searchParams.get('type') as 'all' | 'tasks' | 'lists' | 'labels') ?? 'all',
      limit: searchParams.get('limit') ?? undefined,
    };
    
    // Validate query params
    const validationResult = searchQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      return NextResponse.json(
        { success: false, error: 'VALIDATION_ERROR', message: `Validation failed: ${errors}` },
        { status: 400 }
      );
    }
    
    const { q, type, limit } = validationResult.data;
    
    // Perform search
    const results = await searchService.searchAll(q, {
      limit,
      scope: type,
      includeCompleted: true,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        tasks: results.tasks,
        lists: results.lists,
        labels: results.labels,
        totalMatches: results.totalMatches,
      },
    });
  } catch (error) {
    console.error('Error searching:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to search' },
      { status: 500 }
    );
  }
}
