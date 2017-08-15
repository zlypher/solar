import { initShaderProgram } from "./shader/shader-program";
import Dummy from "./dummy";

/**
 * Tries to initialize the webgl context for the given canvas.
 * @param {object} canvas The canvas to get the context for.
 */
function initializeWebGl(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
        console.error(e);
        return null;
    }

    return gl;
}

function resizeToFullscreen(canvas) {
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
}

function setMatrixUniforms(gl, program) {
    var pUniform = gl.getUniformLocation(program, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(program, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

let gl;
let shader;
let canvas;
let vertexPositionAttribute;
let vertexColorAttribute;

let pMatrix;
let mvMatrix;

let dummy = new Dummy();

export default class SolarApp {
    constructor(cvs, options = {}) {
        canvas = cvs;
        gl = initializeWebGl(canvas);
        shader = initShaderProgram(gl);
        
        resizeToFullscreen(canvas);

        vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
        gl.enableVertexAttribArray(vertexPositionAttribute);

        vertexColorAttribute = gl.getAttribLocation(shader, "aVertexColor");
        gl.enableVertexAttribArray(vertexColorAttribute);

        dummy.create(gl);
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);

        this.onResize = this.onResize.bind(this);
    }

    onResize() {
        // TODO: Throttle number of calls.
        // TODO: Remove explicit this.render call here.
        resizeToFullscreen(canvas);
        this.render();
    }

    doAction() {
        this.update();
        this.render();
    }

    update() {
        // TODO
    }

    render() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        pMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        mvMatrix = Matrix.I(4).x(Matrix.Translation($V([-0.0, 0.0, -6.0])).ensure4x4());

        dummy.draw(gl, vertexPositionAttribute, vertexColorAttribute);

        setMatrixUniforms(gl, shader);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}