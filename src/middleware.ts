// nextjs-main-site/src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { authService } from '@/lib/authService'

export async function middleware(request: NextRequest) {
  // 🚧 极客后门：本地开发环境直接放行，不走任何 Cookie 校验与拦截
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // 初始化一个 NextResponse，后续如果刷新了 Token 需要用它来回写 Cookie
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // 更新 Request 内部的 Cookie 状态
            request.cookies.set(name, value)
            supabaseResponse = NextResponse.next({
              request,
            })
            // 核心魔法：如果 Token 过期自动刷新了，回写的新 Cookie 也必须是跨域的！
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: '.wsw.wiki',
            })
          })
        },
      },
    }
  )

  // 这一步非常关键：调用 getUser() 不仅为了验证身份，更是触发潜在 Token 刷新的引擎
  // await supabase.auth.getUser()
  await authService.getCurrentUser() // 通过 AuthService 的 getCurrentUser 来触发 Token 刷新逻辑

  return supabaseResponse
}

// 优化性能：过滤掉静态文件和 API 请求，只在页面路由执行
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}