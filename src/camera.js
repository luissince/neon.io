export default class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 500; // pixels per second
        this.scale = 1;
        this.color = 'rgba(136, 13, 13, 0.5)';
    }

    init(worldWidth, worldHeight, player) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.player = player;
    }

    update(keys) {
        // if (keys['ArrowLeft']) this.x = Math.max(0, this.x - this.speed);
        // if (keys['ArrowRight']) this.x = Math.min(this.worldWidth - this.width, this.x + this.speed);
        // if (keys['ArrowUp']) this.y = Math.max(0, this.y - this.speed);
        // if (keys['ArrowDown']) this.y = Math.min(this.worldHeight - this.height, this.y + this.speed);


        // this.x = this.player.x - this.width / 2;
        // this.y = this.player.y - this.height / 2;

        // this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        // this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));


        this.x = this.player.x - this.width / 2;
        this.y = this.player.y - this.height / 2;        
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}