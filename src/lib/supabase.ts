// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// 强制获取环境变量，加感叹号表示我们确定这些变量一定存在
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 导出一个可复用的 supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseKey)