const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactMarkdown = require('react-markdown').default || require('react-markdown');

const md = `
# Role
你是一个

# Rules
1. **审查维度**:
`;

const element = React.createElement(ReactMarkdown, null, md);
console.log(ReactDOMServer.renderToString(element));
