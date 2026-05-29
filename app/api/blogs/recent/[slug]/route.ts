import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = await getDb();
    const { searchParams } = new URL(request.url);
    const excludeMode = searchParams.get('exclude') === 'true';

    if (excludeMode) {
      // Return all blogs except the one with the given slug
      const blogs = await db.collection('blog').find({ slug: { $ne: slug } }).toArray();

      const data = blogs.map(({ _id, ...rest }) => ({ ...rest, id: _id.toString() }));

      return NextResponse.json({ success: true, data });
    }

    // Find the record in the 'blogs' collection where the slug matches
    const blog = await db.collection('blog').findOne({ slug });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Normalize the document by converting the MongoDB _id to a string id
    const { _id, ...rest } = blog;
    return NextResponse.json({ 
      success: true, 
      data: { ...rest, id: _id.toString() } 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve blog post' },
      { status: 500 }
    );
  }
}