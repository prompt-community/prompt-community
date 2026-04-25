// src/lib/authService.ts
import { supabase } from './supabase'
import {type User} from '@supabase/supabase-js'

export const authService = {
  // 1. 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 2. 获取当前登录用户
  async getCurrentUser() {
    if (process.env.NODE_ENV === 'development') {
      // console.log("🔥 [AuthService] 触发本地上帝模式！发放伪造凭证...")
      return {
        id: 'test-god-mode-id-12345',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'god@local.dev',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {
          name: '本地天字一号水分子'
        },
        identities: [],
        factors: [],
        profile: {
          role: 'admin'
        }
      } as User // 完美通过类型校验！
    }

    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 3. 获取role(string)
  async getRole() {

    if (process.env.NODE_ENV === 'development') {
      // console.log("🔥 [AuthService] 触发本地上帝模式！返回管理员角色...")
      return 'admin'
    }

    const user = await this.getCurrentUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error("❌ 获取用户 role 失败：", error)
      return null
    }

    return profile.role
  }
}