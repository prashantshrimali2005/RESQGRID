const fs = require('fs');
const path = require('path');
const dir = './src/pages';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    // Ignore already converted files (if any)
    if (content.includes('import React')) return;
    
    const htmlMatch = content.match(/const html = \`([\s\S]*?)\`;/);
    if (!htmlMatch) return;
    let html = htmlMatch[1];
    
    html = html.replace(/class=/g, 'className=');
    html = html.replace(/for=/g, 'htmlFor=');
    html = html.replace(/<img([^>]*?)([^\/])>/g, '<img$1$2 />');
    html = html.replace(/<input([^>]*?)([^\/])>/g, '<input$1$2 />');
    html = html.replace(/style=\"([^\"]+)\"/g, (match, p1) => {
      const props = p1.split(';').map(s => s.trim()).filter(Boolean);
      const obj = props.map(p => {
        let [k, v] = p.split(':').map(s => s.trim());
        k = k.replace(/-([a-z])/g, g => g[1].toUpperCase());
        return k + ': \'' + v + '\'';
      }).join(', ');
      return 'style={{ ' + obj + ' }}';
    });
    html = html.replace(/readonly=\"\"/g, 'readOnly');
    html = html.replace(/onclick=\"([^\"]+)\"/gi, (match, p1) => 'onClick={() => { ' + p1 + ' }}');
    
    // replace href="#" with preventDefault in a real app, but for now # is okay or javascript:void(0)
    html = html.replace(/href=\"#\"/g, 'href=\"javascript:void(0)\"');
    
    // data-path should be changed to Link to, but it's hard to automate all <a> tags with data-path. 
    // We can do it manually or let React Router navigate from onClick.
    
    const funcNameMatch = content.match(/export default function ([a-zA-Z0-9_]+)/);
    const funcName = funcNameMatch ? funcNameMatch[1].charAt(0).toUpperCase() + funcNameMatch[1].slice(1) : 'Page';
    
    let newContent = `import React, { useEffect } from 'react';\nimport { Link, useNavigate } from 'react-router-dom';\nimport { Header, BottomNav, showToast } from '../components';\n\n`;
    newContent += `export default function ${funcName}() {\n  const navigate = useNavigate();\n`;
    
    const initMatch = content.match(/function init\(\) \{([\s\S]*?)\n  \}\n  return/);
    const constInitMatch = content.match(/const init = \(\) => \{([\s\S]*?)\n  \};\n/);
    
    if (initMatch || constInitMatch) {
      let initBody = initMatch ? initMatch[1] : constInitMatch[1];
      // Quick fix for document.getElementById in React (best-effort, might need manual useRef fixes later)
      newContent += `  useEffect(() => {\n    let isMounted = true;\n    // Ported from vanilla JS init()\n${initBody}\n    return () => { isMounted = false; };\n  }, []);\n\n`;
    }
    
    // Convert <a> tags with data-path to <Link> manually in HTML?
    // Basic conversion:
    html = html.replace(/<a([^>]+)data-path=\"([^\"]+)\"([^>]*)>([\s\S]*?)<\/a>/g, (match, p1, path, p2, inner) => {
      // remove href attribute
      let attrs = (p1 + p2).replace(/href=\"[^\"]*\"/, '');
      return `<Link to="/${path}"${attrs}>${inner}</Link>`;
    });

    newContent += `  return (\n    <>\n${html}\n    </>\n  );\n}\n`;
    
    fs.writeFileSync(path.join(dir, file), newContent);
    console.log('Converted ' + file);
  }
});
