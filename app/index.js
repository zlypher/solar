import SolarApp from "./solar-app";

const canvas = document.getElementById("solar");
const uiCanvas = document.getElementById("ui");

(async () => {
    const app = new SolarApp(canvas, uiCanvas);
    await app.initialize();
    
    const executeAppLoop = () => {
        app.doAction();
    
        window.requestAnimationFrame(executeAppLoop);
    };
    
    // Bind event listener
    window.addEventListener("resize", app.onResize);
    canvas.addEventListener("mousedown", app.onMouseDown);
    document.addEventListener("mousewheel", app.onMouseScroll);
    document.addEventListener("mouseup", app.onMouseUp);
    document.addEventListener("mousemove", app.onMouseMove);
    
    window.requestAnimationFrame(executeAppLoop);
})();
