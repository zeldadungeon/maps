import { CRS, Transformation, Util } from "leaflet";

export function create(mapSize: number, tileSize: number): L.CRS {
  const scale = tileSize / mapSize;
  const offset = tileSize / 2;
  const zdcrs = Util.extend({}, CRS.Simple, {
    transformation: new Transformation(scale, offset, -scale, offset),
  });

  return zdcrs;
}
