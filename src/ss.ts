import "./common/style.scss";
import { ZDMap } from "./common/ZDMap";

window.onload = () => {
  const map = ZDMap.create("ss", 500, 125, {
    center: [0, 0],
  });
  map.addMapLayer("ss");
  map.addControls();
};
