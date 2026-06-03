const fs = require('fs');

const transcriptPath = 'C:\\Users\\Aditya hullule\\.gemini\\antigravity\\brain\\617cd41e-8d43-4ea0-90e5-75cb2e070b8d\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    let code = '';
    
    if (obj.tool_calls) {
      for (const call of obj.tool_calls) {
        if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          if (call.args.TargetFile && call.args.TargetFile.includes('App.jsx')) {
            code = call.args.CodeContent || call.args.ReplacementContent || '';
            if (code.includes('<Navbar')) {
              console.log(`Found <Navbar in tool_call at step ${obj.step_index}`);
            }
          }
        }
      }
    }
    
    if (obj.type === 'VIEW_FILE' && obj.content && obj.content.includes('App.jsx')) {
      if (obj.content.includes('<Navbar')) {
        console.log(`Found <Navbar in VIEW_FILE at step ${obj.step_index}`);
      }
    }
  } catch (e) {}
}
console.log('Search finished.');
