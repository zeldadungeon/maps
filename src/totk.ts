import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Layer } from "./common/Layer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function iconUrl(iconName: string) {
    return `${import.meta.env.BASE_URL}botw/icons/${iconName}.png`;
  }

  const map = ZDMap.create({
    directory: "totk",
    wikiContributionPage: "Tears of the Kingdom",
    mapSizePixels: 24000,
    mapSizeCoords: 12000,
    tileSizePixels: 750,
    center: [-1875, -950],
  });
  const surface = map.addMapLayer("Surface", "surface");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sky = map.addMapLayer("Sky", "sky");
  map.addControls();
  map.addLegend([
    {
      name: "Tower",
      iconUrl: iconUrl("tower"),
      iconWidth: 28,
      iconHeight: 39,
    },
    {
      name: "Shrine",
      iconUrl: iconUrl("shrine"),
      iconWidth: 26,
      iconHeight: 27,
    },
    {
      name: "Malice Pit",
      iconUrl: iconUrl("objective"),
      iconWidth: 20,
      iconHeight: 20,
    },
    {
      name: "Stable",
      iconUrl: iconUrl("stable"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Village",
      iconUrl: iconUrl("village"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "General Store",
      iconUrl: iconUrl("store"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Cave",
      iconUrl: iconUrl("settlement"),
      iconWidth: 27,
      iconHeight: 27,
    },
  ]);

  function addJson(categories: Schema.Category[]): void {
    for (const category of categories) {
      surface.addCategory(
        category.name,
        category.layers.map((l) =>
          Layer.fromJSON(l, category.source, "totk", map.wiki)
        )
      );
    }
  }

  function addWiki(
    categoryName: string,
    wikiSubpage: string,
    infoSource: string,
    iconUrl: string,
    iconWidth: number,
    iconHeight: number
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
          const wikiRegex =
            /<div class="mw-parser-output"><p>([\s\S]*),\n?<\/p>\n?<!-- \nNewPP limit report/g;
          const res = wikiRegex.exec(markers);
          markers = res ? res[1] : "";
          const layer = `{
  "icon": {
      "url": "${iconUrl}.png",
      "width": ${iconWidth},
      "height": ${iconHeight}
  },
  "markers": [
    ${markers}
  ]
}`;
          surface.addCategory(categoryName, [
            Layer.fromJSON(JSON.parse(layer), infoSource, "totk", map.wiki),
          ]);
        })
        .catch((ex) => console.log(ex))
    );
  }

  await Promise.allSettled([
    fetch(`${import.meta.env.BASE_URL}botw/markers/locations.json`)
      .then((r) => r.json())
      .then(addJson),
    addWiki("Tower", "Towers", "summary", "tower", 28, 39),
    addWiki("Shrine", "Shrines", "summary", "shrine", 26, 27),
    addWiki("Malice Pit", "Malice Pits", "summary", "objective", 20, 20),
    addWiki("Village", "Villages", "summary", "village", 30, 30),
    addWiki("Stable", "Stables", "summary", "stable", 30, 30),
    addWiki("Shop", "Shops", "summary", "store", 30, 30),
    addWiki("Cave", "Caves", "summary", "settlement", 27, 27),
  ]);
};
