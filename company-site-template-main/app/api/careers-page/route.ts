import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // 读取 careers.html 文件
    const careersHtmlPath = path.join(process.cwd(), 'public', 'careers.html');
    const htmlContent = fs.readFileSync(careersHtmlPath, 'utf8');
    
    // 返回 HTML 内容，设置正确的 Content-Type
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存1小时
      },
    });
  } catch (error) {
    console.error('Error serving careers.html:', error);
    return new NextResponse('Careers page not found', { status: 404 });
  }
}
