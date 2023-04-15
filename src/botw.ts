import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Layer } from "./common/Layer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function iconUrl(iconName: string) {
    return `${import.meta.env.BASE_URL}botw/icons/${iconName}.png`;
  }

  const map = ZDMap.create("botw", 24000, 750, {
    center: [-3750, -1900],
  });
  const mapLayer = map.addMapLayer();
  map.addControls(["Master Mode", "DLC"]);
  map.addLegend([
    {
      name: "Sheikah Tower",
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
      name: "Tech Lab",
      iconUrl: iconUrl("lab"),
      iconWidth: 31,
      iconHeight: 25,
    },
    {
      name: "Korok Seed",
      iconUrl: iconUrl("seed"),
      iconWidth: 30,
      iconHeight: 28,
    },
    {
      name: "Main Quest",
      iconUrl: iconUrl("mainquest"),
      iconWidth: 50,
      iconHeight: 30,
    },
    {
      name: "Shrine Quest",
      iconUrl: iconUrl("shrinequest"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Side Quest",
      iconUrl: iconUrl("sidequest"),
      iconWidth: 30,
      iconHeight: 23,
    },
    {
      name: "Memory",
      iconUrl: iconUrl("memory"),
      iconWidth: 30,
      iconHeight: 28,
    },
    {
      name: "Quest Objective",
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
      name: "Inn",
      iconUrl: iconUrl("inn"),
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
      name: "Armor Shop",
      iconUrl: iconUrl("armor"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Dye Shop",
      iconUrl: iconUrl("dye"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Jewelry Shop",
      iconUrl: iconUrl("jewelry"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Settlement",
      iconUrl: iconUrl("settlement"),
      iconWidth: 27,
      iconHeight: 27,
    },
    {
      name: "Great Fairy",
      iconUrl: iconUrl("fountain"),
      iconWidth: 29,
      iconHeight: 29,
    },
    {
      name: "Goddess Statue",
      iconUrl: iconUrl("statue"),
      iconWidth: 24,
      iconHeight: 30,
    },
    {
      name: "Cooking Pot",
      iconUrl: iconUrl("pot"),
      iconWidth: 30,
      iconHeight: 27,
    },
    {
      name: "Raft",
      iconUrl: iconUrl("raft"),
      iconWidth: 27,
      iconHeight: 30,
    },
    {
      name: "Stone Talus",
      iconUrl: iconUrl("talus"),
      iconWidth: 26,
      iconHeight: 30,
    },
    {
      name: "Hinox",
      iconUrl: iconUrl("hinox"),
      iconWidth: 30,
      iconHeight: 30,
    },
    {
      name: "Lynel",
      iconUrl: iconUrl("lynel"),
      iconWidth: 29,
      iconHeight: 30,
    },
    {
      name: "Molduga",
      iconUrl: iconUrl("molduga"),
      iconWidth: 29,
      iconHeight: 30,
    },
    {
      name: "Guardian",
      iconUrl: iconUrl("guardian"),
      iconWidth: 32,
      iconHeight: 28,
    },
    {
      name: "Treasure",
      iconUrl: iconUrl("treasure"),
      iconWidth: 30,
      iconHeight: 26,
    },
  ]);

  function addJson(categories: Schema.Category[]): void {
    for (const category of categories) {
      mapLayer.addCategory(
        category.name,
        category.layers.map((l) =>
          Layer.fromJSON(l, category.source, "botw", map.wiki)
        )
      );
    }
  }

  const locations = fetch(
    `${import.meta.env.BASE_URL}botw/markers/locations.json`
  )
    .then((r) => r.json())
    .then(addJson);
  const pins = fetch(`${import.meta.env.BASE_URL}botw/markers/pins.json`)
    .then((r) => r.json())
    .then(addJson);
  const seeds = fetch(`${import.meta.env.BASE_URL}botw/markers/seeds.json`)
    .then((r) => r.json())
    .then((categories: Schema.Category[]) => {
      // took some shortcuts to reduce file size, gotta fix them
      const layer = categories[0].layers[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layer.markers = layer.markers.map((m: any) => {
        return {
          coords: m.coords[0],
          id: m.id,
          name: categories[0].name,
          link: `${m.loc}#${m.id}`,
          path: m.coords.length > 1 ? m.coords : undefined,
        };
      });
      addJson(categories);
    });
  const treasures = fetch(
    `${import.meta.env.BASE_URL}botw/markers/treasures.json`
  )
    .then((r) => r.json())
    .then(addJson);
  const wiki = fetch(`${import.meta.env.BASE_URL}botw/markers/wiki.json`)
    .then((r) => r.json())
    .then(addJson);
  await Promise.allSettled([locations, pins, seeds, treasures, wiki]);

  await map.initializeWikiConnector();
};
