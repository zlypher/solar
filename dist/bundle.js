(function () {
'use strict';

const fragmentSource = `
precision mediump float;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;

void main(void) {
    vec4 texColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    gl_FragColor = vec4(texColor.rgb * vLightWeighting, texColor.a);
}
`;

const vertexSource = `
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;

    vec3 transNormal = uNMatrix * aVertexNormal;
    float dirLightWeight = max(dot(transNormal, uLightingDirection), 0.0);
    vLightWeighting = uAmbientColor + uDirectionalColor * dirLightWeight;
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
            normal: gl.getAttribLocation(this.program, "aVertexNormal"),
            // color: gl.getAttribLocation(this.program, "aVertexColor"),
            texture: gl.getAttribLocation(this.program, "aTextureCoord")
        };

        gl.enableVertexAttribArray(attributes.position);
        gl.enableVertexAttribArray(attributes.normal);
        gl.enableVertexAttribArray(attributes.texture);
        
        return attributes;
    }

    setMatrices(gl, pMatrix, mvMatrix) {
        const pUniform = gl.getUniformLocation(this.program, "uPMatrix");
        const mvUniform = gl.getUniformLocation(this.program, "uMVMatrix");
        const nUniform = gl.getUniformLocation(this.program, "uNMatrix");
        
        // let nMatrix = Matrix.I(4);
        let nMatrix = mvMatrix.inverse().make3x3().transpose();

        gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
        gl.uniformMatrix3fv(nUniform, false, new Float32Array(nMatrix.flatten()));
    }

    setLight(gl) {
        const ambientColorUniform = gl.getUniformLocation(this.program, "uAmbientColor");
        const lightingDirectionUniform = gl.getUniformLocation(this.program, "uLightingDirection");
        const directionalColorUniform = gl.getUniformLocation(this.program, "uDirectionalColor");

        gl.uniform3f(ambientColorUniform, 0.2, 0.2, 0.2);
        gl.uniform3f(directionalColorUniform, 0.8, 0.8, 0.8);

        let lightDir = $V([ -0.5, 0, -1 ]).toUnitVector().multiply(-1);
        gl.uniform3f(lightingDirectionUniform, lightDir.e(1), lightDir.e(2), lightDir.e(3));
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
    tex: {},
    normal: {}
};

// http://learningwebgl.com/blog/?p=1253
const setupSphere = (latBands, longBands, radius) => {
    const vertexData = [];
    const texData = [];
    const normalData = [];

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
            normalData.push(...[x, y, z]);
        }
    }

    return { pos: vertexData, tex: texData, normal: normalData };
};

class Planet {
    constructor() {
        this.position = []; // TODO
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

        buffer.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normal), gl.STATIC_DRAW);
        buffer.normal.itemSize = 3;
        buffer.normal.numitems = data.normal.length / 3;

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

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.normal);
        gl.vertexAttribPointer(shader.attributes.normal, buffer.normal.itemSize, gl.FLOAT, false, 0, 0);

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

        this.shader.setLight(this.gl);

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
