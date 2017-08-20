(function () {
'use strict';

const fragmentSource = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`;

const vertexSource = `
attribute vec3 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying lowp vec4 vColor;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vColor = aVertexColor;
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
            color: gl.getAttribLocation(this.program, "aVertexColor"),
        };

        gl.enableVertexAttribArray(attributes.position);
        gl.enableVertexAttribArray(attributes.color);

        return attributes;
    }

    setMatrices(gl, pMatrix, mvMatrix) {
        const pUniform = gl.getUniformLocation(this.program, "uPMatrix");
        const mvUniform = gl.getUniformLocation(this.program, "uMVMatrix");

        gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
    }
}

/**
 * Converts a number in degrees to radians.
 * @param {number} degrees 
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

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

let buffer = {
    pos: {},
    col: {}
};

class Dummy {
    constructor() {
        this.rotation = 0;
    }

    create(gl) {
        const vertices = [
            1.0,  1.0,  0.0,
            -1.0, 1.0,  0.0,
            1.0,  -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];

        buffer.pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.pos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const colors = [
            1.0,  1.0,  1.0,  1.0,    // white
            1.0,  0.0,  0.0,  1.0,    // red
            0.0,  1.0,  0.0,  1.0,    // green
            0.0,  0.0,  1.0,  1.0     // blue
        ];

        buffer.col = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.col);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    }

    update(elapsed) {
        this.rotation += (90 * elapsed) / 1000.0;
    }

    draw(gl, shader, pMatrix, mvBaseMatrix) {
        // pushMatrix - TODO
        const rotMatrix = Matrix.Rotation(degToRad(this.rotation), $V([0, 1, 0])).ensure4x4();
        const mvMatrix = mvBaseMatrix.x(rotMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.pos);
        gl.vertexAttribPointer(shader.attributes.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.col);
        gl.vertexAttribPointer(shader.attributes.color, 4, gl.FLOAT, false, 0, 0);

        shader.setMatrices(gl, pMatrix, mvMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // popMatrix - TODO
    }
}

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

class SolarApp {
    /**
     * Prepares all necessary elements to execute and draw SolarApp.
     * @param {DOMElement} cvs The canvas element to draw to 
     */
    constructor(cvs) {
        this.lastTime = new Date().getTime();

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
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        pMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        mvMatrix = Matrix.I(4).x(Matrix.Translation($V([-0.0, 0.0, -6.0])).ensure4x4());

        dummy.draw(gl, shader, pMatrix, mvMatrix);
    }
}

const app = new SolarApp(document.getElementById("solar"));

const executeAppLoop = () => {
    app.doAction();

    window.requestAnimationFrame(executeAppLoop);
};

window.addEventListener("resize", app.onResize);
window.requestAnimationFrame(executeAppLoop);

}());
