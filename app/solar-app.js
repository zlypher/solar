import Shader from "./shader/shader-program";
import { makePerspective } from "./utility";
import PerformanceCounter from "./performance-counter";
import Planet from "./planet";
import config from "./config";


/**
 * Resizes the given canvas element to fit the whole screen.
 * @param {DOMElement} canvas The canvas element to resize
 */
function resizeToFullscreen(canvas, glContext, uiCanvas, uiContext) {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    canvas.width = width;
    canvas.height = height;
    glContext.viewportWidth = width;
    glContext.viewportHeight = height;
    
    uiCanvas.width = width;
    uiCanvas.height = height;
    uiContext.viewportWidth = width;
    uiContext.viewportHeight = height;
}

/**
 * Reference to the projection matrix.
 */
let pMatrix;

/**
 * Reference to the model view matrix.
 */
let mvMatrix;

let dummyTexture;

export default class SolarApp {
    /**
     * Prepares all necessary elements to execute and draw SolarApp.
     * @param {DOMElement} canvas The canvas element to draw to 
     */
    constructor(canvas, uiCanvas) {
        this.lastTime = new Date().getTime();
        this.canvas = canvas;
        this.uiCanvas = uiCanvas;
        this.gl = this.initializeContext(this.canvas, "webgl");
        this.uiContext = this.initializeContext(this.uiCanvas, "2d");
        this.shader = new Shader(this.gl);
        this.position = [0, 0, -50];
        this.perfCounter = new PerformanceCounter();

        this.initializeTextures();
        resizeToFullscreen(this.canvas, this.gl, this.uiCanvas, this.uiContext);

        this.solarSystem = this.setupSolarSystem(config.system, dummyTexture);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        // Bind this to callbacks
        this.onResize = this.onResize.bind(this);
        this.onMouseScroll = this.onMouseScroll.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    /**
     * Tries to initialize the webgl context for the given canvas.
     * @param {DOMElement} canvas The canvas to get the context for.
     */
    initializeContext(canvas, type) {
        try {
            let glContext = canvas.getContext(type);
            glContext.viewportWidth = canvas.width;
            glContext.viewportHeight = canvas.height;
            return glContext;
        } catch (e) {
            this.onError(e);
            return null;
        }
    }

    /**
     * Initializes the dummy texture.
     */
    initializeTextures() {
        dummyTexture = this.gl.createTexture();
        dummyTexture.image = new Image();
        dummyTexture.image.onload = () => {
            this.onLoadTexture(dummyTexture);
        };
    
        dummyTexture.image.src = "./dist/textures/earth.jpg";
    }

    /**
     * Configures the freshly loaded texture.
     * @param {object} texture Texture data.
     */
    onLoadTexture(texture) {
        // http://learningwebgl.com/blog/?p=507
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    setupSolarSystem(systemConfig, texture) {
        const planets = [];

        systemConfig.planets.forEach((planetConfig) => {
            let p = new Planet({ position: [ 0, 0, 0 ] , radius: planetConfig.radius * config.globalScale, texture });
            p.create(this.gl);

            planetConfig.moons.forEach((moonConfig) => {
                let m = new Planet({ position: [ moonConfig.distance * config.globalScale, 0, 0 ], radius: moonConfig.radius * config.globalScale, texture });
                m.create(this.gl);
                p.addChild(m);
            });

            planets.push(p);
        });

        return planets;
    }

    /**
     * Error Callback
     */
    onError(err) {
        console.dir(err);
    }

    /**
     * Resize Callback
     */
    onResize() {
        // TODO: Throttle number of calls.
        resizeToFullscreen(this.canvas, this.gl, this.uiCanvas, this.uiContext);
    }

    /**
     * Mouse Scroll Callback
     */
    onMouseScroll(e) {
        const zoomDir = Math.max(-1, Math.min(1, e.deltaY));
        this.position[2] += zoomDir * config.zoomSpeed;
    }

    /**
     * Mouse Down Callback
     */
    onMouseDown() {
        // console.dir("Mouse Down");
    }

    /**
     * Mouse Up Callback
     */
    onMouseUp() {
        // console.dir("Mouse Up");
    }

    /**
     * Mouse Move Callback
     */
    onMouseMove() {
        // console.dir("Mouse Move");
    }

    doAction() {
        try {
            this.update();
            this.render();
            this.renderUI();
        } catch (err) {
            this.onError(err);
        }
    }

    /**
     * Update function of the SolarApp
     */
    update() {
        const now = new Date().getTime();
        const elapsed = now - this.lastTime;

        this.perfCounter.update(elapsed);
        this.solarSystem.forEach(p => p.update(elapsed));

        this.lastTime = now;
    }

    /**
     * Render function of the SolarApp
     */
    render() {
        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        pMatrix = makePerspective(45, this.gl.viewportWidth/this.gl.viewportHeight, 0.1, 1000.0);
        mvMatrix = Matrix.I(4).x(Matrix.Translation($V(this.position)).ensure4x4());

        this.shader.setLight(this.gl);

        this.solarSystem.forEach(p => p.draw(this.gl, this.shader, pMatrix, mvMatrix));
    }

    renderUI() {
        this.uiContext.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);

        const labelWidth = 100;
        const labelHeight = 30;
        const labelPosX = this.uiCanvas.width - labelWidth;
        const labelPosY = this.uiCanvas.height - labelHeight;

        this.uiContext.fillStyle = 'white';
        this.uiContext.fillRect(labelPosX, labelPosY, labelWidth, labelHeight);

        this.uiContext.fillStyle = 'black';
        this.uiContext.fillText(`AVG: ${this.perfCounter.average.toFixed(2)}ms`, labelPosX + 5, labelPosY + 12);
        this.uiContext.fillText(`FPS: ${this.perfCounter.fps.toFixed(1)}`, labelPosX + 5, labelPosY + 25);
    }
}