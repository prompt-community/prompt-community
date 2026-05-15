// src/lib/authService.ts
import { supabase } from './supabase'
import {type User} from '@supabase/supabase-js'

type AuthStateChangeCallback = Parameters<typeof supabase.auth.onAuthStateChange>[0]

export const authService = {
  

  // 1. 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // 2. 获取当前登录用户
  async getCurrentUser() {
    const admin_uid = process.env.NEXT_PUBLIC_ADMIN_UID! // 从环境变量读取管理员 UID
    if (process.env.NODE_ENV === 'development') {
      console.log(admin_uid)
      // console.log("🔥 [AuthService] 触发本地上帝模式！发放伪造凭证...")
      return {
        id: admin_uid,
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

  // 2.1 监听登录状态变化，避免组件直接依赖具体用户系统 SDK
  onAuthStateChange(callback: AuthStateChangeCallback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // 3. 获取role(string)
  async getRole() : Promise<string | null> {

    // if (process.env.NODE_ENV === 'development') {
    //   // console.log("🔥 [AuthService] 触发本地上帝模式！返回管理员角色...")
    //   return 'admin'
    // }

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
  },

  // 4. 获取完整的用户个人资料
  async getUserProfile() {
    const user = await this.getCurrentUser()
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, role, points, bio')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error("❌ 获取用户 profile 失败：", error)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      username: profile.username,
      avatar_url: profile.avatar_url,
      role: profile.role,
      points: profile.points || 0,
      bio: profile.bio || ''
    }
  },

  // 5. 更新用户昵称
  async updateUsername(userId: string, newUsername: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', userId)

    if (error) {
      console.error("❌ 更新昵称失败：", error)
      throw error
    }
  },

  // 6. 获取指定用户的公开资料
  async getProfileById(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, role, points, bio')
      .eq('id', userId)
      .single()

    if (error) {
      console.error("❌ 获取指定用户 profile 失败：", error)
      return null
    }

    return {
      id: userId,
      // email 隐私保护，不在这里返回
      username: profile.username,
      avatar_url: profile.avatar_url,
      role: profile.role,
      points: profile.points || 0,
      bio: profile.bio || ''
    }
  },

  // 7. 更新个性签名
  async updateBio(userId: string, newBio: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ bio: newBio })
      .eq('id', userId)

    if (error) {
      console.error("❌ 更新个性签名失败：", error)
      throw error
    }
  }
}
