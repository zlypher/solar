(function () {
'use strict';

const source = `
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

const createVertexShader = (gl) => {
    let shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Es ist ein Fehler beim Kompilieren der Shader aufgetaucht: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

const source$1 = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`;

const createFragmentShader = (gl) => {
    let shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, source$1);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Es ist ein Fehler beim Kompilieren der Shader aufgetaucht: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
};

const initShaderProgram = (gl) => {
    const program = gl.createProgram();
    gl.attachShader(program, createVertexShader(gl));
    gl.attachShader(program, createFragmentShader(gl));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Initialization of shader failed");
        return false;
    }

    gl.useProgram(program);
    return program;
};

let buffer = {
    pos: {},
    col: {}
};

class Dummy {
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

    draw(gl, posAttr, colAttr) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.pos);
        gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.col);
        gl.vertexAttribPointer(colAttr, 4, gl.FLOAT, false, 0, 0);
    }
}

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

class SolarApp {
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

const app = new SolarApp(document.getElementById("solar"));

app.doAction();

window.addEventListener("resize", app.onResize);

}());
