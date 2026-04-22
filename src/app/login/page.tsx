// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { authService } from '@/lib/authService'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // 优化点 1：将 message 拆分为文字和类型，方便控制动态颜色
  const [message, setMessage] = useState({ text: '', type: '' })
  const [loading, setLoading] = useState(false)

  // 优化点 2：修复类型报错，改为 React.MouseEvent，并指定 HTMLButtonElement
  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' }) // 清空上一次的提示
    try {
      await authService.signUp(email, password)
      setMessage({ text: '✅ 注册成功！请前往邮箱点击验证链接。', type: 'success' })
    } catch (error) {
      setMessage({ text: `❌ 注册失败: ${(error as Error).message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      await authService.signIn(email, password)
      setMessage({ text: '🚀 登录成功！欢迎来到 Prompt 社区。', type: 'success' })
    } catch (error) {
      // Invalid login credentials 就会在这里被捕获并变成醒目的红色
      setMessage({ text: `❌ 登录失败: ${(error as Error).message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">极客身份验证</h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">中科大邮箱 (或常用邮箱)</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // 强制指定输入框文字为深灰色，避免暗黑模式冲突
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">极客密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white"
              placeholder="至少 6 位字符"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" // 明确声明这是普通按钮，防止触发表单默认提交
              onClick={handleSignIn}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? '处理中...' : '登录'}
            </button>
            <button 
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-gray-800 text-white font-medium py-2 rounded-md hover:bg-gray-900 transition disabled:opacity-50"
            >
              注册
            </button>
          </div>
        </form>

        {/* 修复文字看不清：基于 message.type 动态渲染背景色和深色字体 */}
        {message.text && (
          <div className={`mt-6 p-3 rounded-md text-sm text-center font-bold ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </main>
  )
}