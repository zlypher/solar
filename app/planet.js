import { degToRad } from "./utility";

// http://learningwebgl.com/blog/?p=1253
const setupSphere = (latBands, longBands, radius) => {
    const vertexData = [];
    const texData = [];
    const normalData = [];
    const indexData = [];

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

    for (let latNumber = 0; latNumber < latBands; latNumber++) {
        for (let longNumber = 0; longNumber < longBands; longNumber++) {
            const first = (latNumber * (longBands + 1)) + longNumber;
            const second = first + longBands + 1;

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

    return { pos: vertexData, tex: texData, normal: normalData, index: indexData };
};

export default class Planet {
    constructor({ position = [ 0, 0, 0 ], radius = 1, texture = {} }) {
        this.position = position; // TODO
        this.radius = radius;
        this.texture = texture;
        this.children = [];
        this.buffer = {
            idx: {},
            pos: {},
            tex: {},
            normal: {}
        };

        this.parentRotation = 0;
        this.rotation = 0;

        this.parentRotationSpeed = 30;
        this.rotationSpeed = 25;
    }

    addChild(child) {
        this.children.push(child);
    }

    create(gl) {
        const data = setupSphere(30, 30, this.radius);

        this.buffer.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.normal), gl.STATIC_DRAW);
        this.buffer.normal.itemSize = 3;
        this.buffer.normal.numitems = data.normal.length / 3;

        this.buffer.pos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.pos);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.pos), gl.STATIC_DRAW);
        this.buffer.pos.itemSize = 3;
        this.buffer.pos.numItems = data.pos.length / 3;

        this.buffer.tex = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.tex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.tex), gl.STATIC_DRAW);
        this.buffer.tex.itemSize = 2;
        this.buffer.tex.numItems = data.tex.length / 2;

        this.buffer.idx = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.idx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.index), gl.STATIC_DRAW);
        this.buffer.idx.itemSize = 1;
        this.buffer.idx.numItems = data.index.length;
    }

    update(elapsed) {
        this.rotation += (this.rotationSpeed * elapsed) / 1000.0;
        this.parentRotation += (this.parentRotationSpeed * elapsed) / 1000.0;
        
        this.children.forEach((child) => {
            child.update(elapsed);
        });
    }

    draw(gl, shader, pMatrix, mvBaseMatrix) {
        // pushMatrix - TODO
        const parentRotMatrix = Matrix.Rotation(degToRad(this.parentRotation), $V([0, 1, 0])).ensure4x4();
        const rotMatrix = Matrix.Rotation(degToRad(this.rotation), $V([0, 1, 0])).ensure4x4();
        const transMatrix = Matrix.Translation($V(this.position));
        const mvMatrix = mvBaseMatrix.x(parentRotMatrix.x(transMatrix.x(rotMatrix)));
        // const mvMatrix = mvBaseMatrix;
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.pos);
        gl.vertexAttribPointer(shader.attributes.position, this.buffer.pos.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.normal);
        gl.vertexAttribPointer(shader.attributes.normal, this.buffer.normal.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.tex);
        gl.vertexAttribPointer(shader.attributes.texture, this.buffer.tex.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.idx);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        shader.setTexture(gl, 0);

        shader.setMatrices(gl, pMatrix, mvMatrix);
        gl.drawElements(gl.TRIANGLES, this.buffer.idx.numItems, gl.UNSIGNED_SHORT, 0);
        // popMatrix - TODO
        
        this.children.forEach((child) => {
            child.draw(gl, shader, pMatrix, mvBaseMatrix);
        });
    }
}