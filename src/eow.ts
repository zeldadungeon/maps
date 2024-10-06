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
    legendItem("Waypoint", "waypoint", 30, 30),
    //legendItem("Still World Rift", "waypoint", 30, 30),
    legendItem("Dungeon", "dungeon", 30, 21),
    legendItem("Cave", "cave", 25, 26),
    legendItem("House", "house", 30, 20),
    legendItem("Shop", "shop", 19, 25),
    legendItem("Smoothie Shop", "shop", 19, 25),
    legendItem("Minigame", "minigame.svg", 30, 30),

    legendItem("Piece of Heart", "poh", 24, 20),
    legendItem("Might Crystal", "shell", 16, 28),
    legendItem("Stamp", "treasure", 20, 21),
    //legendItem("Fairy Bottle", "treasure", 20, 21),
    //legendItem("Echo", "treasure", 20, 21),

    //legendItem("Clothing", "treasure", 20, 21),
    //legendItem("Ingredient", "treasure", 20, 21),
    //legendItem("Fairy", "treasure", 20, 21),
    //legendItem("Rupees", "treasure", 20, 21),

    legendItem("Main Quest", "mainquest", 42, 25),
    legendItem("Side Quest", "sidequest", 27, 21),
    //legendItem("Boss", "treasure", 20, 21),
    // other important NPCs like Great Fairy, Machine Engineer
  ]);

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

  await addWikiJson(overworld, "Overworld Categories");

  await map.initializeWikiConnector().catch((ex) => console.log(ex));
};
