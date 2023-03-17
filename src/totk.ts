import "./common/style.scss";
import { ZDMap } from "./common/ZDMap";

window.onload = () => {
  ZDMap.create("totk", 24000, 750, {
    center: [-3750, -1900],
  });
};
