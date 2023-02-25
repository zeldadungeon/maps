import "./common/style.scss";
import { Map } from "./common/Map";

window.onload = () => {
  Map.create("totk", 24000, 750, {
    center: [-3750, -1900],
  });
};
