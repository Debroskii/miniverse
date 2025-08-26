let CONTEXT = null;
let SIDEBAR
let SIDEBAR_STATE = 1; // 0: closed, 1: open
let DIRECTORY_ENTRIES_INDEX = 0;

function initUI() {
    CONTEXT = windowWidth / windowHeight < 0.9 ? UIContext.MOBILE : UIContext.DESKTOP;

    SIDEBAR = createDiv('').id('sidebar').addClass(CONTEXT);
    if(CONTEXT == UIContext.MOBILE) {
        SIDEBAR.child(
            createDiv('').id('sidebar-hide-button').mousePressed(
                () => {
                    if(SIDEBAR_STATE == 1) {
                        closeSidebarMobile();
                        SIDEBAR_STATE = 0;
                        return;
                    }
                    openSidebarMobile();
                    SIDEBAR_STATE = 1;
                    return;
                }
            ).child(createSpan('arrow_left').addClass('material-symbols-outlined'))
        )
        SIDEBAR.child(iconButton("home").id("home-button").mousePressed(() => {
            TARGET_EYE_POSITION = createVector(1000, -1000, 1000);
            TARGET_CENTER_POSITION = createVector(0, 0, 0);
            AUTOMOVE_CAMERA = true;
            setTimeout(() => AUTOMOVE_CAMERA = true, 250);
            FOCUSED_SYSTEM = "";
            DIRECTORY_ENTRIES_INDEX = -1;
            updateDirectoryShowing();
        }));
    }

    if(CONTEXT == UIContext.DESKTOP) {
        SIDEBAR.style('width', '20rem');
        SIDEBAR.style('height', '100%');
        SIDEBAR.style('left', '0');
        SIDEBAR.style('top', '0');
        SIDEBAR.style('transform', 'translateY(0)');
        
        for(let system of SYSTEM_DIRECTORY) {
            let entry = createDiv('').addClass('directory-entry').child(createSpan(system.name).addClass('directory-entry-name')).mousePressed(() => {
                FOCUSED_SYSTEM = system.name;
                let sys = SYSTEM_DIRECTORY.find(s => s.name == FOCUSED_SYSTEM);
                if(sys) {
                    // CAMERA.setPosition(sys.position.x + 200, sys.position.y + 200, sys.position.z + 200);
                    // CAMERA.lookAt(sys.position.x, sys.position.y, sys.position.z);
                    TARGET_EYE_POSITION = createVector(sys.position.x + 200, sys.position.y + 200, sys.position.z + 200);
                    TARGET_CENTER_POSITION = createVector(sys.position.x, sys.position.y, sys.position.z);
                    AUTOMOVE_CAMERA = true;
                    setTimeout(() => AUTOMOVE_CAMERA = true, 250);
                }
            });
            if(system.name == FOCUSED_SYSTEM) {
                entry.addClass('focused');
            }
            SIDEBAR.child(entry);
        }
    } else {
        SIDEBAR.style('width', '100%');
        SIDEBAR.style('height', '10rem');
        SIDEBAR.style('left', '0');
        SIDEBAR.style('top', 'calc(100% - 10rem)');
        SIDEBAR.style('transform', 'translateY(0)');

        SIDEBAR.child(createDiv('').id('directory-entries-container')
            .child(iconButton("chevron_left").mousePressed(() => {
                DIRECTORY_ENTRIES_INDEX--;
                if(DIRECTORY_ENTRIES_INDEX < 0) DIRECTORY_ENTRIES_INDEX = SYSTEM_DIRECTORY.length - 1;
                updateDirectoryShowing();
            }).addClass('directory-button'))
            .child(createDiv('').id('directory-entry').child(createSpan('(Click an arrow to get started)').id('focused-system-name')).mousePressed(() => {
                if(FOCUSED_SYSTEM != "") {
                    let system = SYSTEM_DIRECTORY.find(s => s.name == FOCUSED_SYSTEM);
                    if(system) {
                        TARGET_EYE_POSITION = createVector(system.position.x + 200, system.position.y + 200, system.position.z + 200);
                        TARGET_CENTER_POSITION = createVector(system.position.x, system.position.y, system.position.z);
                        AUTOMOVE_CAMERA = true;
                        setTimeout(() => AUTOMOVE_CAMERA = true, 250);
                    }
                } else {
                    FOCUSED_SYSTEM = random(SYSTEM_DIRECTORY).name;
                    DIRECTORY_ENTRIES_INDEX = SYSTEM_DIRECTORY.indexOf(SYSTEM_DIRECTORY.find(s => s.name == FOCUSED_SYSTEM)) - (SYSTEM_DIRECTORY.indexOf(SYSTEM_DIRECTORY.find(s => s.name == FOCUSED_SYSTEM)) % 5);
                    updateDirectoryShowing();
                }
            }))
            .child(iconButton("chevron_right").mousePressed(() => {
                DIRECTORY_ENTRIES_INDEX++;
                if(DIRECTORY_ENTRIES_INDEX > SYSTEM_DIRECTORY.length - 1) DIRECTORY_ENTRIES_INDEX = 0;
                updateDirectoryShowing();
            }).addClass('directory-button'))
        )
    }
}

function updateDirectoryShowing() {
    if(CONTEXT == UIContext.DESKTOP) return;
    // if(DIRECTORY_ENTRIES_INDEX > SYSTEM_DIRECTORY.length) {
    //     DIRECTORY_ENTRIES_INDEX = 0
    // }
    // if(DIRECTORY_ENTRIES_INDEX < 0) {
    //     DIRECTORY_ENTRIES_INDEX = SYSTEM_DIRECTORY.length - 1;
    // }
    let container = select('#directory-entry');
    let name = SYSTEM_DIRECTORY[DIRECTORY_ENTRIES_INDEX]?.name || "(Click an to get started)";
    container.child(select('#focused-system-name').html(name))
    FOCUSED_SYSTEM = name;
    let system = SYSTEM_DIRECTORY.find(s => s.name == FOCUSED_SYSTEM);
    if(system) {
        TARGET_EYE_POSITION = createVector(system.position.x + 200, system.position.y + 200, system.position.z + 200);
        TARGET_CENTER_POSITION = createVector(system.position.x, system.position.y, system.position.z);
        AUTOMOVE_CAMERA = true;
        setTimeout(() => AUTOMOVE_CAMERA = true, 250);
    }
}

function closeSidebarMobile() {
    SIDEBAR.style('transform', 'translateY(10rem)');
    SIDEBAR.addClass('hidden');
}

function openSidebarMobile() {
    SIDEBAR.style('transform', 'translateY(0)');
    SIDEBAR.removeClass('hidden');
}

function closeSidebarDesktop() {
    SIDEBAR.style('transform', 'translateX(-100%)');
    SIDEBAR.addClass('hidden');
}

function openSidebarDesktop() {
    SIDEBAR.style('transform', 'translateX(0)');
    SIDEBAR.removeClass('hidden');
}

const UIContext = Object.freeze({
    DESKTOP: 'DESKTOP',
    MOBILE: 'MOBILE'
})

function iconButton(icon) {
    return createDiv("").addClass('icon-button').child(createSpan(icon).addClass('material-symbols-outlined'));
}