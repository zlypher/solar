import SolarApp from "./solar-app";

const app = new SolarApp(document.getElementById("solar"));

app.doAction();

window.addEventListener("resize", app.onResize);