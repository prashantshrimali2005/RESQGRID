const fs = require('fs');
let content = fs.readFileSync('src/pages/home.tsx', 'utf8');

// Fix SVG opening tag
content = content.replace(
  '<div className="flex items-center gap-space-xs bg-secondary-container px-space-sm py-1.5 rounded-lg">\n                <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-ping"></span>\n                <span className="font-label-sm text-label-sm text-on-secondary-fixed">Active Crews: 42 on duty</span>\n              </div>',
  '<div className="flex items-center gap-space-xs bg-secondary-container px-space-sm py-1.5 rounded-lg">\n                <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-ping"></span>\n                <span className="font-label-sm text-label-sm text-on-secondary-fixed">Active Crews: 42 on duty</span>\n              </div>\n            </div>\n            <div className="relative w-full h-[460px] mt-space-sm rounded-xl overflow-hidden bg-surface-container-high">\n              <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">\n                <defs>\n                  <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">\n                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbdbf5" strokeWidth="1"></path>\n                  </pattern>\n                </defs>\n                <rect fill="url(#grid)" height="100%" width="100%"></rect>'
);

// Fix SVG props
content = content.replace(/stroke-width/g, 'strokeWidth');
content = content.replace(/stroke-linecap/g, 'strokeLinecap');
content = content.replace(/stroke-dasharray/g, 'strokeDasharray');

fs.writeFileSync('src/pages/home.tsx', content);
console.log('Fixed home.tsx');
