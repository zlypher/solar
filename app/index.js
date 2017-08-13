// https://developer.mozilla.org/de/docs/Web/API/WebGL_API/Tutorial/Hinzuf%C3%BCgen_von_2D_Inhalten_in_einen_WebGL-Kontext
// http://learningwebgl.com/blog/?p=28

const aspectRatio = 480.0/640.0;


let mvMatrix;
let pMatrix;
let vertexPosBuffer;
let vertexPositionAttribute;
let vertexColBuffer;
var vertexColorAttribute;

const gFragmentShader = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`;

const gVertexShader = `
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

function getShader(gl, shaderSource, type) {
    let shader;

    if (type === "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type === "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Es ist ein Fehler beim Kompilieren der Shader aufgetaucht: " + gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(gl) {
    const fragmentShader = getShader(gl, gFragmentShader, "x-shader/x-fragment");
    const vertexShader = getShader(gl, gVertexShader, "x-shader/x-vertex");

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Initialization of shader failed");
        return false;
    }

    gl.useProgram(program);
    

    vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    vertexColorAttribute = gl.getAttribLocation(program, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);

    return program;
}


function initBuffers(gl) {
    vertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);

    const vertices = [
        1.0,  1.0,  0.0,
        -1.0, 1.0,  0.0,
        1.0,  -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0     // blue
    ];

    vertexColBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

function drawScene(gl, program) {
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

/**
 * Initializes Solar
 */
function initialize() {
    const canvas = document.getElementById("solar");
    const gl = initializeWebGl(canvas);

    const shaderProgram = initShaders(gl);


    initBuffers(gl);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    drawScene(gl, shaderProgram);
}

initialize();


function setMatrixUniforms(gl, program) {
    var pUniform = gl.getUniformLocation(program, "uPMatrix");
    gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));

    var mvUniform = gl.getUniformLocation(program, "uMVMatrix");
    gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}