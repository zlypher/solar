import { degToRad } from "./utility";

let buffer = {
    pos: {},
    col: {}
};

export default class Dummy {
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