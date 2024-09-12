import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { Plugin } from "vite";

export const convertJsonToJsPlugin: Plugin = {
    name: 'convert-json-to-js-plugin',
    enforce: 'pre',
    
    buildStart: {
      sequential: true,
      order: 'pre',
      handler: () => {
        // Compress tilemap.json
        const tilemapPath = resolve(__dirname, '../tiled/tilemap.json');
        const tilemap = JSON.parse(readFileSync(tilemapPath, 'utf8'));
  
        for (let i = 0; i < tilemap.layers.length; i++) {
          const layer = tilemap.layers[i];
          if (layer.data) {
            console.log(`Compressing layer ${layer.name}`);
            const compressedData: number[] = [];
            // use RLE to compress the data
            let currentTile = layer.data[0];
            let count = 1;
            for (let j = 1; j < layer.data.length; j++) {
              if (layer.data[j] === currentTile) {
                count++;
              } else {
                compressedData.push(count, currentTile);
                currentTile = layer.data[j];
                count = 1;
              }
            }
            compressedData.push(count, currentTile);
            tilemap.layers[i].data = compressedData;
          }
        }
  
        console.log("Convert tilemap.json to tilemap-rle.ts");
        const tilemapOutput = `
          const tilemapData = ${JSON.stringify(tilemap).replace(/"(\w+)":/g, '$1:')};
  
          for (let i = 0; i < tilemapData.layers.length; i++) {
            const layer = tilemapData.layers[i];
            if (layer.data) {
              const decompressedData = [];
              for (let j = 0; j < layer.data.length; j += 2) {
                const count = layer.data[j];
                const tile = layer.data[j + 1];
                for (let k = 0; k < count; k++) {
                  decompressedData.push(tile);
                }
              }
              tilemapData.layers[i].data = decompressedData;
            }
          }
  
          export { tilemapData };
        `;
  
        writeFileSync(resolve(__dirname, '../src/tilemap-rle.ts'), tilemapOutput);
  
        // Convert tileset.json to tileset.ts
        console.log("Convert tileset.json to tileset.ts");
        const tilesetPath = resolve(__dirname, '../tiled/tileset.json');
        const tileset = JSON.parse(readFileSync(tilesetPath, 'utf8'));
        const tilesetOutput = `export const tilesetData = ${JSON.stringify(tileset).replace(/"(\w+)":/g, '$1:')}`;
        writeFileSync(resolve(__dirname, '../src/tileset.ts'), tilesetOutput);
  
        // Convert sprite-sheet.json to sprite-sheet.ts
        console.log("Convert sprite-sheet.json to sprite-sheet.ts");
        const spriteSheetPath = resolve(__dirname, '../aseprite/sprite-sheet.json');
        const spriteSheet = JSON.parse(readFileSync(spriteSheetPath, 'utf8'));
        const spriteSheetOutput = `export const spriteSheetData = ${JSON.stringify(spriteSheet).replace(/"(\w+)":/g, '$1:')}`;
        writeFileSync(resolve(__dirname, '../src/sprite-sheet.ts'), spriteSheetOutput);
      }
    }
  };

