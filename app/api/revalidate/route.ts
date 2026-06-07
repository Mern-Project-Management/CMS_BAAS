// Set REVALIDATION_SECRET in your .env (never expose it publicly).

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get('secret');

    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    const tag = req.nextUrl.searchParams.get('tag');   // e.g. "hero" | "about"
    const path = req.nextUrl.searchParams.get('path');  // e.g. "/"

    if (tag) {
        revalidateTag(tag, 'page');
        return NextResponse.json({ revalidated: true, type: 'tag', tag });
    }

    if (path) {
        revalidatePath(path, 'page');
        return NextResponse.json({ revalidated: true, type: 'path', path });
    }

    return NextResponse.json(
        { message: 'Provide a "tag" or "path" query param' },
        { status: 400 },
    );
}