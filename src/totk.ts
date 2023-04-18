import "./common/style.scss";
import * as Schema from "./common/JSONSchema";
import { Layer } from "./common/Layer";
import { MapLayer } from "./common/MapLayer";
import { ZDMap } from "./common/ZDMap";

window.onload = async () => {
  const map = ZDMap.create(
    "totk",
    24000,
    750,
    {
      center: [-3750, -1900],
    },
    "Tears of the Kingdom"
  );
  const sky = map.addMapLayer("Sky", "sky");
  const surface = map.addMapLayer("Surface", "surface");
  map.addControls();

  function addJson(mapLayer: MapLayer, categories: Schema.Category[]): void {
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
    .then((categories) => addJson(surface, categories));
  const pins = fetch(`${import.meta.env.BASE_URL}botw/markers/pins.json`)
    .then((r) => r.json())
    .then((categories) => addJson(sky, categories));

  await Promise.allSettled([locations, pins]);
};
