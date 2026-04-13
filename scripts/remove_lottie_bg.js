const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.error("Please provide a file path");
    process.exit(1);
}

const absPath = path.resolve(filePath);
console.log(`Processing: ${absPath}`);

try {
    const content = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    let modified = false;

    function cleanLayers(layers) {
        if (!layers) return;
        for (let i = layers.length - 1; i >= 0; i--) {
            const layer = layers[i];
            let remove = false;

            // Heuristic 1: Name contains "background" or "bg"
            if (layer.nm && (layer.nm.toLowerCase().includes('background') || layer.nm.toLowerCase() === 'bg')) {
                remove = true;
            }

            // Heuristic 2: Solid Layer (ty=1) that is large
            if (layer.ty === 1) {
                // If it's a solid layer, it's likely a background in this context
                // especially if it's at the bottom (checked by iteration order? Lottie renders bottom-up?)
                // Actually Lottie layers array: index 0 is TOP. Last index is BOTTOM.
                // But the loop is iterating backwards? i.e. from BOTTOM up.
                // So the first layers we check here are the bottom-most.
                remove = true;
            }

            if (remove) {
                console.log(`Removing layer: ${layer.nm} (Type: ${layer.ty})`);
                layers.splice(i, 1);
                modified = true;
            }
        }
    }

    if (content.layers) cleanLayers(content.layers);
    if (content.assets) {
        content.assets.forEach(asset => {
            if (asset.layers) cleanLayers(asset.layers);
        });
    }

    if (modified) {
        fs.writeFileSync(absPath, JSON.stringify(content));
        console.log("Successfully removed background layers.");
    } else {
        console.log("No background layers found.");
    }

} catch (e) {
    console.error("Error processing file:", e);
    process.exit(1);
}
