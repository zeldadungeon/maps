import "./common/style.scss";
import { Map } from "./common/Map";

window.onload = () => {
  Map.create("ss", 500, 125, {
    center: [0, 0],
  });
};
