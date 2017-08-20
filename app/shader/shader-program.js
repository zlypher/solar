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

export default class Shader {
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