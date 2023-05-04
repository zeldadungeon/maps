import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Layer } from "./common/Layer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function iconUrl(iconName: string) {
    return `${import.meta.env.BASE_URL}totk/icons/${iconName}.png`;
  }

  const map = ZDMap.create({
    directory: "totk",
    wikiContributionPage: "Tears of the Kingdom",
    mapSizePixels: 36096,
    mapSizeCoords: 12000,
    tileSizePixels: 564,
    maxZoom: 4, // TODO remove once zoom 5-6 tiles are done
    center: [-1220, 500],
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sky = map.addMapLayer("Sky", "sky");
  const surface = map.addMapLayer("Surface", "surface");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const underground = map.addMapLayer("[spoiler]", "underground");
  map.addControls();
  map.addLegend([
    {
      name: "Tower",
      iconUrl: iconUrl("tower"),
      iconWidth: 31,
      iconHeight: 38,
    },
    {
      name: "Shrine",
      iconUrl: iconUrl("shrine"),
      iconWidth: 27,
      iconHeight: 29,
    },
    {
      name: "Lab",
      iconUrl: iconUrl("lab"),
      iconWidth: 39,
      iconHeight: 35,
    },
    {
      name: "Recycle Box",
      iconUrl: iconUrl("recycle"),
      iconWidth: 22,
      iconHeight: 22,
    },
    {
      name: "Dragon Tear",
      iconUrl: iconUrl("tear"),
      iconWidth: 31,
      iconHeight: 36,
    },
    {
      name: "Korok Seeds",
      iconUrl: iconUrl("korok"),
      iconWidth: 36,
      iconHeight: 28,
    },
    {
      name: "Great Fairy",
      iconUrl: iconUrl("fountain"),
      iconWidth: 36,
      iconHeight: 36,
    },
    {
      name: "Malice Pit",
      iconUrl: iconUrl("objective"),
      iconWidth: 21,
      iconHeight: 21,
    },
    {
      name: "Village",
      iconUrl: iconUrl("village"),
      iconWidth: 21,
      iconHeight: 21,
    },
    {
      name: "Inn",
      iconUrl: iconUrl("inn"),
      iconWidth: 21,
      iconHeight: 21,
    },
    {
      name: "Evil Shop",
      iconUrl: iconUrl("evil"),
      iconWidth: 21,
      iconHeight: 21,
    },
    {
      name: "Cave",
      iconUrl: iconUrl("cave"),
      iconWidth: 20,
      iconHeight: 20,
    },
    {
      name: "Zonai Relief",
      iconUrl: iconUrl("relief"),
      iconWidth: 15,
      iconHeight: 17,
    },
  ]);

  function addJson(categories: Schema.Category[]): void {
    for (const category of categories) {
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
          const wikiRegex = /<p>([\s\S]*),\n?<\/p>/g;
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
      .then(addJson)
      .catch((ex) => console.log(ex)),
    addWiki("Tower", "Towers", "summary", "tower", 31, 38),
    addWiki("Shrine", "Shrines", "summary", "shrine", 27, 29),
    addWiki("Malice Pit", "Malice Pits", "summary", "objective", 20, 20),
    addWiki("Village", "Villages", "summary", "village", 21, 21),
    addWiki("Stable", "Stables", "summary", "stable", 30, 30),
    addWiki("Shop", "Shops", "summary", "store", 30, 30),
    addWiki("Cave", "Caves", "summary", "settlement", 27, 27),
  ]);
};
