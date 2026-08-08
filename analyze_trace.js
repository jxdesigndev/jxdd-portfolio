const fs = require('fs');

const trace = JSON.parse(fs.readFileSync('trace.json', 'utf8'));

let mainThreadEvents = [];
let totalTime = 0;

// Tracing events have 'cat', 'name', 'dur', 'args'
// We want to sum 'dur' (microseconds) by event name on the Renderer Main Thread
const summary = {};

trace.traceEvents.forEach(e => {
  if (e.ph === 'X' || e.ph === 'B' || e.ph === 'E') {
     // A lot of Chrome tracing events use X for complete events, or B/E for begin/end
     if (e.ph === 'X' && e.dur) {
        if (!summary[e.name]) summary[e.name] = 0;
        summary[e.name] += e.dur;
        totalTime += e.dur;
     }
  }
});

const sorted = Object.entries(summary)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

console.log("Top 15 time-consuming event types in trace (ms):");
sorted.forEach(([name, dur]) => {
  console.log(`- ${name}: ${(dur / 1000).toFixed(2)} ms`);
});
