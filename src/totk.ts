import "./common/style.scss";
import { ZDMap } from "./common/ZDMap";

window.onload = () => {
  const map = ZDMap.create("totk", 24000, 750, {
    center: [-3750, -1900],
  });
  map.addMapLayer("botw", "Surface"); // TODO "totk/surface"
  map.addMapLayer("botw", "Sky"); // TODO "totk/sky"
  map.addControls();
};
