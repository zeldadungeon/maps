import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { ZDMap, ZDMapOptions } from "./common/ZDMap";
import { ContributionMarkerHandler } from "./common/Handlers/ContributionMarkerHandler";
import { ICategory } from "./common/ICategory";
import { Layer } from "./common/Layer";
import { MapLayer } from "./common/MapLayer";

window.onload = async () => {
  function legendItem(
    name: string,
    iconName: string,
    iconWidth: number,
    iconHeight: number
  ): ICategory {
    if (iconName.slice(-3) !== "svg") {
      iconName += ".png";
    }

    return {
      name,
      iconUrl: `${import.meta.env.BASE_URL}eow/icons/${iconName}`,
      iconWidth,
      iconHeight,
    };
  }

  const options: ZDMapOptions = {
    directory: "eow",
    gameTitle: "Echoes of Wisdom",
    mapSizePixels: 7200,
    mapSizeCoords: 1272,
    tileSizePixels: 450,
    center: [0, 0],
  };

  const map = ZDMap.create(options);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const overworld = map.addMapLayer();

  map.addControls(
    ["User-Contributed"],
    [],
    [new ContributionMarkerHandler(map, options)]
  );

  map.addLegend([
    //legendItem("Still World Rift", "waypoint", 30, 30),
    //legendItem("Dungeon", "dungeon", 30, 21),
    legendItem("Cave", "cave", 32, 32),
    legendItem("House", "house", 32, 32),
    legendItem("Shop", "shop", 32, 32),
    legendItem("Smoothie Shop", "smoothie", 32, 32),
    legendItem("Minigame", "minigame", 32, 32),
    legendItem("Lueburry's House", "lueburry", 32, 32),
    legendItem("Dampé Studio", "dampe", 32, 32),
    legendItem("Great Fairy Shrine", "gf", 32, 32),

    legendItem("Waypoint", "waypoint", 28, 28),
    legendItem("Piece of Heart", "poh", 32, 32),
    legendItem("Might Crystal", "might", 32, 32),
    legendItem("Stamp", "stamp", 32, 32),

    //legendItem("Fairy Bottle", "treasure", 20, 21),
    //legendItem("Echo", "treasure", 20, 21),
    //legendItem("Clothing", "treasure", 20, 21),
    //legendItem("Ingredient", "treasure", 20, 21),
    //legendItem("Fairy", "treasure", 20, 21),
    //legendItem("Rupees", "treasure", 20, 21),

    legendItem("Main Quest", "mainquest", 25, 25),
    legendItem("Side Quest", "sidequest", 25, 25),
    legendItem("Main Quest Objective", "mainobjective", 32, 32),
    legendItem("Side Quest Objective", "sideobjective", 32, 32),

    //legendItem("Boss", "treasure", 20, 21),
  ]);

  function addJson(layer: MapLayer, path: string): Promise<void> {
    return fetch(`${import.meta.env.BASE_URL}eow/markers/${path}`)
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
                "eow",
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
            `Zelda Dungeon:Echoes of Wisdom Map/${wikiSubpage}`
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
                  "eow",
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

  await Promise.allSettled([
    addJson(overworld, "labels.json"),
    addJson(overworld, "items.json"),
    addWikiJson(overworld, "Overworld Categories"),
  ]);

  await map.initializeWikiConnector().catch((ex) => console.log(ex));
};
