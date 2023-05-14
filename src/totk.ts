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
    iconHeight: number,
    group?: string
  ): ICategory {
    //Check if the group is defined
    if (group) {
      return {
        name,
        iconUrl: `${import.meta.env.BASE_URL}totk/icons/${iconName}.png`,
        iconWidth,
        iconHeight,
        group,
      };
    } else {
      return {
        name,
        iconUrl: `${import.meta.env.BASE_URL}totk/icons/${iconName}.png`,
        iconWidth,
        iconHeight,
      };
    }
  }

  const map = ZDMap.create({
    directory: "totk",
    wikiContributionPage: "Tears of the Kingdom",
    mapSizePixels: 36096,
    mapSizeCoords: 12032,
    tileSizePixels: 564,
    center: [-1220, 500],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sky = map.addMapLayer("Sky", "sky");
  const surface = map.addMapLayer("Surface", "surface");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const depths = map.addMapLayer("Depths", "depths");
  map.addControls();
  map.addLegend(
    [
      legendItem("Tower", "tower", 20, 26),
      legendItem("Shrine", "shrine", 27, 29),
      legendItem("Lightroot", "lightroot", 27, 24),
      legendItem("Tech Lab", "lab", 28, 24),
      legendItem("Device Dispenser", "dispenser", 36, 36),
    ],
    "Structures"
  );
  map.addLegend(
    [
      legendItem("Korok Seed", "korok", 27, 27),
      legendItem("Dragon Tear", "tear", 31, 36),
      legendItem("Zonai Relief", "relief", 27, 27),
    ],
    "Collectibles"
  );
  map.addLegend(
    [
      legendItem("Main Quest", "mainquest", 42, 25),
      legendItem("Shrine Quest", "shrinequest", 25, 29),
      legendItem("Side Quest", "sidequest", 27, 21),
      legendItem("Side Adventure", "adventure", 20, 24),
      legendItem("Quest Objective", "objective", 13, 13),
    ],
    "Quests"
  );

  map.addLegend(
    [
      legendItem("Stable", "stable", 29, 29),
      legendItem("Village", "village", 29, 29),
      legendItem("Inn", "inn", 29, 29),
      legendItem("General Store", "general", 29, 29),
      legendItem("Armor Shop", "armor", 29, 29),
      legendItem("Bargainer Statue", "bargainer", 29, 29),
      legendItem("Other Shops", "othershops", 29, 29),
      legendItem("Great Fairy", "fountain", 36, 36),
    ],
    "Locations"
  );
  map.addLegend(
    [
      legendItem("Chasm", "chasm", 25, 26),
      legendItem("Cave", "cave", 25, 26),
      legendItem("Well", "well", 25, 26),
    ],
    "Topology"
  );
  map.addLegend([legendItem("Treasure Chest", "treasure", 27, 21)], "Treasure");
  map.addLegend(
    [
      legendItem("Flux Construct", "skull", 36, 36),
      legendItem("Frox", "skull", 36, 36),
      legendItem("Gleeok", "skull", 36, 36),
      legendItem("Hinox", "skull", 36, 36),
      legendItem("Lynel", "lynel", 29, 30),
    ],
    "Bosses"
  );

  function addBotwJson(categories: Schema.Category[]): void {
    for (const category of categories) {
      if (category.name != "Subregion") {
        continue;
      }
      surface.addCategory(
        category.name,
        category.layers.map((l) => {
          // For markers imported from botw, cut the coordinates in half to match totk's coordinate system
          for (const m of l.markers) {
            m.coords[0] = Math.floor(m.coords[0] / 2);
            m.coords[1] = Math.floor(m.coords[1] / 2);
          }
          return Layer.fromJSON(l, category.source, "totk", map.wiki);
        })
      );
    }
  }

  function addJson(layer: MapLayer, path: string): Promise<void> {
    return fetch(`${import.meta.env.BASE_URL}totk/markers/${path}`)
      .then((r) => r.json())
      .then((categories: Schema.Category[]) => {
        for (const category of categories) {
          layer.addCategory(
            category.name,
            category.layers.map((l) =>
              Layer.fromJSON(l, category.source, "totk", map.wiki)
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
                Layer.fromJSON(l, category.source, "totk", map.wiki)
              )
            );
          }
        })
        .catch((ex) =>
          console.log(`Error parsing JSON from page: ${wikiSubpage}\n${ex}`)
        )
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
          const layer = `{
  "minZoom": ${minZoom},
  "icon": {
      "url": "${iconUrl}.png",
      "width": ${iconWidth},
      "height": ${iconHeight}
  },
  "markers": [
    ${markers}
  ]
}`;
          mapLayer.addCategory(categoryName, [
            Layer.fromJSON(JSON.parse(layer), infoSource, "totk", map.wiki),
          ]);
        })
        .catch((ex) =>
          console.log(`Error parsing JSON from page: ${wikiSubpage}\n${ex}`)
        )
    );
  }

  await Promise.allSettled([
    fetch(`${import.meta.env.BASE_URL}botw/markers/locations.json`)
      .then((r) => r.json())
      .then(addBotwJson)
      .catch((ex) => console.log(ex)),
    addJson(surface, "surface/seeds.json"),
    addJson(surface, "surface/locations.json"),
    addJson(surface, "surface/treasure.json"),
    addJson(sky, "sky/seeds.json"),
    addJson(sky, "sky/locations.json"),
    addJson(sky, "sky/treasure.json"),
    addJson(depths, "depths/locations.json"),
    addJson(depths, "depths/treasure.json"),
    addWikiJson(surface, "Surface Categories"),
    addWikiJson(sky, "Sky Categories"),
    addWikiJson(depths, "Depths Categories"),
    addWiki(surface, "Wiki", "Surface Markers", "temp", "flag", 25, 28, 2),
    addWiki(sky, "Wiki", "Sky Markers", "temp", "flag", 25, 28, 2),
    addWiki(depths, "Wiki", "Depths Markers", "temp", "flag", 25, 28, 2),
  ]);

  await map.initializeWikiConnector();
};
