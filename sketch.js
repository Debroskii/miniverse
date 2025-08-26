let FONT = null;
let CAMERA = null;
let REGIONS = [];
let SCALE = 15;
let SYSTEM_DIRECTORY = [];
let FOCUSED_SYSTEM = "";
let TOTAL_SYSTEMS = 0;
let SHOW_REGIONS = false;
let TARGET_EYE_POSITION;
let TARGET_CENTER_POSITION;
let AUTOMOVE_CAMERA = false;

// function preload() {
//     FONT = loadFont('/assets/SourceCodePro-Regular.ttf');
// }

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    CAMERA = createCamera();
    TARGET_EYE_POSITION = createVector(0, 0, 0);
    TARGET_CENTER_POSITION = createVector(0, 0, 0);
    if(windowWidth / windowHeight > 0.9) {
        for(let i = 0; i < 100 * SCALE; i++) {
            let regionPosition = createVector(randomGaussian(0, 1000 + 50 * SCALE), randomGaussian(0, 1000 + 50 * SCALE), randomGaussian(0, 1000 + 50 * SCALE));
            let regionSize = createVector(random(100, 400), random(100, 400), random(100, 400));
            REGIONS.push(createRegion(regionPosition, regionSize));
            TOTAL_SYSTEMS += REGIONS[REGIONS.length - 1].systems.length;
        }
    } else {
        for(let i = 0; i < 25 * SCALE; i++) {
            let regionPosition = createVector(randomGaussian(0, 1000 + 10 * SCALE), randomGaussian(0, 1000 + 10 * SCALE), randomGaussian(0, 1000 + 10 * SCALE));
            let regionSize = createVector(random(100, 400), random(100, 400), random(100, 400));
            REGIONS.push(createRegion(regionPosition, regionSize));
            TOTAL_SYSTEMS += REGIONS[REGIONS.length - 1].systems.length;
        }
    }
    initUI();
    print(TOTAL_SYSTEMS + " star systems generated in " + REGIONS.length + " regions.");
    print(JSON.stringify(REGIONS));
}

function draw() {
    background(0);
    orbitControl();
    moveCameraToTarget();
    for(let region of REGIONS) {
        displayRegion(region);
    }
}

function displayRegion(region) {
    // Cull check
    let camPos = createVector(CAMERA.eyeX, CAMERA.eyeY, CAMERA.eyeZ);
    let camCenter = createVector(CAMERA.centerX, CAMERA.centerY, CAMERA.centerZ);
    let camForward = p5.Vector.sub(camCenter, camPos).normalize(); // camera forward vector
    let toRegion = p5.Vector.sub(region.position, camPos).normalize(); // vector from camera to region

    // Dot product > 0 means region is in front of camera
    if (p5.Vector.dot(camForward, toRegion) <= 0) {
        return; // skip rendering region
    }
    
    //Standard draw
    push();
    translate(region.position.x, region.position.y, region.position.z);
    noFill();
    if(SHOW_REGIONS) {
        stroke(100, 100, 255);
        box(region.size.x, region.size.y, region.size.z);
    }
    pop();
    for(let system of region.systems) {
        displaySystem(system);
    }
}

function displaySystem(system) {
    let eyeDistance = dist(CAMERA.eyeX, CAMERA.eyeY, CAMERA.eyeZ, system.position.x, system.position.y, system.position.z);
    push();
    translate(system.position.x, system.position.y, system.position.z);
    fill(255);
    noStroke();
    sphere(system.starSize);
    if(eyeDistance > 1500) {
        pop();
        return;
    }
    rotateX(system.rotation.x);
    rotateY(system.rotation.y);
    rotateZ(system.rotation.z);
    for(let planet of system.planets) {
        push();
        rotateY(planet.orbitPosition + frameCount * planet.orbitSpeed);
        translate(planet.orbitDistance, 0, 0);
        fill(planet.color);
        noStroke();
        sphere(planet.size);
        pop();
    }
    if(FOCUSED_SYSTEM === system.name) {
        rotateX(PI/2)
        noFill();
        stroke(255, 155);
        strokeWeight(0.1);
        for(let planet of system.planets) {
            circle(0, 0, planet.orbitDistance * 2);
        }
    }
    pop();
}

function createRegion(position, size) {
    let reg = new Region(position, size);
    for(let i = 0; i < ceil(random(2, 5)); i++) {
        reg.systems.push(createSystem(reg));
    }
    return reg;
}

function createSystem(region) { 
    let sys = new System(createVector(
        region.position.x - (region.size.x / 2) + random(0, region.size.x),
        region.position.y - (region.size.y / 2) + random(0, region.size.y),
        region.position.z - (region.size.z / 2) + random(0, region.size.z)
    ), random(50, 150) * sqrt(region.size.x ** 2 + region.size.y ** 2 + region.size.z ** 2) / 500);
    for(let i = 0; i < ceil(sys.size / 100); i++) {
        sys.planets.push(new Planet(random(sys.size * 0.005, sys.size * 0.01), color(random(100, 255), random(100, 255), random(100, 255)), random(sys.size / 4, sys.size)));
    }
    return sys;
}

function Region(position, size) {
    return {
        position: position,
        size: size,
        systems: []
    };
}

function System(position, size) {
    let name = generateName();
    SYSTEM_DIRECTORY.push({name: name, position: position});
    return {
        position: position,
        rotation: createVector(random(TAU), random(TAU), random(TAU)),
        size: size,
        starSize: size * 0.02,
        name: name,
        planets: []
    };
}

function Planet(size, color, orbitDistance) {
    return {
        size: size,
        color: color,
        orbitDistance: orbitDistance,
        orbitPosition: random(TAU),
        orbitSpeed: random(0.001, 0.005)
    };
}

function insideWhichRegion() {
    for(let region of REGIONS) {
        if(
            CAMERA.eyeX > region.position.x - (region.size.x / 2) &&
            CAMERA.eyeX < region.position.x + (region.size.x / 2) &&
            CAMERA.eyeY > region.position.y - (region.size.y / 2) &&
            CAMERA.eyeY < region.position.y + (region.size.y / 2) &&
            CAMERA.eyeZ > region.position.z - (region.size.z / 2) &&
            CAMERA.eyeZ < region.position.z + (region.size.z / 2)
        ) {
            return region;
        }
    }
    return null;
}

function findSuitableRegionPosition(scale = 500) {
    let pos = createVector(
        round(random(-scale, scale)),
        round(random(-scale, scale)),
        round(random(random(-scale, scale)))
    );
    for(let region of REGIONS) {
        if(
            pos.x > region.position.x - (region.size.x / 2) - scale &&
            pos.x < region.position.x + (region.size.x / 2) + scale &&
            pos.y > region.position.y - (region.size.y / 2) - scale &&
            pos.y < region.position.y + (region.size.y / 2) + scale &&
            pos.z > region.position.z - (region.size.z / 2) - scale &&
            pos.z < region.position.z + (region.size.z / 2) + scale
        ) {
            return findSuitableRegionPosition();
        }
    }
    return pos;
}

const NAMEPREFIXES = ['Zor', 'Xan', 'Prox', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Tau', 'Sigma', 'Omicron', 'Kappa', 'Lambda', 'Theta', 'Iota', 'Nu', 'Mu', 'Rho', 'Pi', 'Chi', 'Upsilon', 'Vega', 'Siri', 'Altair', 'Deneb', 'Rigel', 'Betelgeuse', 'Aldebaran', 'Capella', 'Arcturus', 'Spica', 'Antares', 'Fomalhaut', 'Pollux', 'Castor', 'Vulcan', 'Krypton', 'Erebus', 'Nyx', 'Orion', 'Draco', 'Phoenix', 'Hydra', 'Pegasus', 'Andromeda', 'Cassiopeia', 'Perseus', 'Cepheus', 'Lyra', 'Cygnus', 'Taurus', 'Scorpius', 'Libra', 'Aquarius', 'Pisces', 'Cancer', 'Leo', 'Virgo', 'Sagittarius', 'Capricorn', 'Aries', 'Gemini', 'Ophiuchus', 'Corona', 'Crux', 'Centauri', 'Proxima', 'Barnard', 'Wolf', 'Luyten', 'Ross', 'Groombridge', 'Lalande', 'Gliese', 'Hipparcos', 'Kepler', 'Hubble', 'Newton', 'Einstein', 'Curie', 'Feynman', 'Hawking', 'Sagan', 'Tycho', 'Galileo', 'Copernicus', 'Keplerian', 'Ptolemy', 'Halley', 'Caldwell', 'Messier', 'Hercules', 'Orpheus', 'Theseus', 'Achilles', 'Hector', 'Persephone', 'Athena', 'Zeus', 'Hades', 'Poseidon', 'Ares', 'Hermes', 'Apollo', 'Dionysus', 'Artemis', 'Demeter', 'Hephaestus', 'Janus', 'Nemesis', 'Nike', 'Eros', 'Gaia', 'Uranus', 'Cronus', 'Rhea', 'Hyperion'];
const NAMESUFFIXES = ['on', 'ar', 'us', 'is', 'ea', 'ion', 'os', 'ax', 'ex', 'ix', 'or', 'um', 'en', 'an', 'in', 'es', 'as', 'ys', 'ea', 'ia', 'ea', 'oa', 'ua', 'ae', 'oe', 'ue', 'yus', 'ius', 'eus', 'ous', 'ius', 'eon', 'ion', 'eron', 'aron', 'uron', 'ylon', 'ylon', 'athon', 'ethon', 'ithon', 'othon', 'uthon', 'athon', 'ethon', 'ithon', 'othon', 'uthon'];
const NAMEALPHANUMERICALADDITION = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
function generateName() {
    let name = random(NAMEPREFIXES) + random(NAMESUFFIXES) + (floor(random(0, 100)) > 50 ? '-' + floor(random(1, 1000)) + (random(0, 100) > 50 ? random(NAMEALPHANUMERICALADDITION) : "") : '');
    if(name.includes("sex")) return generateName();
    return name;
}

function mouseDragged() {
    if(AUTOMOVE_CAMERA) AUTOMOVE_CAMERA = false;
}

function keyPressed() {
    if(keyCode === 72) {
        if(CONTEXT == UIContext.DESKTOP) {
            if(SIDEBAR_STATE == 1) {
                closeSidebarDesktop();
                SIDEBAR_STATE = 0;
                return;
            }
            openSidebarDesktop();
            SIDEBAR_STATE = 1;
            return;
        }
    } else if (keyCode === 83) {
        SHOW_REGIONS = !SHOW_REGIONS;
    }
}

function moveCameraToTarget() {
    if(AUTOMOVE_CAMERA == false) return;
    let eye = createVector(CAMERA.eyeX, CAMERA.eyeY, CAMERA.eyeZ);
    let center = createVector(CAMERA.centerX, CAMERA.centerY, CAMERA.centerZ);
    let targetDistEye = dist(eye.x, eye.y, eye.z, TARGET_EYE_POSITION.x, TARGET_EYE_POSITION.y, TARGET_EYE_POSITION.z);
    let targetDistCenter = dist(center.x, center.y, center.z, TARGET_CENTER_POSITION.x, TARGET_CENTER_POSITION.y, TARGET_CENTER_POSITION.z);
    if((eye == TARGET_EYE_POSITION && center == TARGET_CENTER_POSITION) || (targetDistEye < 5 && targetDistCenter < 5)) { AUTOMOVE_CAMERA = false; return; };
    let newEye = p5.Vector.lerp(eye, TARGET_EYE_POSITION, 0.05);
    let newCenter = p5.Vector.lerp(center, TARGET_CENTER_POSITION, 0.05);
    CAMERA.setPosition(newEye.x, newEye.y, newEye.z);
    CAMERA.lookAt(newCenter.x, newCenter.y, newCenter.z);
}