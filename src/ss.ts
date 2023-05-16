import "./common/style.scss";
import { ZDMap } from "./common/ZDMap";

window.onload = () => {
  const map = ZDMap.create({
    directory: "ss",
    gameTitle: "Skyward Sword",
    mapSizePixels: 500,
    tileSizePixels: 125,
    center: [0, 0],
  });
  map.addMapLayer();
  map.addControls();
};
