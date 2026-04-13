
const fs = require('fs');
const path = require('path');

const ANIMATIONS_DIR = path.join(__dirname, '../src/assets/animations');

// Keywords to identify background layers
const BG_KEYWORDS = ['background', 'bg', 'solid', 'bg layer', 'background layer'];

function removeBackgrounds() {
    if (!fs.existsSync(ANIMATIONS_DIR)) {
        console.error(`Directory not found: ${ANIMATIONS_DIR}`);
        return;
    }

    const files = fs.readdirSync(ANIMATIONS_DIR).filter(file => file.endsWith('.json'));

    files.forEach(file => {
        const filePath = path.join(ANIMATIONS_DIR, file);
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(content);

            if (!json.layers) {
                console.log(`Skipping ${file}: No layers found.`);
                return;
            }

            const initialLayerCount = json.layers.length;

            // Filter out layers that look like backgrounds
            json.layers = json.layers.filter(layer => {
                const name = (layer.nm || '').toLowerCase();

                // Check if name contains "background" or "bg"
                const isBgName = BG_KEYWORDS.some(keyword => name.includes(keyword));

                // Check if it's a solid color layer (ty === 1) that matches canvas size (w, h)
                // This is a common way backgrounds are added
                const isSolidBg = layer.ty === 1 && layer.sw === json.w && layer.sh === json.h;

                if (isBgName || isSolidBg) {
                    console.log(`[${file}] Removing layer: "${layer.nm}" (Type: ${layer.ty})`);
                    return false; // Remove
                }
                return true; // Keep
            });

            if (json.layers.length < initialLayerCount) {
                fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
                console.log(`✅ Cleaned ${file}`);
            } else {
                console.log(`- ${file}: No background layers detected.`);
            }

        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    });
}

removeBackgrounds();
