import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Layer } from "./common/Layer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function iconUrl(iconName: string) {
    return `${import.meta.env.BASE_URL}la/icons/${iconName}.png`;
  }

  const map = ZDMap.create({
    directory: "la",
    gameTitle: "Link's Awakening",
    mapSizePixels: 3280,
    tileSizePixels: 205,
    center: [0, 0],
    zoom: 2,
  });
  const mapLayer = map.addMapLayer();
  map.addControls();
  map.addLegend([
    {
      name: "Piece of Heart",
      iconUrl: iconUrl("poh"),
      iconWidth: 24,
      iconHeight: 20,
    },
    {
      name: "Secret Seashell",
      iconUrl: iconUrl("shell"),
      iconWidth: 16,
      iconHeight: 28,
    },
    {
      name: "Shop",
      iconUrl: iconUrl("shop"),
      iconWidth: 19,
      iconHeight: 25,
    },
    {
      name: "House",
      iconUrl: iconUrl("house"),
      iconWidth: 30,
      iconHeight: 20,
    },
    {
      name: "Telephone Booth",
      iconUrl: iconUrl("hint"),
      iconWidth: 28,
      iconHeight: 20,
    },
    {
      name: "Dungeon",
      iconUrl: iconUrl("dungeon"),
      iconWidth: 30,
      iconHeight: 21,
    },
    {
      name: "Warp Point",
      iconUrl: iconUrl("warp"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Treasure",
      iconUrl: iconUrl("treasure"),
      iconWidth: 20,
      iconHeight: 21,
    },
  ]);

  function addJson(categories: Schema.Category[]): void {
    for (const category of categories) {
      mapLayer.addCategory(
        category.name,
        category.layers.map((l) =>
          Layer.fromJSON(
            l,
            category.name,
            category.link,
            category.source,
            "la",
            map.wiki
          )
        )
      );
    }
  }

  try {
    const pins = await fetch(`${import.meta.env.BASE_URL}la/markers/pins.json`);
    addJson(await pins.json());
  } catch (ex) {
    /* fail gracefully */
  }

  await map.initializeWikiConnector();
};
