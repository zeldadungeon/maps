import "./common/style.scss";
import { ZDMap } from "./common/ZDMap";

window.onload = () => {
  ZDMap.create("ss", 500, 125, {
    center: [0, 0],
  });
};
