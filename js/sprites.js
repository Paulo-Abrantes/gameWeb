class Player {
    constructor() {
        this.position = {
            x: 100,
            y: 100
        };
        this.velocity = {
            x: 0, 
            y: 0 
        };
        
        this.width = 50;
        this.height = 50;

        this.isOnGround = false; // isso aqui e apra verificar se o jogador esta no chão isso vai mudar quando tiver plataforma

        this.gravity = 0.5;
    }

    draw(context) { //funcao que "desenha" o personagem na tela 
        context.fillStyle = 'white';
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update(context, canvasHeight) { // essa funcao e para os movimentos
        this.draw(context);

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        
        if (this.position.y + this.height + this.velocity.y >= canvasHeight) { // bem aqui esse canvasHeight se tudo isso for maior ou igual
            this.velocity.y = 0; 
            this.position.y = canvasHeight - this.height;
            this.isOnGround = true;
        } else {
            this.velocity.y += this.gravity; // se joga gravidade nele
            this.isOnGround = false;
        }
    }
}