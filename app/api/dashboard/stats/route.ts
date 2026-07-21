import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Guard with authentication
    await requireAuth();

    const db = await getDb();

    // 2. Fetch counts
    const productsCount = await db.collection('our_products').countDocuments().catch(() => 0);
    const blogsCount = await db.collection('blog').countDocuments().catch(() => 0);
    const careerLeadsCount = await db.collection('career_applications').countDocuments().catch(() => 0);
    const contactLeadsCount = await db.collection('contact_leads').countDocuments().catch(() => 0);

    // 3. Fetch collection IDs for linking
    const productsCollection = await db.collection('collections').findOne({ name: 'our_products' });
    const blogsCollection = await db.collection('collections').findOne({ name: 'blog' });

    // 4. Summarize Page Components grouped by page
    const pageComponents = await db.collection('page_components').find({}).toArray().catch(() => []);
    
    // Group page components to count total and active components per page
    const pageSummaryMap: Record<string, { total: number; active: number }> = {};
    pageComponents.forEach((comp: any) => {
      const page = comp.page;
      if (!pageSummaryMap[page]) {
        pageSummaryMap[page] = { total: 0, active: 0 };
      }
      pageSummaryMap[page].total += 1;
      if (comp.is_active) {
        pageSummaryMap[page].active += 1;
      }
    });

    const pages = Object.entries(pageSummaryMap).map(([name, stats]) => ({
      name,
      totalComponents: stats.total,
      activeComponents: stats.active,
    }));

    // 5. Fetch email templates
    const emailTemplates = await db.collection('email_templates')
      .find({})
      .sort({ created_at: -1 })
      .toArray()
      .catch(() => []);

    const templates = emailTemplates.map((t: any) => ({
      id: t._id.toString(),
      name: t.name,
      subject: t.subject,
      variables: t.variables || [],
      is_default: !!t.is_default,
    }));

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          products: productsCount,
          blogs: blogsCount,
          careerLeads: careerLeadsCount,
          contactLeads: contactLeadsCount,
        },
        links: {
          productsCollectionId: productsCollection?._id.toString() || null,
          blogsCollectionId: blogsCollection?._id.toString() || null,
        },
        pages,
        templates,
      }
    });

  } catch (error: any) {
    console.error('Dashboard Stats GET Error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
