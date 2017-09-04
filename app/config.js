export default {
    moveSpeed: 0.05,
    zoomSpeed: 5,
    camera: {
        zNear: 10,
        zFar: 10000
    },
    globalScale: 0.001,
    textures: {
        "earth": "./dist/textures/earth.jpg",
        "moon": "./dist/textures/moon.gif",
    },
    system: {
        planets: [
            {
                name: "Earth",
                radius: 12756,
                texture: "earth",
                moons: [
                    {
                        name: "Moon",
                        radius: 3476,
                        distance: 20000,
                        texture: "moon"
                    }
                ]
            }
        ]
    }
};
