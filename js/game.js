const canvas = document.querySelector('canvas');  // construcao do canvas e cons pq NINGUEM pode mudar
const context = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576; // talvez isso fique conts tbm

const player = new Player(); // a instacia do player para carregar ele no mun


function animate() {
    window.requestAnimationFrame(animate);
    
    context.fillStyle = 'black';
    context.fillRect(0, 0, canvas.width, canvas.height);

    player.velocity.x = 0;
    
    if (keys.a.pressed) {
        player.velocity.x = -5; 
    } else if (keys.d.pressed) {
        player.velocity.x = 5;
    }
    
    if (keys.w.pressed && player.isOnGround) {
        player.velocity.y = -12;
    }
    player.update(context, canvas.height); 
}

animate();