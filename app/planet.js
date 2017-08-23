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

export default class Planet {
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