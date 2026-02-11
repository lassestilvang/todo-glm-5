/**
 * Subtask Toggle API Route
 * 
 * POST /api/subtasks/[id]/toggle - Toggle subtask completion status
 */

import { NextRequest, NextResponse } from 'next/server';
import { subtasksService } from '@/lib/services';
import { AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const subtask = await subtasksService.toggle(id);
    
    return NextResponse.json({
      success: true,
      data: subtask,
    });
  } catch (error) {
    console.error('Error toggling subtask:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to toggle subtask' },
      { status: 500 }
    );
  }
}
