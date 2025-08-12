import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { ICategory } from "./common/ICategory";
import { Layer } from "./common/Layer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  function legendItem(
    name: string,
    iconName: string,
    iconWidth: number,
    iconHeight: number,
    group?: string
  ): ICategory {
    //Check if svg exists
    if (iconName.slice(-3) == "svg") {
      return {
        name,
        iconUrl: `${import.meta.env.BASE_URL}botw/icons/${iconName}`,
        iconWidth,
        iconHeight,
        group,
      };
    }
    return {
      name,
      iconUrl: `${import.meta.env.BASE_URL}botw/icons/${iconName}.png`,
      iconWidth,
      iconHeight,
      group,
    };
  }

  const map = ZDMap.create({
    directory: "botw",
    gameTitle: "Breath of the Wild",
    mapSizePixels: 24000,
    tileSizePixels: 750,
    center: [-3750, -1900],
  });
  const mapLayer = map.addMapLayer();
  map.addControls(["Paths", "Master Mode", "DLC"]);
  map.addLegend(
    [
      legendItem("Sheikah Tower", "tower", 28, 39),
      legendItem("Shrine", "shrine", 26, 27),
      legendItem("Tech Lab", "lab", 31, 25),
    ],
    "Travel Gates"
  );
  map.addLegend(
    [
      legendItem("Main Quest", "mainquest", 35, 23),
      legendItem("Shrine Quest", "shrinequest", 30, 30),
      legendItem("Side Quest", "sidequest", 30, 23),
      legendItem("Memory", "memory", 30, 28),
      legendItem("Quest Objective", "objective", 20, 20),
      // legendItem("Korok Seed", "seed", 30, 28),
    ],
    "Quests"
  );
  map.addLegend(
    [
      legendItem("Akkala", "seed", 30, 28),
      legendItem("Central", "seed", 30, 28),
      legendItem("Dueling Peaks", "seed", 30, 28),
      legendItem("Eldin", "seed", 30, 28),
      legendItem("Faron", "seed", 30, 28),
      legendItem("Gerudo", "seed", 30, 28),
      legendItem("Great Plateau", "seed", 30, 28),
      legendItem("Hateno", "seed", 30, 28),
      legendItem("Hebra", "seed", 30, 28),
      legendItem("Hyrule Castle", "seed", 30, 28),
      legendItem("Lake", "seed", 30, 28),
      legendItem("Lanayru", "seed", 30, 28),
      legendItem("Ridgeland", "seed", 30, 28),
      legendItem("Tabantha", "seed", 30, 28),
      legendItem("Wasteland", "seed", 30, 28),
      legendItem("Woodland", "seed", 30, 28),
    ],
    "Korok Seeds"
  );
  map.addLegend(
    [
      legendItem("Big rupees", "treasure", 30, 26),
      legendItem("Small rupees", "treasure", 30, 26),
      legendItem("Rare gems", "treasure", 30, 26),
      legendItem("Common gems", "treasure", 30, 26),
      legendItem("Materials", "treasure", 30, 26),
      legendItem("Clothing", "treasure", 30, 26),
      legendItem("Uniques", "treasure", 30, 26),
      legendItem("One-handed weapons", "treasure", 30, 26),
      legendItem("Two-handed weapons", "treasure", 30, 26),
      legendItem("Spears", "treasure", 30, 26),
      legendItem("Rods", "treasure", 30, 26),
      legendItem("Bows", "treasure", 30, 26),
      legendItem("Arrows", "treasure", 30, 26),
      legendItem("Shields", "treasure", 30, 26),
    ],
    "Treasure"
  );
  map.addLegend(
    [
      legendItem("Stone Talus", "talus", 26, 30),
      legendItem("Hinox", "hinox", 30, 30),
      legendItem("Lynel", "lynel", 29, 30),
      legendItem("Molduga", "molduga", 29, 30),
      legendItem("Guardian", "guardian", 32, 28),
    ],
    "Bosses"
  );
  map.addLegend(
    [
      legendItem("Stable", "stable", 30, 30),
      legendItem("Village", "village", 30, 30),
      legendItem("Inn", "inn", 30, 30),
      legendItem("General Store", "store", 30, 30),
      legendItem("Armor Shop", "armor", 30, 30),
      legendItem("Dye Shop", "dye", 30, 30),
      legendItem("Jewelry Shop", "jewelry", 30, 30),
      legendItem("Settlement", "settlement", 27, 27),
      legendItem("Great Fairy", "fountain", 29, 29),
      legendItem("Goddess Statue", "statue", 24, 30),
      legendItem("Cooking Pot", "pot", 30, 27),
      legendItem("Raft", "raft", 27, 30),
    ],
    "Services"
  );

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
            "botw",
            map.wiki
          )
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
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch seeds.json: ${r.status}`);
      return r.json();
    })
    .then((categories: Schema.Category[]) => {
      // mutate every category -> every layer -> every marker
      categories.forEach((cat) => {
        if (!cat || !Array.isArray(cat.layers)) return;
        cat.layers.forEach((layer) => {
          if (!layer || !Array.isArray(layer.markers)) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layer.markers = layer.markers.map((m: any) => ({
            coords: Array.isArray(m.coords) ? m.coords[0] : m.coords,
            id: m.id,
            name: "Korok Seed",
            link: `${m.loc ?? ""}#${m.id}`,
            path:
              Array.isArray(m.coords) && m.coords.length > 1
                ? m.coords
                : undefined,
          }));
        });
      });

      addJson(categories);
    })
    .catch((err) => {
      console.error("Error loading/processing seeds.json", err);
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
