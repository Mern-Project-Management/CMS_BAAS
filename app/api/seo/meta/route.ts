import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    
    const db = await getDb();
    
    if (slug) {
      const pageMeta = await db.collection('manage-meta').findOne({ slug: slug });
      if (!pageMeta) {
        // Return blank default structure instead of failing
        const defaultMeta = {
          pageName: slug.replace(/-/g, ' ').replace(/^\//, '') || 'Home',
          pageSlug: slug,
          metaTitle: '',
          metaDescription: '',
          metaKeyword: '',
          metaCanonical: '',
          metaSchema: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          ogType: 'website',
          twitterCard: 'summary_large_image',
          noIndex: false,
          noFollow: false,
          faqSchema: '',
          isActive: true,
          seoScore: 0
        };
        return NextResponse.json({ success: true, data: defaultMeta } as ApiResponse<any>, { status: 200 });
      }
      
      const responseData = {
        id: pageMeta._id.toString(),
        pageName: pageMeta.slug.replace(/-/g, ' ').replace(/^\//, '') || 'Home',
        pageSlug: pageMeta.slug,
        metaTitle: pageMeta.meta_title || '',
        metaDescription: pageMeta.meta_description || '',
        metaKeyword: pageMeta.keywords || '',
        metaCanonical: pageMeta.meta_canonical || '',
        metaSchema: pageMeta.schema ? (typeof pageMeta.schema === 'object' ? JSON.stringify(pageMeta.schema) : pageMeta.schema) : '',
        ogTitle: pageMeta.og_title || pageMeta.meta_title || '',
        ogDescription: pageMeta.og_description || pageMeta.meta_description || '',
        ogImage: pageMeta.og_image || '',
        ogType: pageMeta.og_type || 'website',
        twitterCard: pageMeta.twitter_card || 'summary_large_image',
        noIndex: pageMeta.no_index ?? false,
        noFollow: pageMeta.no_follow ?? false,
        faqSchema: pageMeta.faq_schema || '',
        isActive: true,
        seoScore: pageMeta.seo_score || 0
      };
      
      return NextResponse.json({ success: true, data: responseData } as ApiResponse<any>, { status: 200 });
    }
    
    const allMeta = await db.collection('manage-meta').find().toArray();
    const data = allMeta.map(m => {
      const formatted = {
        id: m._id.toString(),
        pageName: m.slug.replace(/-/g, ' ').replace(/^\//, '') || 'Home',
        pageSlug: m.slug,
        metaTitle: m.meta_title || '',
        metaDescription: m.meta_description || '',
        metaKeyword: m.keywords || '',
        metaSchema: m.schema ? (typeof m.schema === 'object' ? JSON.stringify(m.schema) : m.schema) : '',
        isActive: true
      };
      return formatted;
    });
    
    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>, { status: 200 });
  } catch (error: any) {
    console.error('SEO meta GET error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    const { pageSlug } = body;
    
    if (!pageSlug) {
      return NextResponse.json({ success: false, error: 'pageSlug is required' } as ApiResponse<null>, { status: 400 });
    }
    
    const db = await getDb();
    const { id, _id, ...updates } = body;
    
    const dbDoc: Record<string, any> = {
      slug: pageSlug,
      updated_at: new Date().toISOString()
    };
    
    if (updates.metaTitle !== undefined) dbDoc.meta_title = updates.metaTitle;
    if (updates.metaDescription !== undefined) dbDoc.meta_description = updates.metaDescription;
    if (updates.metaKeyword !== undefined) dbDoc.keywords = updates.metaKeyword;
    
    if (updates.metaSchema !== undefined) {
      try {
        dbDoc.schema = typeof updates.metaSchema === 'string' && updates.metaSchema.trim() 
          ? JSON.parse(updates.metaSchema) 
          : updates.metaSchema;
      } catch (e) {
        dbDoc.schema = updates.metaSchema;
      }
    }
    
    if (updates.ogTitle !== undefined) dbDoc.og_title = updates.ogTitle;
    if (updates.ogDescription !== undefined) dbDoc.og_description = updates.ogDescription;
    if (updates.ogImage !== undefined) dbDoc.og_image = updates.ogImage;
    if (updates.ogType !== undefined) dbDoc.og_type = updates.ogType;
    if (updates.twitterCard !== undefined) dbDoc.twitter_card = updates.twitterCard;
    if (updates.noIndex !== undefined) dbDoc.no_index = updates.noIndex;
    if (updates.noFollow !== undefined) dbDoc.no_follow = updates.noFollow;
    if (updates.faqSchema !== undefined) dbDoc.faq_schema = updates.faqSchema;
    if (updates.seoScore !== undefined) dbDoc.seo_score = updates.seoScore;
    
    const result = await db.collection('manage-meta').findOneAndUpdate(
      { slug: pageSlug },
      { 
        $set: dbDoc,
        $setOnInsert: { created_at: new Date().toISOString() }
      },
      { returnDocument: 'after', upsert: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Pages SEO metadata updated successfully', 
      data: result 
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('SEO meta POST error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}
