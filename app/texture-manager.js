

export default class TextureManager {
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