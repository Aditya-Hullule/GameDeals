const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\Aditya hullule\\.gemini\\antigravity\\brain\\617cd41e-8d43-4ea0-90e5-75cb2e070b8d\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

let navbarJsx = null;
let navbarCss = null;

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    
    // Check in tool_calls
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'write_to_file') {
          const args = call.args;
          const target = args.TargetFile || '';
          if (target.includes('Navbar.jsx') && args.CodeContent) {
            navbarJsx = args.CodeContent;
          }
          if (target.includes('Navbar.css') && args.CodeContent) {
            navbarCss = args.CodeContent;
          }
        }
      }
    }
    
    // Also check inside system generated error or view outputs if any
    if (obj.type === 'VIEW_FILE' && obj.content) {
      if (obj.content.includes('Navbar.jsx') && obj.content.includes('export default Navbar')) {
        // extract lines
        const match = obj.content.match(/Showing lines 1 to \d+\s+[\s\S]+?\n1: ([\s\S]+?)\n\n/);
        // Wait, parsing VIEW_FILE content directly might be tricky, let's keep it simple
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
}

if (navbarJsx) {
  // Clean up escaped content if it is stringified JSON
  let cleanJsx = navbarJsx;
  if (cleanJsx.startsWith('"') && cleanJsx.endsWith('"')) {
    cleanJsx = JSON.parse(cleanJsx);
  }
  fs.writeFileSync('src/components/Navbar.jsx', cleanJsx, 'utf8');
  console.log('Restored src/components/Navbar.jsx successfully.');
} else {
  console.log('Could not find Navbar.jsx write content in transcript. We will fallback to VIEW_FILE history extraction.');
}

if (navbarCss) {
  let cleanCss = navbarCss;
  if (cleanCss.startsWith('"') && cleanCss.endsWith('"')) {
    cleanCss = JSON.parse(cleanCss);
  }
  fs.writeFileSync('src/components/Navbar.css', cleanCss, 'utf8');
  console.log('Restored src/components/Navbar.css successfully.');
} else {
  console.log('Could not find Navbar.css write content in transcript.');
}
