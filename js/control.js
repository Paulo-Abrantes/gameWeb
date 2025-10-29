const keys = {
  a: { pressed: false },
  d: { pressed: false },
  w: { pressed: false },
  space: { pressed: false }, // ataque
  r: { pressed: false }, // recarregar
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
    case " ":
      keys.space.pressed = true;
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
    case " ":
      keys.space.pressed = false;
      break;
    case "r":
      keys.r.pressed = false;
      break;
  }
});
