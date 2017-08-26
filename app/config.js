export default {
    zoomSpeed: 0.5,
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
