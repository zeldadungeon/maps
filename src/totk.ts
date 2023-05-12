import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Layer } from "./common/Layer";
import { MapLayer } from "./common/MapLayer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function iconUrl(iconName: string) {
    return `${import.meta.env.BASE_URL}totk/icons/${iconName}.png`;
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
  map.addLegend([
    {
      name: "Tower",
      iconUrl: iconUrl("tower"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Shrine",
      iconUrl: iconUrl("shrine"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Lightroot",
      iconUrl: iconUrl("lightroot"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Tech Lab",
      iconUrl: iconUrl("lab"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Korok Seed",
      iconUrl: iconUrl("korok"),
      iconWidth: 27,
      iconHeight: 27,
    },
    {
      name: "Dragon Tear",
      iconUrl: iconUrl("tear"),
      iconWidth: 31,
      iconHeight: 36,
    },
    {
      name: "Dispenser",
      iconUrl: iconUrl("dispenser"),
      iconWidth: 36,
      iconHeight: 36,
    },
    {
      name: "Zonai Relief",
      iconUrl: iconUrl("relief"),
      iconWidth: 27,
      iconHeight: 27,
    },
    {
      name: "Stable",
      iconUrl: iconUrl("stable"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Village",
      iconUrl: iconUrl("village"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Inn",
      iconUrl: iconUrl("inn"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "General Store",
      iconUrl: iconUrl("general"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Armor Shop",
      iconUrl: iconUrl("armor"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Jewelry Shop",
      iconUrl: iconUrl("jewelry"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Dye Shop",
      iconUrl: iconUrl("dye"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Great Fairy",
      iconUrl: iconUrl("fountain"),
      iconWidth: 36,
      iconHeight: 36,
    },
    {
      name: "Chasm",
      iconUrl: iconUrl("chasm"),
      iconWidth: 25,
      iconHeight: 26,
    },
    {
      name: "Cave",
      iconUrl: iconUrl("cave"),
      iconWidth: 25,
      iconHeight: 26,
    },
    {
      name: "Well",
      iconUrl: iconUrl("well"),
      iconWidth: 25,
      iconHeight: 26,
    },
    {
      name: "Treasure Chest",
      iconUrl: iconUrl("treasure"),
      iconWidth: 27,
      iconHeight: 21,
    },
  ]);

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
        .catch((ex) => console.log(ex))
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
    addWiki(surface, "Wiki", "Surface Markers", "temp", "flag", 25, 28, 2),
    addWiki(sky, "Wiki", "Sky Markers", "temp", "flag", 25, 28, 2),
    addWiki(depths, "Wiki", "Depths Markers", "temp", "flag", 25, 28, 2),
  ]);

  await map.initializeWikiConnector();
};
