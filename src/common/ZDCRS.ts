import * as L from "leaflet";

export function create(mapSize: number, tileSize: number): L.CRS {
    const scale = tileSize / mapSize;
    const offset = tileSize / 2;
    const zdcrs = L.Util.extend({}, L.CRS.Simple);
    zdcrs.transformation = new L.Transformation(scale, offset, -scale, offset);

    return zdcrs;
}