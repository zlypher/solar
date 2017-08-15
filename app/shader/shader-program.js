import { createVertexShader } from "./vertex-shader";
import { createFragmentShader } from "./fragment-shader";

export const initShaderProgram = (gl) => {
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
