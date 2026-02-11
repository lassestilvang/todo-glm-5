/**
 * Task Attachments API Routes
 * 
 * GET /api/tasks/[id]/attachments - Get attachments for a task
 * POST /api/tasks/[id]/attachments - Create an attachment
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachmentsService, tasksService } from '@/lib/services';
import { createAttachmentSchema } from '@/lib/validations';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Verify task exists
    const task = await tasksService.getById(id);
    if (!task) {
      throw new NotFoundError('Task', id);
    }
    
    const attachments = await attachmentsService.getByTaskId(id);
    
    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = createAttachmentSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      throw new ValidationError(`Validation failed: ${errors}`);
    }
    
    const attachment = await attachmentsService.create(id, { task_id: id, ...validationResult.data });
    
    return NextResponse.json({
      success: true,
      data: attachment,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating attachment:', error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Failed to create attachment' },
      { status: 500 }
    );
  }
}
