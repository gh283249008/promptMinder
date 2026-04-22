import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/admin-login', '/sign-in', '/sign-up', '/api', '/_next', '/favicon', '/fonts', '/images', '/robots', '/sitemap', '/manifest.json'];

export default async function middleware(request) {
  const { pathname } = request.nextUrl;

  // 如果没有配置 ADMIN_PASSWORD，跳过认证（开发模式）
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  // 公开路径不过滤
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 检查认证 cookie
  const adminCookie = request.cookies.get('pm_admin');

  if (!adminCookie || adminCookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL('/admin-login', request.url));
  }

  const response = NextResponse.next();

  // 添加性能和安全 headers
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
  ],
};
