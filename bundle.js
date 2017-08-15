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

/**
 * Tries to initialize the webgl context for the given canvas.
 * @param {object} canvas The canvas to get the context for.
 */
function initializeWebGl(canvas) {
    let gl;

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

function setMatrixUniforms(gl, program) {
    var pUniform = gl.getUniformLocation(program, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(program, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

let gl;
let shader;

let pMatrix;
let mvMatrix;

class SolarApp {
    constructor(canvas) {
        gl = initializeWebGl(canvas);
        shader = initShaderProgram(gl);

        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
    }

    render() {
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        pMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
        mvMatrix = Matrix.I(4).x(Matrix.Translation($V([-0.0, 0.0, -6.0])).ensure4x4());


        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        // Set the colors attribute for the vertices.

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColBuffer);
        gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

        // Draw the square.

        setMatrixUniforms(gl, program);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

const app = new SolarApp(document.getElementById("canvas"));

}());
