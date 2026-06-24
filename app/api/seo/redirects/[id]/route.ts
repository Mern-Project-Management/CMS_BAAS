import { NextRequest, NextResponse } from 'next/server';
import { getDb, oid } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin', 'admin']);
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();
    
    const objectId = oid(id);
    if (!objectId) {
      return NextResponse.json({ success: false, error: 'Invalid redirect ID' } as ApiResponse<null>, { status: 400 });
    }
    
    // Normalize target values
    const updates: any = { updated_at: new Date().toISOString() };
    if (body.sourceUrl !== undefined) {
      updates.sourceUrl = body.sourceUrl.startsWith('/') || body.sourceUrl.startsWith('http') ? body.sourceUrl.trim() : `/${body.sourceUrl.trim()}`;
      
      // Verify sourceUrl uniqueness if changing
      const existing = await db.collection('seo_redirects').findOne({ 
        sourceUrl: updates.sourceUrl, 
        _id: { $ne: objectId } 
      });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Source URL already exists' } as ApiResponse<null>, { status: 400 });
      }
    }
    
    if (body.targetUrl !== undefined) {
      updates.targetUrl = body.targetUrl.startsWith('/') || body.targetUrl.startsWith('http') ? body.targetUrl.trim() : `/${body.targetUrl.trim()}`;
    }
    if (body.statusCode !== undefined) {
      updates.statusCode = Number(body.statusCode);
    }
    if (body.status !== undefined) {
      updates.status = body.status;
    }
    if (body.hits !== undefined) {
      updates.hits = Number(body.hits);
    }
    
    const result = await db.collection('seo_redirects').findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ success: false, error: 'Redirect not found' } as ApiResponse<null>, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Redirect updated successfully',
      data: { id: result._id.toString(), ...result }
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('Redirect PATCH error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin', 'admin']);
    const { id } = await params;
    const db = await getDb();
    
    const objectId = oid(id);
    if (!objectId) {
      return NextResponse.json({ success: false, error: 'Invalid redirect ID' } as ApiResponse<null>, { status: 400 });
    }
    
    const result = await db.collection('seo_redirects').deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Redirect not found' } as ApiResponse<null>, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Redirect deleted successfully'
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('Redirect DELETE error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}
