import { readFileSync, writeFileSync } from "fs";

const tilemap = JSON.parse(readFileSync("./src/tilemap.json", "utf8"));

for (let i = 0; i < tilemap.layers.length; i++) {
  const layer = tilemap.layers[i];
  if (layer.data) {
    console.log(`Compressing layer ${layer.name}`);
    const compressedData = [];
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

const output = `
  const tilemapData = ${JSON.stringify(tilemap)};

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

writeFileSync("./src/tilemap-rle.ts", output);
