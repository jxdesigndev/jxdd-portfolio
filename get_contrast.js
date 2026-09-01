const fs = require('fs');
const data = JSON.parse(fs.readFileSync('comprehensive_audit_results.json'));

function getLuminance(r, g, b) {
    let a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function parseRGB(color) {
    if (color.startsWith('rgba')) {
        let parts = color.substring(5, color.length - 1).split(',');
        return parts.slice(0,3).map(n => parseInt(n.trim(), 10));
    } else if (color.startsWith('rgb')) {
        let parts = color.substring(4, color.length - 1).split(',');
        return parts.map(n => parseInt(n.trim(), 10));
    }
    return [0,0,0];
}

function getContrastRatio(color1, color2) {
    const rgb1 = parseRGB(color1);
    const rgb2 = parseRGB(color2);
    const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

// Hardcode background to main dark theme bg color
const bgColor = 'rgb(10, 10, 12)';
console.log('Global Background Color:', bgColor);

console.log('Contrast Ratios:');
for (const page in data.sectionB) {
    const elements = data.sectionB[page];
    console.log(`\nPage: ${page}`);
    elements.forEach(el => {
        if (!el.color) return;
        const ratio = getContrastRatio(el.color, bgColor);
        console.log(`- ${el.element} (${el.color}): ${ratio.toFixed(2)}:1`);
    });
}
