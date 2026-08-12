import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    const careersHtmlPath = path.join(process.cwd(), 'public', 'careers.html');
    const htmlContent = fs.readFileSync(careersHtmlPath, 'utf8');

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error serving careers.html:', error);
    return new NextResponse('Careers page not found', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
