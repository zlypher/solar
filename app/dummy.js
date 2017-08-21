import { degToRad } from "./utility";

let buffer = {
    pos: {},
    tex: {}
};

export default class Dummy {
    constructor() {
        this.rotation = 0;
        this.texture = null;
    }

    create(gl, texture) {
        this.texture = texture;

        const vertices = [
            1.0,  1.0,  0.0,
            -1.0, 1.0,  0.0,
            1.0,  -1.0, 0.0,
            -1.0, -1.0, 0.0
        ];

        buffer.pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.pos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        const textureCoords = [
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0,
        ];

        buffer.tex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.tex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
        buffer.tex.itemSize = 2;
        buffer.tex.numItems = 4;
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

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.tex);
        gl.vertexAttribPointer(shader.attributes.texture, buffer.tex.itemSize, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        shader.setTexture(gl, 0);

        shader.setMatrices(gl, pMatrix, mvMatrix);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        // popMatrix - TODO
    }
}