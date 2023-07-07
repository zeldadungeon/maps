import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { ICategory } from "./common/ICategory";
import { Layer } from "./common/Layer";
import { MapLayer } from "./common/MapLayer";
import { ZDMap, ZDMapOptions } from "./common/ZDMap";
import { ContributionMarkerHandler } from "./common/Handlers/ContributionMarkerHandler";

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
        iconUrl: `${import.meta.env.BASE_URL}totk/icons/${iconName}`,
        iconWidth,
        iconHeight,
        group,
      };
    }
    return {
      name,
      iconUrl: `${import.meta.env.BASE_URL}totk/icons/${iconName}.png`,
      iconWidth,
      iconHeight,
      group,
    };
  }

  const options: ZDMapOptions = {
    directory: "totk",
    gameTitle: "Tears of the Kingdom",
    mapSizePixels: 36096,
    mapSizeCoords: 12032,
    tileSizePixels: 564,
    center: [101, -255],
  };

  const map = ZDMap.create(options);
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
  map.addControls(
    ["User-Contributed", "Paths"],
    [
      {
        icon: "sensor",
        title: "Creatures and Materials",
        groupings: [
          {
            groupingName: "By Type",
            groups: [
              {
                groupName: "Fruits",
                objectNames: [
                  "Apple",
                  "Golden Apple",
                  "Palm Fruit",
                  "Wildberry",
                  "Hylian Tomato",
                  "Spicy Pepper",
                  "Hydromelon",
                  "Voltfruit",
                  "Fleet-Lotus Seeds",
                  "Mighty Bananas",
                  "Fire Fruit",
                  "Ice Fruit",
                  "Splash Fruit",
                  "Shock Fruit",
                  "Dazzlefruit",
                ],
              },
              {
                groupName: "Mushrooms",
                objectNames: [
                  "Hylian Shroom",
                  "Skyshroom",
                  "Endura Shroom",
                  "Stamella Shroom",
                  "Hearty Truffle",
                  "Big Hearty Truffle",
                  "Chillshroom",
                  "Sunshroom",
                  "Zapshroom",
                  "Rushroom",
                  "Razorshroom",
                  "Ironshroom",
                  "Silent Shroom",
                  "Brightcap",
                  "Puffshroom",
                ],
              },
              {
                groupName: "Plants",
                objectNames: [
                  "Hyrule Herb",
                  "Stambulb",
                  "Hearty Radish",
                  "Big Hearty Radish",
                  "Cool Safflina",
                  "Warm Safflina",
                  "Electric Safflina",
                  "Swift Carrot",
                  "Endura Carrot",
                  "Fortified Pumpkin",
                  "Sun Pumpkin",
                  "Swift Violet",
                  "Mighty Thistle",
                  "Armoranth",
                  "Blue Nightshade",
                  "Sundelion",
                  "Brightbloom Seed",
                  "Giant Brightbloom Seed",
                  "Muddle Bud",
                  "Bomb Flower",
                  "Silent Princess",
                  "Courser Bee Honey",
                  "Hylian Pine Cone",
                  "Korok Frond",
                ],
              },
              {
                groupName: "Other Ingredients",
                objectNames: [
                  "Raw Prime Meat",
                  "Raw Meat",
                  "Tabantha Wheat",
                  "Hylian Rice",
                  "Cane Sugar",
                  "Bird Egg",
                  "Goat Butter",
                  "Hateno Cheese",
                  "Fresh Milk",
                  "Acorn",
                  "Chickaloo Tree Nut",
                  "Oil Jar",
                  "Goron Spice",
                  "Rock Salt",
                  "Monster Extract",
                ],
              },
              {
                groupName: "Food",
                objectNames: [
                  "Baked Apple",
                  "Baked Palm Fruit",
                  "Toasted Hearty Truffle",
                  "Toasty Hylian Shroom",
                  "Toasty Skyshroom",
                  "Toasty Sunshroom",
                  "Seared Prime Steak",
                  "Seared Gourmet Steak",
                  "Seared Steak",
                  "Roasted Bird Thigh",
                  "Roasted Bass",
                  "Roasted Porgy",
                  "Roasted Cave Fish",
                  "Frozen Porgy",
                  "Icy Gourmet Meat",
                  "Icy Prime Meat",
                  "Frozen Bird Thigh",
                  "Hard-Boiled Egg",
                ],
              },
              {
                groupName: "Animals",
                objectNames: [
                  "Horse",
                  "Giant Horse",
                  "White Horse",
                  "Giant White Stallion",
                  "Golden Horse",
                  "Stalhorse",
                  "Donkey",
                  "Sand Seal",
                  "Patricia",
                  "Bushy-Tailed Squirrel",
                  "Woodland Boar",
                  "Red-Tusked Boar",
                  "Mountain Goat",
                  "White Goat",
                  "Mountain Buck",
                  "Mountain Doe",
                  "Water Buffalo",
                  "Hateno Cow",
                  "Highland Sheep",
                  "Grassland Fox",
                  "Snowcoat Fox",
                  "Maraudo Wolf",
                  "Wasteland Coyote",
                  "Cold-Footed Wolf",
                  "Tabantha Moose",
                  "Dondon",
                  "Honeyvore Bear",
                  "Grizzlemaw Bear",
                  "Hylian Retriever",
                  "Blupee",
                  "Bubbulfrog",
                ],
              },
              {
                groupName: "Birds",
                objectNames: [
                  "Common Sparrow",
                  "Red Sparrow",
                  "Blue Sparrow",
                  "Rainbow Sparrow",
                  "Sand Sparrow",
                  "Golden Sparrow",
                  "Wood Pigeon",
                  "Rainbow Pigeon",
                  "Hotfeather Pigeon",
                  "White Pigeon",
                  "Accented Pigeon",
                  "Mountain Crow",
                  "Bright-Chested Duck",
                  "Blue-Winged Heron",
                  "Pink Heron",
                  "Islander Hawk",
                  "Seagull",
                  "Cloud Seagull",
                  "Eldin Ostrich",
                  "Forest Ostrich",
                  "Cucco",
                ],
              },
              {
                groupName: "Fish",
                objectNames: [
                  "Hyrule Bass",
                  "Hearty Bass",
                  "Staminoka Bass",
                  "Hearty Salmon",
                  "Chillfin Trout",
                  "Sizzlefin Trout",
                  "Voltfin Trout",
                  "Stealthfin Trout",
                  "Mighty Carp",
                  "Armored Carp",
                  "Sanke Carp",
                  "Ancient Arowana",
                  "Glowing Cave Fish",
                  "Armored Porgy",
                  "Mighty Porgy",
                  "Sneaky River Snail",
                  "Razorclaw Crab",
                  "Ironshell Crab",
                  "Bright-Eyed Crab",
                ],
              },
              {
                groupName: "Insects",
                objectNames: [
                  "Fairy",
                  "Winterwing Butterfly",
                  "Summerwing Butterfly",
                  "Thunderwing Butterfly",
                  "Smotherwing Butterfly",
                  "Cold Darner",
                  "Warm Darner",
                  "Electric Darner",
                  "Restless Cricket",
                  "Bladed Rhino Beetle",
                  "Rugged Rhino Beetle",
                  "Energetic Rhino Beetle",
                  "Sunset Firefly",
                  "Deep Firefly",
                  "Hot-Footed Frog",
                  "Tireless Frog",
                  "Sticky Frog",
                  "Hightail Lizard",
                  "Hearty Lizard",
                  "Fireproof Lizard",
                  "Sticky Lizard",
                ],
              },
              {
                groupName: "Ore",
                objectNames: [
                  "Ore Deposit",
                  "Rare Ore Deposit",
                  "Luminous Stone Deposit",
                  "Zonaite Deposit",
                  "Diamond",
                  "Ruby",
                  "Sapphire",
                  "Topaz",
                  "Opal",
                  "Flint",
                  "Zonaite",
                  "Large Zonaite",
                ],
              },
              {
                groupName: "Monster Parts",
                objectNames: [
                  "Gibdo Guts",
                  "Red Chuchu Jelly",
                  "White Chuchu Jelly",
                  "Yellow Chuchu Jelly",
                  "Chuchu Jelly",
                  "Octo Balloon",
                  "Aerocuda Eyeball",
                  "Octorok Eyeball",
                  "Aerocuda Wing",
                  "Gibdo Wing",
                  "Gibdo Bone",
                  "Soldier Construct Horn",
                  "Lizalfos Tail",
                ],
              },
              {
                groupName: "Other Materials",
                objectNames: ["Zonai Charge", "Large Zonai Charge"],
              },
            ],
          },
          {
            groupingName: "By Effect",
            groups: [
              {
                groupName: "Max Health Up",
                objectNames: [
                  "Hearty Truffle",
                  "Big Hearty Truffle",
                  "Hearty Radish",
                  "Big Hearty Radish",
                  "Hearty Bass",
                  "Hearty Salmon",
                  "Hearty Lizard",
                ],
              },
              {
                groupName: "Gloom Recovery",
                objectNames: ["Sun Pumpkin", "Sundelion"],
              },
              {
                groupName: "Gloom Resistance",
                objectNames: [],
              },
              {
                groupName: "Stamina Recovery",
                objectNames: [
                  "Stamella Shroom",
                  "Stambulb",
                  "Courser Bee Honey",
                  "Staminoka Bass",
                  "Bright-Eyed Crab",
                  "Restless Cricket",
                  "Energetic Rhino Beetle",
                ],
              },
              {
                groupName: "Max Stamina Up",
                objectNames: [
                  "Endura Shroom",
                  "Endura Carrot",
                  "Tireless Frog",
                ],
              },
              {
                groupName: "Flame Guard",
                objectNames: ["Smotherwing Butterfly", "Fireproof Lizard"],
              },
              {
                groupName: "Heat Resistance",
                objectNames: [
                  "Chillshroom",
                  "Cool Safflina",
                  "Chillfin Trout",
                  "Winterwing Butterfly",
                  "Cold Darner",
                ],
              },
              {
                groupName: "Cold Resistance",
                objectNames: [
                  "Spicy Pepper",
                  "Sunshroom",
                  "Warm Safflina",
                  "Sizzlefin Trout",
                  "Summerwing Butterfly",
                  "Warm Darner",
                ],
              },
              {
                groupName: "Shock Resistance",
                objectNames: [
                  "Zapshroom",
                  "Electric Safflina",
                  "Voltfin Trout",
                  "Thunderwing Butterfly",
                  "Electric Darner",
                ],
              },
              {
                groupName: "Attack Up",
                objectNames: [
                  "Mighty Bananas",
                  "Razorshroom",
                  "Mighty Thistle",
                  "Mighty Carp",
                  "Mighty Porgy",
                  "Razorclaw Crab",
                  "Bladed Rhino Beetle",
                ],
              },
              {
                groupName: "Hot Weather Attack",
                objectNames: ["Fire Fruit"],
              },
              {
                groupName: "Cold Weather Attack",
                objectNames: ["Ice Fruit"],
              },
              {
                groupName: "Stormy Weather Attack",
                objectNames: ["Shock Fruit"],
              },
              {
                groupName: "Defense Up",
                objectNames: [
                  "Ironshroom",
                  "Fortified Pumpkin",
                  "Armoranth",
                  "Armored Carp",
                  "Armored Porgy",
                  "Ironshell Crab",
                  "Rugged Rhino Beetle",
                ],
              },
              {
                groupName: "Speed Up",
                objectNames: [
                  "Fleet-Lotus Seeds",
                  "Rushroom",
                  "Swift Carrot",
                  "Swift Violet",
                  "Hot-Footed Frog",
                  "Hightail Lizard",
                ],
              },
              {
                groupName: "Swim Speed Up",
                objectNames: ["Splash Fruit"],
              },
              {
                groupName: "Slip Resistance",
                objectNames: ["Sticky Frog", "Sticky Lizard"],
              },
              {
                groupName: "Stealth Up",
                objectNames: [
                  "Silent Shroom",
                  "Blue Nightshade",
                  "Stealthfin Trout",
                  "Sneaky River Snail",
                  "Sunset Firefly",
                ],
              },
              {
                groupName: "Glow",
                objectNames: ["Brightcap", "Glowing Cave Fish", "Deep Firefly"],
              },
            ],
          },
        ],
      },
    ],
    [new ContributionMarkerHandler(map, options)]
  );
  map.addLegend(
    [
      legendItem("Skyview Tower", "tower", 20, 26),
      legendItem("Shrine of Light", "shrine", 27, 29),
      legendItem("Lightroot", "lightroot", 27, 24),
      legendItem("Tech Lab", "lab", 28, 24),
      legendItem("Dungeon", "windtemple", 23, 27),
      legendItem("Other Travel Gate", "start", 28, 28),
    ],
    "Travel Gates"
  );
  map.addLegend(
    [
      legendItem("Main Quest", "mainquest", 35, 23),
      legendItem("Side Adventure", "adventure", 20, 24),
      legendItem("Shrine Quest", "shrinequest", 25, 29),
      legendItem("Side Quest", "sidequest", 27, 21),
      legendItem("Quest Objective", "objective", 13, 13),
      legendItem("Dragon's Tear", "tear", 31, 36),
      legendItem("Zonai Relief", "relief", 27, 27),
    ],
    "Quests"
  );
  map.addLegend(
    [
      legendItem("Korok Seed", "korok", 27, 27),
      legendItem("Treasure Chest", "treasure", 27, 21),
      legendItem("Sage's Will", "sageswill", 27, 21),
      legendItem("Old Map", "oldmap", 27, 21),
      legendItem("Armor", "treasurearmor", 27, 21),
      legendItem("Unique Weapon", "treasureweapon", 27, 21),
      legendItem("Yiga Schematic", "schematic", 27, 21),
    ],
    "Collectibles"
  );
  map.addLegend(
    [
      legendItem("Village", "village", 29, 29),
      legendItem("Chasm", "chasm", 25, 26),
      legendItem("Cave", "cave", 25, 26),
      legendItem("Well", "well", 25, 26),
    ],
    "Locations"
  );
  map.addLegend(
    [
      legendItem("Stable", "stable", 29, 29),
      legendItem("Inn", "inn", 29, 29),
      legendItem("General Store", "general", 29, 29),
      legendItem("Armor Shop", "armor", 29, 29),
      legendItem("Bargainer Statue", "bargainer", 29, 29),
      legendItem("Koltin Balloon", "monster", 29, 29),
      legendItem("Other Shops", "othershops", 29, 29),
      legendItem("Great Fairy", "fountain", 36, 36),
      legendItem("Device Dispenser", "dispenser", 36, 36),
      legendItem("Goddess Statue", "statue", 36, 36),
      legendItem("Cooking Pot", "pot", 36, 36),
    ],
    "Services"
  );
  map.addLegend(
    [
      legendItem("Hudson Sign", "hudsonsign.svg", 24, 24),
      legendItem("Minigames", "minigame.svg", 30, 30),
      legendItem("Cherry Tree", "cherry-blossom.svg", 25, 25),
    ],
    "Other"
  );
  map.addLegend(
    [
      legendItem("Flux Construct", "square", 36, 36),
      legendItem("Hinox", "hinox.svg", 25, 25),
      legendItem("Stone Talus", "ore", 36, 36),
      legendItem("Frox", "frox.svg", 25, 25),
      legendItem("Gleeok", "gleeok.svg", 25, 25),
      legendItem("Lynel", "lynel", 29, 30),
      legendItem("Molduga", "molduga.svg", 25, 25),
      legendItem("Gloom Spawn", "hand-solid.svg", 25, 25),
      legendItem("Dungeon Boss", "skull", 36, 36),
    ],
    "Bosses"
  );

  const jsonVer = 2;

  function addJson(layer: MapLayer, path: string): Promise<void> {
    return fetch(`${import.meta.env.BASE_URL}totk/markers/${path}?v=${jsonVer}`)
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

  function addObjects(layer: MapLayer, path: string) {
    return fetch(`${import.meta.env.BASE_URL}totk/markers/${path}?v=${jsonVer}`)
      .then((r) => r.json())
      .then((groups: Schema.ObjectCategory[]) => {
        layer.addObjects(groups);
      })
      .catch((ex) => console.log(ex));
  }

  await Promise.allSettled([
    addJson(surface, "surface/locations.json"),
    addJson(sky, "sky/locations.json"),
    addJson(depths, "depths/locations.json"),
    addWikiJson(surface, "Surface Categories"),
    addWikiJson(sky, "Sky Categories"),
    addWikiJson(depths, "Depths Categories"),
    addWiki(surface, "Wiki", "Surface Markers", "temp", "flag", 25, 28, 2),
    addWiki(sky, "Wiki", "Sky Markers", "temp", "flag", 25, 28, 2),
    addWiki(depths, "Wiki", "Depths Markers", "temp", "flag", 25, 28, 2),
  ]);

  await map.initializeWikiConnector().catch((ex) => console.log(ex));

  await Promise.allSettled([
    addObjects(surface, "surface/materials.json"),
    addObjects(sky, "sky/materials.json"),
    addObjects(depths, "depths/materials.json"),
  ]);
};
