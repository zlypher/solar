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