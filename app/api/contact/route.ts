import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/mail';
import { createRecord, getRecords, getCollectionFields, populateRelationLabels, getDb, oid } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const safeLimit = Math.trunc(limit);

// Fetch records
const result = await getRecords('contact_leads', safeLimit, {}, undefined);

    if (result.error) {
      console.error('Failed to fetch contact inquiries:', result.error);
      return NextResponse.json({ success: false, error: 'Failed to fetch records' }, { status: 500 });
    }

    const { data, total } = result as unknown as { data: any[], total: number };

    // Get fields to identify relation fields
    const { data: fields } = await getCollectionFields('contactInquiry');

    // Populate relation labels (e.g., service_id if it's a Relation type)
    const populatedData = await populateRelationLabels(data, fields || []);

    // If populateRelationLabels didn't populate service_id (because it's not a Relation type),
    // manually fetch the service data
    const db = await getDb();
    const populatedWithServices = await Promise.all(populatedData.map(async (record: any) => {
      if (record.service_id && !record.service_id_populated) {
        const serviceIdOid = oid(record.service_id);
        if (serviceIdOid) {
          const serviceDoc = await db.collection('service').findOne({ _id: serviceIdOid });
          if (serviceDoc) {
            const normalizedService = {
              id: serviceDoc._id.toString(),
              ...serviceDoc,
            };
            // Remove the _id from the serviceDoc to avoid duplication
            delete (normalizedService as any)._id;
            
            return {
              ...record,
              service_id_populated: normalizedService,
            };
          }
        }
      }
      return record;
    }));

    return NextResponse.json({
      success: true,
      data: populatedWithServices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Contact GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, url } = body;
    const service_id = body.service_id || body.service;

    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const xssRegex = /<[^>]*>?/gm;

    if (!name || !nameRegex.test(name.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid name format' }, { status: 400 });
    }
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }
    if (phone) {
      const phoneTrimmed = phone.trim();
      const validDigits = /^[2-9]\d{9}$/.test(phoneTrimmed);
      const isRepetitive = /^(\d)\1{9}$/.test(phoneTrimmed);
      const isSequential = /^(0123456789|1234567890|9876543210|0987654321)$/.test(phoneTrimmed);
      if (!validDigits || isRepetitive || isSequential) {
        return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
      }
    }
    if (!message || !/[a-zA-Z0-9]/.test(message.trim()) || xssRegex.test(message)) {
      return NextResponse.json({ success: false, error: 'Invalid message text' }, { status: 400 });
    }

    const { error: dbError } = await createRecord('contact_leads', { name, email, phone, service_id, message, url });
    if (dbError) console.error('Failed to save contact form data:', dbError);

    await sendContactEmail({ name, email, service_id, message });

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}