export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-sm text-gray-500 text-center">
        <p className="mb-2 font-medium">
          © {new Date().getFullYear()} Prompt 开源社区 | 由中科大极客构建
        </p>
        <p className="mb-2">
          社区所有公开 Prompt 默认采用 <strong>MIT</strong> 或 <strong>CC BY 4.0</strong> 协议开源 。
        </p>
        <p>
          根据“避风港原则”，若发现内容侵权，请联系投诉通道：
          <a href="mailto:legal@wsw.wiki" className="text-blue-500 hover:underline ml-1">
            legal@wsw.wiki
          </a>
        </p>
      </div>
    </footer>
  );
}