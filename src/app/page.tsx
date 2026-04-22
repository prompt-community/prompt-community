// src/app/page.tsx
import { supabase } from '@/lib/supabase'

export default async function Home() {
  // 在服务端直接向 Supabase 发起查询请求，拉取 prompts 表的所有数据
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">
        🚀 Prompt 社区 MVP - 数据库连通测试
      </h1>

      {/* 如果发生报错，红色高亮显示 */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4 shadow-sm">
          <strong>哎呀，报错了：</strong> {error.message}
        </div>
      )}

      {/* 将拉取到的数据以 JSON 格式打印到页面上 */}
      <div className="bg-gray-900 text-green-400 p-6 rounded-md shadow-lg overflow-x-auto">
        <h2 className="text-white text-lg mb-4 border-b border-gray-700 pb-2">
          数据库返回结果：
        </h2>
        <pre className="text-sm">
          {JSON.stringify(prompts, null, 2)}
        </pre>
      </div>
    </main>
  )
}