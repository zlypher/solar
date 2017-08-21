import Shader from "./shader/shader-program";
import { makePerspective } from "./utility";
import Dummy from "./dummy";

/**
 * Resizes the given canvas element to fit the whole screen.
 * @param {DOMElement} canvas The canvas element to resize
 */
function resizeToFullscreen(canvas) {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}

/**
 * Reference to the projection matrix.
 */
let pMatrix;

/**
 * Reference to the model view matrix.
 */
let mvMatrix;

let dummy = new Dummy();

let dummyTexture;

export default class SolarApp {
    /**
     * Prepares all necessary elements to execute and draw SolarApp.
     * @param {DOMElement} canvas The canvas element to draw to 
     */
    constructor(canvas) {
        this.lastTime = new Date().getTime();
        this.canvas = canvas;
        this.gl = this.initializeWebGl(this.canvas);
        this.shader = new Shader(this.gl);
        this.initializeTextures();

        resizeToFullscreen(this.canvas);

        dummy.create(this.gl, dummyTexture);
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.onResize = this.onResize.bind(this);
    }

    /**
     * Tries to initialize the webgl context for the given canvas.
     * @param {DOMElement} canvas The canvas to get the context for.
     */
    initializeWebGl(canvas) {
        try {
            let glContext = canvas.getContext("webgl");
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
    
        dummyTexture.image.src = "./dist/textures/nehe.gif";
    }

    /**
     * Configures the freshly loaded texture.
     * @param {object} texture Texture data.
     */
    onLoadTexture(texture) {
        // http://learningwebgl.com/blog/?p=507
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
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
        resizeToFullscreen(this.canvas);
    }

    doAction() {
        try {
            this.update();
            this.render();
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

        // ...
        dummy.update(elapsed);

        this.lastTime = now;
    }

    /**
     * Render function of the SolarApp
     */
    render() {
        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        pMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        mvMatrix = Matrix.I(4).x(Matrix.Translation($V([-0.0, 0.0, -6.0])).ensure4x4());

        dummy.draw(this.gl, this.shader, pMatrix, mvMatrix);
    }
}