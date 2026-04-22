// src/lib/authService.ts
import { supabase } from './supabase'

export const authService = {
  // 1. 邮箱注册 (Supabase 默认会向该邮箱发送一封验证邮件)
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // 2. 邮箱+密码登录
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  // 3. 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 4. 获取当前登录用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}