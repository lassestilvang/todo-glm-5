/**
 * Label Tasks API Route
 * 
 * GET /api/labels/[id]/tasks - Get all tasks with this label
 */

import { NextRequest, NextResponse } from 'next/server';
import { labelsService } from '@/lib/services';
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
    
    const tasks = await labelsService.getTasksWithLabel(id);
    
    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks with label:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch tasks with label' },
      { status: 500 }
    );
  }
}
