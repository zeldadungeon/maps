/*
  Combines the multitude of Tears of the Kingdom data JSON files into a single minified file per type per layer.
  Types:
   * "markers": Icon or text markers that appear on the map by default and are accessed through the Filter control.
    These can be associated with user completion data and need to be loaded before the Wiki connector loads completion data.
   * "objects": Other objects that might be worth finding but would clutter the map if given an icon.
    These are loaded last and are accessed through the Sensor/Compendium control.
  Inputs are json files under public/totk/markers, listed explicitly in this file.
  Outputs minified file to the same directory as the inputs.
  Also generates src/totk-data-files.json which includes the hashes of the outputs,
    which is referenced by totk.ts to help with cache invalidation.
*/

/* eslint-disable */
const crypto = require("crypto");
const fs = require("fs");
/* eslint-enable */

const markersRoot = "public/totk/markers/";
const inputs = {
  markers: {
    depths: [
      "caves.json",
      "chests.json",
      "dispensers.json",
      "labels.json",
      "locations.json",
      "othermarkers.json",
      "services.json",
      "tgates.json",
    ],
    surface: [
      "caves.json",
      "chests.json",
      "dispensers.json",
      "koroks.json",
      "labels.json",
      "merchants.json",
      "othermarkers.json",
      "quests.json",
      "services.json",
      "tgates.json",
    ],
    sky: [
      "caves.json",
      "chests.json",
      "dispensers.json",
      "koroks.json",
      "labels.json",
      "othermarkers.json",
      "quests.json",
      "services.json",
      "tgates.json",
    ],
  },
  objects: {
    depths: [
      "creatures.json",
      "materials.json",
      "monsters.json",
      "treasure.json",
    ],
    surface: [
      "creatures.json",
      "materials.json",
      "monsters.json",
      "treasure.json",
    ],
    sky: ["creatures.json", "materials.json", "monsters.json", "treasure.json"],
  },
};
const outputs = {};

function pack(type, layer, inputs) {
  const arr = [];
  for (const input of inputs) {
    arr.push(...JSON.parse(fs.readFileSync(`${markersRoot}${layer}/${input}`)));
  }

  const outputString = JSON.stringify(arr);
  fs.writeFileSync(`${markersRoot}${layer}/${type}.json`, outputString);
  const hashDigest = crypto
    .createHash("md5")
    .update(outputString)
    .digest("hex")
    .substring(0, 8);

  outputs[type] ||= {};
  outputs[type][layer] = `${layer}/${type}.json?${hashDigest}`;
}

for (const [inputType, inputLayers] of Object.entries(inputs)) {
  for (const [inputLayer, inputFiles] of Object.entries(inputLayers)) {
    pack(inputType, inputLayer, inputFiles);
  }
}

fs.writeFileSync("src/totk-data-files.json", JSON.stringify(outputs, null, 2));
