import "./common/style.scss";
import { ZDMap, ZDMapOptions } from "./common/ZDMap";
import { ContributionMarkerHandler } from "./common/Handlers/ContributionMarkerHandler";

window.onload = async () => {
  const options: ZDMapOptions = {
    directory: "eow",
    gameTitle: "Echoes of Wisdom",
    mapSizePixels: 7200,
    tileSizePixels: 450,
    center: [0, 0],
  };

  const map = ZDMap.create(options);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const overworld = map.addMapLayer();
  map.addControls(
    ["User-Contributed"],
    [],
    [new ContributionMarkerHandler(map, options)]
  );

  await map.initializeWikiConnector().catch((ex) => console.log(ex));
};
