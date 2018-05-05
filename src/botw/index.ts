import * as L from "leaflet";

delete (<any>L.Icon.Default.prototype)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

import "./style.scss";

window.onload = () => {
    console.log("onload");

    var map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map);

    L.marker([51.5, -0.09]).addTo(map)
        .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
        .openPopup();
}