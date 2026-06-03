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
        if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
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
        const match = obj.content.match(/Showing lines 1 to \d+\s+[\s\S]+?\n1: ([\s\S]+?)\n\n/);
        // Let's parse the VIEW_FILE output format: "1: line1\n2: line2\n"
        const contentBody = obj.content.split('Showing lines')[1];
        if (contentBody) {
          const rawLines = contentBody.split('\n');
          const cleanLines = [];
          for (const rl of rawLines) {
            const m = rl.match(/^\d+: (.*)/);
            if (m) {
              cleanLines.push(m[1]);
            }
          }
          if (cleanLines.length > 0) {
            navbarJsx = cleanLines.join('\n');
          }
        }
      }
      
      if (obj.content.includes('Navbar.css') && obj.content.includes('.navbar')) {
        const contentBody = obj.content.split('Showing lines')[1];
        if (contentBody) {
          const rawLines = contentBody.split('\n');
          const cleanLines = [];
          for (const rl of rawLines) {
            const m = rl.match(/^\d+: (.*)/);
            if (m) {
              cleanLines.push(m[1]);
            }
          }
          if (cleanLines.length > 0) {
            navbarCss = cleanLines.join('\n');
          }
        }
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
}

if (navbarJsx) {
  let cleanJsx = navbarJsx;
  if (cleanJsx.startsWith('"') && cleanJsx.endsWith('"')) {
    cleanJsx = JSON.parse(cleanJsx);
  }
  fs.writeFileSync('src/components/Navbar.jsx', cleanJsx, 'utf8');
  console.log('Restored src/components/Navbar.jsx successfully.');
} else {
  console.log('Could not find Navbar.jsx in transcript.');
}

if (navbarCss) {
  let cleanCss = navbarCss;
  if (cleanCss.startsWith('"') && cleanCss.endsWith('"')) {
    cleanCss = JSON.parse(cleanCss);
  }
  fs.writeFileSync('src/components/Navbar.css', cleanCss, 'utf8');
  console.log('Restored src/components/Navbar.css successfully.');
} else {
  console.log('Could not find Navbar.css in transcript.');
}
