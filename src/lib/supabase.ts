// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

// 强制获取环境变量，加感叹号表示我们确定这些变量一定存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * 升级版 Supabase 浏览器客户端
 * * 为什么要改用 createBrowserClient？
 * 1. 它能够自动识别并读取 document.cookie 中的 Token，而不仅仅依赖 localStorage。
 * 2. 通过注入 cookieOptions，我们确保了主站在刷新 Token 时，依然会将新的凭证写回到 .wsw.wiki 域名下。
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseKey, {
  cookieOptions: {
    domain: '.wsw.wiki', // 🚨 核心配置：必须与认证站种下的域名完全一致
    path: '/',
    sameSite: 'lax',
    secure: true,
  }
})