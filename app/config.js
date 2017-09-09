export default {
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
        "jupiter": "./dist/textures/jupiter.jpg",
        "saturn": "./dist/textures/saturn.jpg",
        "uranus": "./dist/textures/uranus.jpg",
        "neptune": "./dist/textures/neptune.jpg",
    },
    system: {
        planets: [
            // {
            //     name: "Sun",
            //     radius: 696342,
            //     distance: 0,
            //     speed: 0,
            //     rotationSpeed: 0,
            //     texture: "moon",
            //     moons: []
            // },
            {
                name: "Mercury",
                radius: 4880,
                distance: 5000,
                speed: 0,
                rotationSpeed: 20,
                texture: "mercury",
                moons: []
            },
            {
                name: "Venus",
                radius: 12100,
                distance: 50000,
                speed: 10,
                rotationSpeed: 20,
                texture: "venus",
                moons: []
            },
            {
                name: "Earth",
                radius: 12756,
                distance: 150000,
                speed: 30,
                rotationSpeed: 40,
                texture: "earth",
                moons: [
                    {
                        name: "Moon",
                        radius: 3476,
                        distance: 30 * 12756,
                        speed: 0,
                        rotationSpeed: 0,
                        texture: "moon"
                    }
                ]
            },
            {
                name: "Mars",
                radius: 6792,
                distance: 250000,
                speed: 40,
                rotationSpeed: 30,
                texture: "mars",
                moons: [
                    {
                        name: "Phobos",
                        radius: 22.4,
                        distance: 10000,
                        speed: 0,
                        rotationSpeed: 0,
                        texture: "phobos"
                    },
                    {
                        name: "Deimos",
                        radius: 12.2,
                        distance: 10000,
                        speed: 0,
                        rotationSpeed: 0,
                        texture: "deimos"
                    }
                ]
            },
            {
                name: "Jupiter",
                radius: 142984,
                distance: 800000,
                speed: 20,
                rotationSpeed: 50,
                texture: "jupiter",
                moons: []
            },
            {
                name: "Saturn",
                radius: 120536,
                distance: 1250000,
                speed: 15,
                rotationSpeed: 50,
                texture: "saturn",
                moons: []
            },
            {
                name: "Uranus",
                radius: 51118,
                distance: 1500000,
                speed: 10,
                rotationSpeed: 50,
                texture: "uranus",
                moons: []
            },
            {
                name: "Neptune",
                radius: 49538,
                distance: 1750000,
                speed: 5,
                rotationSpeed: 50,
                texture: "neptune",
                moons: []
            }
        ]
    }
};
