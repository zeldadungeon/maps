import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { ICategory } from "./common/ICategory";
import { Layer } from "./common/Layer";
import { MapLayer } from "./common/MapLayer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function legendItem(
    name: string,
    iconName: string,
    iconWidth: number,
    iconHeight: number
  ): ICategory {
    return {
      name,
      iconUrl: `${import.meta.env.BASE_URL}totk/icons/${iconName}.png`,
      iconWidth,
      iconHeight,
    };
  }

  const map = ZDMap.create({
    directory: "totk",
    gameTitle: "Tears of the Kingdom",
    mapSizePixels: 36096,
    mapSizeCoords: 12032,
    tileSizePixels: 564,
    center: [101, -255],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sky = map.addMapLayer("Sky", "sky", "sky-selected", false);
  const surface = map.addMapLayer(
    "Surface",
    "surface",
    "surface-selected",
    true
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const depths = map.addMapLayer("Depths", "depths", "depths-selected", false);
  map.addControls(["User-Contributed", "Paths"]);
  map.addLegend([
    legendItem("Skyview Tower", "tower", 20, 26),
    legendItem("Shrine of Light", "shrine", 27, 29),
    legendItem("Lightroot", "lightroot", 27, 24),
    legendItem("Tech Lab", "lab", 28, 24),
    legendItem("Korok Seed", "korok", 27, 27),
    legendItem("Dragon Tear", "tear", 31, 36),
    legendItem("Device Dispenser", "dispenser", 36, 36),
    legendItem("Main Quest", "mainquest", 42, 25),
    legendItem("Shrine Quest", "shrinequest", 25, 29),
    legendItem("Side Quest", "sidequest", 27, 21),
    legendItem("Side Adventure", "adventure", 20, 24),
    legendItem("Memory", "memory", 25, 23),
    legendItem("Quest Objective", "objective", 13, 13),
    legendItem("Zonai Relief", "relief", 27, 27),
    legendItem("Stable", "stable", 29, 29),
    legendItem("Village", "village", 29, 29),
    legendItem("Inn", "inn", 29, 29),
    legendItem("General Store", "general", 29, 29),
    legendItem("Armor Shop", "armor", 29, 29),
    legendItem("Bargainer Statue", "bargainer", 29, 29),
    legendItem("Other Shops", "othershops", 29, 29),
    legendItem("Great Fairy", "fountain", 36, 36),
    legendItem("Chasm", "chasm", 25, 26),
    legendItem("Cave", "cave", 25, 26),
    legendItem("Well", "well", 25, 26),
    legendItem("Treasure Chest", "treasure", 27, 21),
    legendItem("Goddess Statue", "statue", 36, 36),
    legendItem("Cooking Pot", "pot", 36, 36),
    legendItem("Hudson Sign", "hudsonsign", 24, 24),
    legendItem("Flux Construct", "square", 36, 36),
    legendItem("Hinox", "skull", 36, 36),
    legendItem("Stone Talus", "ore", 36, 36),
    legendItem("Frox", "skull", 36, 36),
    legendItem("Gleeok", "gleeok", 30, 30),
    legendItem("Lynel", "lynel", 29, 30),
    legendItem("Molduga", "skull", 36, 36),
    legendItem("Gloom Hands", "skull", 36, 36),
  ]);

  function addJson(layer: MapLayer, path: string): Promise<void> {
    return fetch(`${import.meta.env.BASE_URL}totk/markers/${path}`)
      .then((r) => r.json())
      .then((categories: Schema.Category[]) => {
        for (const category of categories) {
          layer.addCategory(
            category.name,
            category.layers.map((l) =>
              Layer.fromJSON(
                l,
                category.name,
                category.link,
                category.source,
                "totk",
                map.wiki
              )
            )
          );
        }
      })
      .catch((ex) => console.log(ex));
  }

  function addWikiJson(mapLayer: MapLayer, wikiSubpage: string): Promise<void> {
    return (
      map.wiki
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query<any>(
          `action=query&prop=revisions&titles=${encodeURIComponent(
            `Zelda Dungeon:Tears of the Kingdom Map/${wikiSubpage}`
          )}&rvslots=main&rvprop=content&formatversion=2`
        )
        .then((result) => {
          const content = <string>(
            result.query.pages[0].revisions[0].slots.main.content
          );
          const categories: Schema.Category[] = JSON.parse(content);
          for (const category of categories) {
            mapLayer.addCategory(
              category.name,
              category.layers.map((l) =>
                Layer.fromJSON(
                  l,
                  category.name,
                  category.link,
                  category.source,
                  "totk",
                  map.wiki
                )
              )
            );
          }
        })
        .catch((ex) => {
          map.showNotification(
            `User-contributed markers from ${wikiSubpage} were unable to load due to a formatting error.`
          );
          console.log(`Error parsing JSON from page: ${wikiSubpage}\n${ex}`);
        })
    );
  }

  function addWiki(
    mapLayer: MapLayer,
    categoryName: string,
    wikiSubpage: string,
    infoSource: string,
    iconUrl: string,
    iconWidth: number,
    iconHeight: number,
    minZoom: number
  ): Promise<void> {
    const ctrs: { [key: string]: number } = {};
    return (
      map.wiki
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .query<any>(
          `action=parse&page=${encodeURIComponent(
            `Zelda Dungeon:Tears of the Kingdom Map/${wikiSubpage}`
          )}`
        )
        .then((result) => {
          let markers = <string>result.parse.text["*"];
          const wikiRegex = /<p>([\s\S]*),\n?<\/p>/g;
          const res = wikiRegex.exec(markers);
          markers = res ? res[1] : "";
          const layer: Schema.Layer = JSON.parse(`{
  "minZoom": ${minZoom},
  "icon": {
      "url": "${iconUrl}.png",
      "width": ${iconWidth},
      "height": ${iconHeight}
  },
  "markers": [
    ${markers}
  ]
}`);
          layer.markers.forEach((m) => {
            m.tags = ["User-Contributed"];
            if (ctrs[m.id] == undefined) {
              ctrs[m.id] = 1;
            } else {
              m.id = `${m.id}_${ctrs[m.id]++}`;
            }
          });

          mapLayer.addCategory(categoryName, [
            Layer.fromJSON(
              layer,
              categoryName,
              undefined,
              infoSource,
              "totk",
              map.wiki
            ),
          ]);
        })
        .catch((ex) => {
          map.showNotification(
            `User-contributed markers from ${wikiSubpage} were unable to load due to a formatting error.`
          );
          console.log(`Error parsing JSON from page: ${wikiSubpage}\n${ex}`);
        })
    );
  }

  await Promise.allSettled([
    addJson(surface, "surface/seeds.json"),
    addJson(surface, "surface/locations.json"),
    addJson(surface, "surface/treasure.json"),
    addJson(surface, "surface/objects.json"),
    addJson(sky, "sky/seeds.json"),
    addJson(sky, "sky/locations.json"),
    addJson(sky, "sky/treasure.json"),
    addJson(sky, "sky/objects.json"),
    addJson(depths, "depths/locations.json"),
    addJson(depths, "depths/treasure.json"),
    addJson(depths, "depths/objects.json"),
    addWikiJson(surface, "Surface Categories"),
    addWikiJson(sky, "Sky Categories"),
    addWikiJson(depths, "Depths Categories"),
    addWiki(surface, "Wiki", "Surface Markers", "temp", "flag", 25, 28, 2),
    addWiki(sky, "Wiki", "Sky Markers", "temp", "flag", 25, 28, 2),
    addWiki(depths, "Wiki", "Depths Markers", "temp", "flag", 25, 28, 2),
  ]);

  await map.initializeWikiConnector();
};
