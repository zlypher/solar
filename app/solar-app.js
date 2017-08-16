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
 * The WebGl context.
 */
let gl;

/**
 * Reference to the shader program.
 */
let shader;

/**
 * Reference to the underlying canvas DOMElement.
 */
let canvas;

/**
 * Reference to the projection matrix.
 */
let pMatrix;

/**
 * Reference to the model view matrix.
 */
let mvMatrix;

let dummy = new Dummy();

export default class SolarApp {
    /**
     * Prepares all necessary elements to execute and draw SolarApp.
     * @param {DOMElement} cvs The canvas element to draw to 
     */
    constructor(cvs) {
        canvas = cvs;
        gl = this.initializeWebGl(canvas);
        shader = new Shader(gl);

        resizeToFullscreen(canvas);

        dummy.create(gl);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

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
        resizeToFullscreen(canvas);
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
        // TODO
    }

    /**
     * Render function of the SolarApp
     */
    render() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        pMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        mvMatrix = Matrix.I(4).x(Matrix.Translation($V([-0.0, 0.0, -6.0])).ensure4x4());
        shader.setMatrices(gl, pMatrix, mvMatrix);

        dummy.draw(gl, shader);
    }
}