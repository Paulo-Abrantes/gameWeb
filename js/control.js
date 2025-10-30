const keys = {
  a: { pressed: false, time: 0 }, 
  d: { pressed: false, time: 0 }, 
  w: { pressed: false },
  mouseLeft: { pressed: false },
};

window.addEventListener("keydown", (event) => {
  const currentTime = performance.now();
  switch (event.key) {
    case "a":
      keys.a.pressed = true;
      keys.a.time = currentTime; 
      break;
    case "d":
      keys.d.pressed = true;
      keys.d.time = currentTime;
      break;
    case "w":
      keys.w.pressed = true;
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
  }
});

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    keys.mouseLeft.pressed = true;
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    keys.mouseLeft.pressed = false;
  }
});

function getMovementDirection(keys) {
  const { a, d } = keys;
  
  if (a.pressed && d.pressed) {
    if (a.time > d.time) {
      return { left: true, right: false };
    } else {
      return { left: false, right: true };
    }
  } 
  else if (a.pressed) {
    return { left: true, right: false };
  } 
  else if (d.pressed) {
    return { left: false, right: true };
  } 
  else {
    return { left: false, right: false };
  }
}