const keys = {                 //so os controles de A, S, D, W
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false }
};

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'a':
        // case ' ': aqui e para ser as setas
            keys.a.pressed = true;
            break;
        case 'd':
        // case ' ': aqui e para ser as setas
            keys.d.pressed = true;
            break;
        case 'w':
        // case ' ': aqui e para ser as setas
            keys.w.pressed = true;
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'a':
        // case ' ': aqui e para ser as setas
            keys.a.pressed = false;
            break;
        case 'd':
        // case ' ': aqui e para ser as setas
            keys.d.pressed = false;
            break;
        case 'w':
        // case ' ': aqui e para ser as setas
            keys.w.pressed = false;
            break;
    }
});