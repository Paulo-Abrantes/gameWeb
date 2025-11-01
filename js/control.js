const keys = {
  a: { pressed: false },
  d: { pressed: false },
  w: { pressed: false },
  mouseLeft: { pressed: false },
  r: { pressed: false },
};

window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "a":
      keys.a.pressed = true;
      break;
    case "d":
      keys.d.pressed = true;
      break;
    case "w":
      keys.w.pressed = true;
      break;
    case "r":
      keys.r.pressed = true;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "a":
      keys.a.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
    case "w":
      keys.w.pressed = false;
      break;
    case "r":
      keys.r.pressed = false;
      break;
  }
});

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    // botão esquerdo do mouse
    keys.mouseLeft.pressed = true;
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    keys.mouseLeft.pressed = false;
  }
});
