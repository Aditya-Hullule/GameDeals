const fs = require('fs');

const transcriptPath = 'C:\\Users\\Aditya hullule\\.gemini\\antigravity\\brain\\617cd41e-8d43-4ea0-90e5-75cb2e070b8d\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

const seen = new Set();

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    let code = '';
    let from = '';
    
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          if (call.args.TargetFile && call.args.TargetFile.includes('Navbar.jsx')) {
            code = call.args.CodeContent || call.args.ReplacementContent || '';
            from = `tool_call in step ${obj.step_index}`;
          }
        }
      }
    }
    
    if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('Navbar.jsx')) {
      code = obj.content;
      from = `VIEW_FILE in step ${obj.step_index}`;
    }
    
    if (code) {
      const hash = code.length + '_' + code.substring(0, 30);
      if (!seen.has(hash)) {
        seen.add(hash);
        console.log(`--- Navbar version from ${from} ---`);
        console.log(code.substring(0, 500));
        console.log('---------------------------------\n');
      }
    }
  } catch (e) {}
}
