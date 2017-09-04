(function () {
'use strict';

const fragmentSource = `
precision mediump float;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

uniform sampler2D uSampler;

void main(void) {
    vec4 texColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
    gl_FragColor = vec4(texColor.rgb * vLightWeighting, texColor.a);
}
`;

const vertexSource = `
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

varying vec2 vTextureCoord;
varying vec3 vLightWeighting;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;

    vec3 transNormal = uNMatrix * aVertexNormal;
    float dirLightWeight = max(dot(transNormal, uLightingDirection), 0.0);
    vLightWeighting = uAmbientColor + uDirectionalColor * dirLightWeight;
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

class Shader {
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
            normal: gl.getAttribLocation(this.program, "aVertexNormal"),
            // color: gl.getAttribLocation(this.program, "aVertexColor"),
            texture: gl.getAttribLocation(this.program, "aTextureCoord")
        };

        gl.enableVertexAttribArray(attributes.position);
        gl.enableVertexAttribArray(attributes.normal);
        gl.enableVertexAttribArray(attributes.texture);
        
        return attributes;
    }

    setMatrices(gl, pMatrix, mvMatrix) {
        const pUniform = gl.getUniformLocation(this.program, "uPMatrix");
        const mvUniform = gl.getUniformLocation(this.program, "uMVMatrix");
        const nUniform = gl.getUniformLocation(this.program, "uNMatrix");
        
        // let nMatrix = Matrix.I(4);
        let nMatrix = mvMatrix.inverse().make3x3().transpose();

        gl.uniformMatrix4fv(pUniform, false, new Float32Array(pMatrix.flatten()));
        gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
        gl.uniformMatrix3fv(nUniform, false, new Float32Array(nMatrix.flatten()));
    }

    setLight(gl) {
        const ambientColorUniform = gl.getUniformLocation(this.program, "uAmbientColor");
        const lightingDirectionUniform = gl.getUniformLocation(this.program, "uLightingDirection");
        const directionalColorUniform = gl.getUniformLocation(this.program, "uDirectionalColor");

        gl.uniform3f(ambientColorUniform, 0.2, 0.2, 0.2);
        gl.uniform3f(directionalColorUniform, 0.8, 0.8, 0.8);

        let lightDir = $V([ -0.5, 0, -1 ]).toUnitVector().multiply(-1);
        gl.uniform3f(lightingDirectionUniform, lightDir.e(1), lightDir.e(2), lightDir.e(3));
    }

    setTexture(gl, idx) {
        const uniform = gl.getUniformLocation(this.program, "uSampler");
        gl.uniform1i(uniform, idx);
    }
}

/**
 * Converts a number in degrees to radians.
 * @param {number} degrees 
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

// gluLookAt


// gluPerspective
function makePerspective(fovy, aspect, znear, zfar) {
    let ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    let ymin = -ymax;
    let xmin = ymin * aspect;
    let xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

// glFrustum
function makeFrustum(left, right, bottom, top, znear, zfar) {
    let X = 2*znear/(right-left);
    let Y = 2*znear/(top-bottom);
    let A = (right+left)/(right-left);
    let B = (top+bottom)/(top-bottom);
    let C = -(zfar+znear)/(zfar-znear);
    let D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
        [0, Y, B, 0],
        [0, 0, C, D],
        [0, 0, -1, 0]]);
}

// glOrtho

class PerformanceCounter {
    constructor() {
        this.currentFps = 0;
        this.averageDuration = 0;
        this.tickNum = 0;
    }

    update(elapsed) {
        this.averageDuration = this.recalculateAverageDuration(this.averageDuration, this.tickNum, elapsed);
        this.tickNum += 1;
        this.currentFps = 1000 / elapsed;
    }

    get fps() {
        return this.currentFps;
    }

    get average() {
        return this.averageDuration;
    }

    recalculateAverageDuration(avgDuration, tickNum, elapsed) {
        return ((avgDuration * tickNum) + elapsed) / (tickNum + 1);
    }
}

class TextureManager {
    constructor(gl, textureConfig) {
        this.gl = gl;
        this.config = textureConfig;
        this.textures = {};
    }

    async initialize() {
        let loaded = await Promise.all(Object.keys(this.config).map(n => this.loadTexture(n, this.config[n])));

        for (let t of loaded) {
            this.textures[t.name] = t.texture;
        }
    }

    async loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            let texture = this.gl.createTexture();
            texture.image = new Image();
            texture.image.onload = () => {
                this.onLoadTexture(texture);
                resolve({ name, texture });
            };

            texture.image.src = path;
        });
    }

    getTexture(name) {
        return this.textures[name];
    }

    
    /**
     * Configures the freshly loaded texture.
     * http://learningwebgl.com/blog/?p=507
     * @param {object} texture Texture data.
     */
    onLoadTexture(texture) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
}

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

class Planet {
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

var config = {
    moveSpeed: 0.05,
    zoomSpeed: 5,
    camera: {
        zNear: 10,
        zFar: 10000
    },
    globalScale: 0.001,
    textures: {
        "sun": "./dist/textures/earth.jpg",
        "mercury": "./dist/textures/mercury.jpg",
        "venus": "./dist/textures/venus.jpg",
        "earth": "./dist/textures/earth.jpg",
        "moon": "./dist/textures/moon.gif",
        "mars": "./dist/textures/mars.jpg",
        "phobos": "./dist/textures/phobos.jpg",
        "deimos": "./dist/textures/deimos.jpg",
    },
    system: {
        planets: [
            // {
            //     name: "Sun",
            //     radius: 696342,
            //     distance: 0,
            //     texture: "moon",
            //     moons: []
            // },
            {
                name: "Mercury",
                radius: 4880,
                distance: 5000,
                texture: "mercury",
                moons: []
            },
            {
                name: "Venus",
                radius: 12100,
                distance: 50000,
                texture: "venus",
                moons: []
            },
            {
                name: "Earth",
                radius: 12756,
                distance: 150000,
                texture: "earth",
                moons: [
                    {
                        name: "Moon",
                        radius: 3476,
                        distance: 30 * 12756,
                        texture: "moon"
                    }
                ]
            },
            {
                name: "Mars",
                radius: 6792,
                distance: 250000,
                texture: "mars",
                moons: [
                    {
                        name: "Phobos",
                        radius: 22.4,
                        distance: 10000,
                        texture: "phobos"
                    },
                    {
                        name: "Deimos",
                        radius: 12.2,
                        distance: 10000,
                        texture: "deimos"
                    }
                ]
            }
        ]
    }
};

/**
 * Resizes the given canvas element to fit the whole screen.
 * @param {DOMElement} canvas The canvas element to resize
 */
function resizeToFullscreen(canvas, glContext, uiCanvas, uiContext) {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    canvas.width = width;
    canvas.height = height;
    glContext.viewportWidth = width;
    glContext.viewportHeight = height;
    
    uiCanvas.width = width;
    uiCanvas.height = height;
    uiContext.viewportWidth = width;
    uiContext.viewportHeight = height;
}

/**
 * Reference to the projection matrix.
 */
let pMatrix;

/**
 * Reference to the model view matrix.
 */
let mvMatrix;

class SolarApp {
    /**
     * Prepares all necessary elements to execute and draw SolarApp.
     * @param {DOMElement} canvas The canvas element to draw to 
     */
    constructor(canvas, uiCanvas) {
        this.lastTime = new Date().getTime();
        this.canvas = canvas;
        this.uiCanvas = uiCanvas;
        this.gl = this.initializeContext(this.canvas, "webgl");
        this.uiContext = this.initializeContext(this.uiCanvas, "2d");
        this.shader = new Shader(this.gl);

        this.yaw = 0;
        this.pitch = 0;
        this.mouseFactor = 1.5;
        this.mousePosition = { x: 0, y: 0 };
        this.cameraPosition = [0, 0, -50];
        this.isMouseDown = false;

        this.perfCounter = new PerformanceCounter();
        this.textureManager = new TextureManager(this.gl, config.textures);

        resizeToFullscreen(this.canvas, this.gl, this.uiCanvas, this.uiContext);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);

        // Bind this to callbacks
        this.onResize = this.onResize.bind(this);
        this.onMouseScroll = this.onMouseScroll.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    async initialize() {
        await this.textureManager.initialize();
        this.solarSystem = this.setupSolarSystem(config.system);
    }

    /**
     * Tries to initialize the webgl context for the given canvas.
     * @param {DOMElement} canvas The canvas to get the context for.
     */
    initializeContext(canvas, type) {
        try {
            let glContext = canvas.getContext(type);
            glContext.viewportWidth = canvas.width;
            glContext.viewportHeight = canvas.height;
            return glContext;
        } catch (e) {
            this.onError(e);
            return null;
        }
    }

    setupSolarSystem(systemConfig) {
        const planets = [];

        systemConfig.planets.forEach((planetConfig) => {
            let p = new Planet({ position: [ planetConfig.distance * config.globalScale, 0, 0 ] , radius: planetConfig.radius * config.globalScale, texture: this.textureManager.getTexture(planetConfig.texture) });
            p.create(this.gl);

            planetConfig.moons.forEach((moonConfig) => {
                let m = new Planet({ position: [ (planetConfig.distance + moonConfig.distance) * config.globalScale, 0, 0 ], radius: moonConfig.radius * config.globalScale, texture: this.textureManager.getTexture(moonConfig.texture) });
                m.create(this.gl);
                p.addChild(m);
            });

            planets.push(p);
        });

        return planets;
    }

    /**
     * Error Callback
     */
    onError(err) {
        console.dir(err);
    }

    /**
     * Resize Callback
     */
    onResize() {
        // TODO: Throttle number of calls.
        resizeToFullscreen(this.canvas, this.gl, this.uiCanvas, this.uiContext);
    }

    /**
     * Mouse Scroll Callback
     */
    onMouseScroll(e) {
        const zoomDir = Math.max(-1, Math.min(1, e.deltaY));
        this.cameraPosition[2] += zoomDir * config.zoomSpeed;
    }

    /**
     * Mouse Down Callback
     */
    onMouseDown() {
        this.isMouseDown = true;
    }

    /**
     * Mouse Up Callback
     */
    onMouseUp() {
        this.isMouseDown = false;
    }

    /**
     * Mouse Move Callback
     */
    onMouseMove({ clientX, clientY }) {
        if (this.isMouseDown) {
            const { x:lastX , y:lastY } = this.mousePosition;
            const dX = clientX - lastX;
            const dY = clientY - lastY;
            
            this.cameraPosition[0] += -1 * dX * config.moveSpeed;
            this.cameraPosition[1] += dY * config.moveSpeed;
        }

        this.mousePosition.x = clientX;
        this.mousePosition.y = clientY;
    }

    doAction() {
        try {
            this.update();
            this.render();
            this.renderUI();
        } catch (err) {
            this.onError(err);
        }
    }

    /**
     * Update function of the SolarApp
     */
    update() {
        const now = new Date().getTime();
        const elapsed = now - this.lastTime;

        this.perfCounter.update(elapsed);
        this.solarSystem.forEach(p => p.update(elapsed));

        this.lastTime = now;
    }

    /**
     * Render function of the SolarApp
     */
    render() {
        this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        pMatrix = makePerspective(45, this.gl.viewportWidth/this.gl.viewportHeight, config.camera.zNear, config.camera.zFar);
        mvMatrix = Matrix.I(4)
            // Move Camera
            .x(Matrix.Translation($V(this.cameraPosition)).ensure4x4())
            // Rotate around y-axis (vertical)
            .x(Matrix.Rotation(degToRad(this.yaw), $V([0, 1, 0])).ensure4x4())
            // Rotate around x-axis (horizontal)
            .x(Matrix.Rotation(degToRad(this.pitch), $V([1, 0, 0])).ensure4x4());

            this.shader.setLight(this.gl);

        this.solarSystem.forEach(p => p.draw(this.gl, this.shader, pMatrix, mvMatrix));
    }

    renderUI() {
        this.uiContext.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);

        const labelWidth = 100;
        const labelHeight = 30;
        const labelPosX = this.uiCanvas.width - labelWidth;
        const labelPosY = this.uiCanvas.height - labelHeight;

        this.uiContext.fillStyle = "white";
        this.uiContext.fillRect(labelPosX, labelPosY, labelWidth, labelHeight);

        this.uiContext.fillStyle = "black";
        this.uiContext.fillText(`AVG: ${this.perfCounter.average.toFixed(2)}ms`, labelPosX + 5, labelPosY + 12);
        this.uiContext.fillText(`FPS: ${this.perfCounter.fps.toFixed(1)}`, labelPosX + 5, labelPosY + 25);
    }
}

const canvas = document.getElementById("solar");
const uiCanvas = document.getElementById("ui");

(async () => {
    const app = new SolarApp(canvas, uiCanvas);
    await app.initialize();
    
    const executeAppLoop = () => {
        app.doAction();
    
        window.requestAnimationFrame(executeAppLoop);
    };
    
    // Bind event listener
    window.addEventListener("resize", app.onResize);
    document.addEventListener("mousedown", app.onMouseDown);
    document.addEventListener("mousewheel", app.onMouseScroll);
    document.addEventListener("mouseup", app.onMouseUp);
    document.addEventListener("mousemove", app.onMouseMove);
    
    window.requestAnimationFrame(executeAppLoop);
})();

}());
