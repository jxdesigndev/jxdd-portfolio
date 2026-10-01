const fs = require('fs');
const data = JSON.parse(fs.readFileSync('comprehensive_audit_results.json'));

console.log('--- INTERACTIVE ELEMENTS ---');
for (const page in data.sectionA) {
    console.log(`\nPage: ${page}`);
    data.sectionA[page].forEach(el => {
        console.log(`- ${el.element}: cursor=${el.cursor}, bg=${el.backgroundColor}, width=${el.width}, height=${el.height}`);
    });
}

console.log('\n--- SPACING & RHYTHM ---');
for (const page in data.sectionD) {
    console.log(`\nPage: ${page}`);
    data.sectionD[page].forEach(el => {
        console.log(`- ${el.element}: marginTop=${el.marginTop}, marginBottom=${el.marginBottom}, paddingTop=${el.paddingTop}, paddingBottom=${el.paddingBottom}`);
    });
}
