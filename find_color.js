const L_bg = 0.003076; // exact-ish luminance of (10, 10, 12)
const targetL = 4.5 * (L_bg + 0.05) - 0.05;

function getLuminance(r, g, b) {
    let a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

console.log('Target Luminance:', targetL);

// We want a color with RGB proportional to (88, 88, 112)
// That means B = R * (112/88) = R * 1.2727
for (let r = 88; r <= 255; r++) {
    let g = r;
    let b = Math.min(255, Math.round(r * (112/88)));
    
    let L = getLuminance(r, g, b);
    if (L >= targetL) {
        console.log(`Found: rgb(${r}, ${g}, ${b}) -> Hex: #${r.toString(16)}${g.toString(16)}${b.toString(16)} (L=${L})`);
        console.log(`Contrast Ratio: ${(L + 0.05) / (getLuminance(10, 10, 12) + 0.05)}`);
        break;
    }
}
