import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Category } from "./common/Category";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  const map = ZDMap.create("botw", 24000, 750, {
    center: [-3750, -1900],
  });
  map.addMapLayer("botw");
  map.addControls(["Master Mode", "DLC"]);

  function addJson(categories: Schema.Category[]): void {
    categories.forEach((c) => map.addCategory(Category.fromJSON(c, "botw")));
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
