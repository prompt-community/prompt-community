// src/lib/avatar.ts

/**
 * 根据名称生成首字符/汉字的默认头像
 * 返回一个可直接用于 <img src="..."> 的 SVG Data URI
 */
export function generateInitialAvatar(name: string): string {
  // 提取首字符，如果没有则默认为 "匿"
  const initial = name ? Array.from(name)[0].toUpperCase() : '匿';

  // 简单的字符串哈希算法，用于基于名字生成一致且稳定的渐变颜色
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  }

  // 生成漂亮的渐变色背景（基于 HSL 色彩空间）
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360; // 偏移 40 度，制造舒适的同色系渐变
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${h1}, 70%, 60%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${h2}, 70%, 50%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#grad)" />
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="central" 
        text-anchor="middle" 
        fill="white" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        font-size="48"
        font-weight="bold"
      >
        ${initial}
      </text>
    </svg>
  `;

  // 将 SVG 转换为安全的 Data URI
  const encodedSvg = encodeURIComponent(svg.trim().replace(/\n/g, ''));
  return `data:image/svg+xml;utf8,${encodedSvg}`;
}
