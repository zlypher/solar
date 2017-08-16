import { createVertexShader } from "./vertex-shader";
import { createFragmentShader } from "./fragment-shader";

export default class Shader {
    constructor(gl) {
        this.program = gl.createProgram();

        gl.attachShader(this.program, createVertexShader(gl));
        gl.attachShader(this.program, createFragmentShader(gl));
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