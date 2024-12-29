import Player from "./player";

export default class Camera {

    // x, y, width, height, speed, scale, color
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    scale: number;
    color: string;

    worldWidth: number = 0;
    worldHeight: number = 0;
    player: Player | null = null;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 500; // pixels per second
        this.scale = 1;
        this.color = 'rgba(136, 13, 13, 0.5)';
    }

    init(worldWidth: number, worldHeight: number, player: Player) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.player = player;
    }

    update() {
        // if (keys['ArrowLeft']) this.x = Math.max(0, this.x - this.speed);
        // if (keys['ArrowRight']) this.x = Math.min(this.worldWidth - this.width, this.x + this.speed);
        // if (keys['ArrowUp']) this.y = Math.max(0, this.y - this.speed);
        // if (keys['ArrowDown']) this.y = Math.min(this.worldHeight - this.height, this.y + this.speed);


        // this.x = this.player.x - this.width / 2;
        // this.y = this.player.y - this.height / 2;

        // this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        // this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));


        this.x = this.player!.x - this.width / 2;
        this.y = this.player!.y - this.height / 2;        
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}