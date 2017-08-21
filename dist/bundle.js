(function () {
'use strict';

const fragmentSource = `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

const vertexSource = `
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
}
`;

const createShader = (gl, source, shaderType) => {
    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Es ist ein Fehler beim Kompilieren der Shader aufgetaucht: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

class Shader {
    constructor(gl) {
        this.program = gl.createProgram();

        gl.attachShader(this.program, createShader(gl, fragmentSource, gl.FRAGMENT_SHADER));
        gl.attachShader(this.program, createShader(gl, vertexSource, gl.VERTEX_SHADER));
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("Initialization of shader failed");
            return false;
        }

        gl.useProgram(this.program);

        this.attributes = this.initAttributes(gl);
    }

    initAttributes(gl) {
        let attributes = {
            position: gl.getAttribLocation(this.program, "aVertexPosition"),
            // color: gl.getAttribLocation(this.program, "aVertexColor"),
            texture: gl.getAttribLocation(this.program, "aTextureCoord")
        };

        gl.enableVertexAttribArray(attributes.position);
        // gl.enableVertexAttribArray(attributes.color);
        gl.enableVertexAttribArray(attributes.texture);
        
        return attributes;
    }

    setMatrices(gl, pMatrix, mvMatrix) {
        const pUniform = gl.getUniformLocation(this.program, "uPMatrix");
        const mvUniform = gl.getUniformLocation(this.program, "uMVMatrix");

        gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
    }

    setTexture(gl, idx) {
        const uniform = gl.getUniformLocation(this.program, "uSampler");
        gl.uniform1i(uniform, idx);
    }
}

/**
 * Converts a number in degrees to radians.
 * @param {number} degrees 
 */


// gluLookAt


// gluPerspective
function makePerspective(fovy, aspect, znear, zfar) {
    let ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    let ymin = -ymax;
    let xmin = ymin * aspect;
    let xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

// glFrustum
function makeFrustum(left, right, bottom, top, znear, zfar) {
    let X = 2*znear/(right-left);
    let Y = 2*znear/(top-bottom);
    let A = (right+left)/(right-left);
    let B = (top+bottom)/(top-bottom);
    let C = -(zfar+znear)/(zfar-znear);
    let D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
        [0, Y, B, 0],
        [0, 0, C, D],
        [0, 0, -1, 0]]);
}

// glOrtho

// import { degToRad } from "./utility";

let buffer = {
    idx: {},
    pos: {},
    tex: {}
};

// http://learningwebgl.com/blog/?p=1253
const setupSphere = (latBands, longBands, radius) => {
    const vertexData = [];
    const texData = [];

    for (let latIdx = 0; latIdx <= latBands; latIdx++) {
        const theta = latIdx * Math.PI / latBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let longIdx = 0; longIdx <= longBands; longIdx++) {
            const phi = longIdx * 2 * Math.PI / longBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;

            const u = 1 - (longIdx / longBands);
            const v = 1 - (latIdx / latBands);

            texData.push(...[u, v]);
            vertexData.push(...[ radius * x, radius * y, radius * z ]);
        }
    }

    return { pos: vertexData, tex: texData };
};

class Planet {
    constructor() {
        this.rotation = 0;
        this.latBands = 30;
        this.lonBands = 30;
        this.radius = 2;
        this.texture = null;
    }

    create(gl, texture) {
        this.texture = texture;

        const data = setupSphere(this.latBands, this.lonBands, this.radius);
        let indexData = [];
        for (let latNumber = 0; latNumber < this.latBands; latNumber++) {
            for (let longNumber = 0; longNumber < this.lonBands; longNumber++) {
                const first = (latNumber * (this.lonBands + 1)) + longNumber;
                const second = first + this.lonBands + 1;

                indexData.push(...[
                    first,
                    second,
                    first + 1,

                    second,
                    second + 1,
                    first + 1
                ]);
            }
        }

        buffer.pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.pos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.pos), gl.STATIC_DRAW);
        buffer.pos.itemSize = 3;
        buffer.pos.numItems = data.pos.length / 3;

        buffer.tex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.tex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.tex), gl.STATIC_DRAW);
        buffer.tex.itemSize = 2;
        buffer.tex.numItems = data.tex.length / 2;

        buffer.idx = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.idx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
        buffer.idx.itemSize = 1;
        buffer.idx.numItems = indexData.length;
    }

    update(/* elapsed */) {
        // this.rotation += (90 * elapsed) / 1000.0;
    }

    draw(gl, shader, pMatrix, mvBaseMatrix) {
        // pushMatrix - TODO
        // const rotMatrix = Matrix.Rotation(degToRad(this.rotation), $V([0, 1, 0])).ensure4x4();
        // const mvMatrix = mvBaseMatrix.x(rotMatrix);
        const mvMatrix = mvBaseMatrix;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.pos);
        gl.vertexAttribPointer(shader.attributes.position, buffer.pos.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.tex);
        gl.vertexAttribPointer(shader.attributes.texture, buffer.tex.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.idx);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        shader.setTexture(gl, 0);

        shader.setMatrices(gl, pMatrix, mvMatrix);
        gl.drawElements(gl.TRIANGLES, buffer.idx.numItems, gl.UNSIGNED_SHORT, 0);
        // popMatrix - TODO
    }
}

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

let planet = new Planet();

let dummyTexture;

class SolarApp {
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
        planet.create(this.gl, dummyTexture);
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        // Bind this to callbacks
        this.onResize = this.onResize.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
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
        planet.update(elapsed);

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

        planet.draw(this.gl, this.shader, pMatrix, mvMatrix);
    }
}

const canvas = document.getElementById("solar");
const app = new SolarApp(canvas);

const executeAppLoop = () => {
    app.doAction();

    window.requestAnimationFrame(executeAppLoop);
};

// Bind event listener
window.addEventListener("resize", app.onResize);
canvas.addEventListener("mousedown", app.onMouseDown);
document.addEventListener("mouseup", app.onMouseUp);
document.addEventListener("mousemove", app.onMouseMove);

window.requestAnimationFrame(executeAppLoop);

}());
