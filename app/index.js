import SolarApp from "./solar-app";

const app = new SolarApp(document.getElementById("solar"));

const executeAppLoop = () => {
    app.doAction();

    window.requestAnimationFrame(executeAppLoop);
};

window.addEventListener("resize", app.onResize);
window.requestAnimationFrame(executeAppLoop);
