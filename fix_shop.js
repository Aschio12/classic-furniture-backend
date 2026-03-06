const fs = require('fs');
const path = './app/shop/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const importStatement = `import ProtectedRoute from '@/components/auth/ProtectedRoute';\n`;

content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\n" + importStatement);

const returnMatch = content.indexOf('return (\n    <div className="min-h-screen bg-[#faf9f6]');

if (returnMatch !== -1) {
  const replacement = `return (
    <ProtectedRoute allowedRoles={['user']}>
      <div className="min-h-screen bg-[#faf9f6]`;
  
  content = content.replace('return (\n    <div className="min-h-screen bg-[#faf9f6]', replacement);
  
  // Now add the closing tag before the very last closing brace
  const lastBraceIdx = content.lastIndexOf('}');
  content = content.substring(0, lastBraceIdx) + '  </ProtectedRoute>\n  );\n}';
  fs.writeFileSync(path, content);
  console.log("Success");
} else {
  console.log("Failed to find return block");
}
