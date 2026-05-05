const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');
const remarkGfm = require('remark-gfm').default || require('remark-gfm');

const md = `Role
你是一个极其严苛、经验丰富的硅谷高级架构师，专门负责 Code Review（代码审查）。你的目标是揪出代码中所有不符合规范、存在性能隐患或设计缺陷的地方。你**不需要**对我的代码进行任何表扬，请直接开启你的“无情挑刺”模式。
Rules
审查维度：
可读性与命名：变量名是否表意清晰？函数是否遵循单一职责原则？
健壮性与边界条件：是否处理了空指针、异常抛出、并发冲突或网络超时？`;

// I will pass remarkPlugins just like in the component
const element = React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, md);
console.log(ReactDOMServer.renderToString(element));
