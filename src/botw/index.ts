import * as L from "leaflet";
import "./style.scss";

delete (<any>L.Icon.Default.prototype)._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"), // tslint:disable-line no-require-imports no-submodule-imports
    iconUrl: require("leaflet/dist/images/marker-icon.png"), // tslint:disable-line no-require-imports no-submodule-imports
    shadowUrl: require("leaflet/dist/images/marker-shadow.png") // tslint:disable-line no-require-imports no-submodule-imports
});

window.onload = () => {
    const map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(map); // tslint:disable-line no-http-string

    L.marker([51.5, -0.09]).addTo(map)
        .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
        .openPopup();
};