const fs = require('fs');

// Fix report.tsx
let r = fs.readFileSync('src/pages/report.tsx', 'utf8');
r = r.replace('<Header title="Report an Issue" showBack={true} showBrand={false} />\n          <div className="flex items-center justify-between">', 
'<Header title="Report an Issue" showBack={true} showBrand={false} />\n    <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 md:pb-8 md:ml-24 bg-surface">\n      <div className="w-full max-w-3xl mx-auto flex flex-col px-margin pb-safe space-y-space-lg stagger-enter pt-space-sm h-full">\n        <div className="bg-surface-container-lowest p-space-md md:p-space-lg rounded-2xl shadow-sm border border-outline-variant/20 space-y-space-md shrink-0">\n          <div className="flex items-center justify-between">');
if (r.includes('renderBottomNav')) r = r.replace(/\$\{\s*renderBottomNav[^}]+\}/g, '<BottomNav />');
fs.writeFileSync('src/pages/report.tsx', r);

// Fix map.tsx
let m = fs.readFileSync('src/pages/map.tsx', 'utf8');
m = m.replace('<Header title="Ward Operations Map" showBack={true} showBrand={false} />\n        </div>',
'<Header title="Ward Operations Map" showBack={true} showBrand={false} />\n    <main className="flex-1 flex flex-col relative w-full h-[calc(100vh)] pt-20 pb-20 md:pb-0 md:ml-24 bg-surface-container-highest">\n      <div id="full-map-container" className="w-full h-full relative z-0 flex items-center justify-center">\n        <div className="flex flex-col items-center gap-2 text-on-surface-variant/50">\n          <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>\n          <span className="font-title-sm text-title-sm font-bold uppercase tracking-wider">Loading Map Data...</span>\n        </div>');
if (m.includes('renderBottomNav')) m = m.replace(/\$\{\s*renderBottomNav[^}]+\}/g, '<BottomNav active="map" />');
fs.writeFileSync('src/pages/map.tsx', m);

// Fix tracking.tsx
let t = fs.readFileSync('src/pages/tracking.tsx', 'utf8');
t = t.replace('<Header title="Report Details" showBack={true} showBrand={false} />\n          <div className="flex items-center justify-between">',
'<Header title="Report Details" showBack={true} showBrand={false} />\n    <main className="flex-1 flex flex-col relative w-full pt-20 pb-24 md:pb-8 md:ml-24 bg-surface">\n      <div className="w-full max-w-4xl mx-auto flex flex-col stagger-enter px-margin pt-space-sm gap-space-lg">\n        <section className="flex flex-col gap-space-sm">\n          <div className="flex items-center justify-between">');
if (t.includes('renderBottomNav')) t = t.replace(/\$\{\s*renderBottomNav[^}]+\}/g, '<BottomNav />');
fs.writeFileSync('src/pages/tracking.tsx', t);

console.log('Fixed tags');
