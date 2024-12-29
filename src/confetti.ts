export default class Confetti {

    private x: number = 0;
    private y: number = 0;
    private width: number = 0;
    private height: number = 0;
    private speed: number = 0;
    private angle: number = 0;
    private rotation: number = 0;
    private color: string = '';

    private canvas: HTMLCanvasElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvas!.width;
        this.y = -10;
        this.width = Math.random() * 10 + 5;
        this.height = Math.random() * 6 + 4;
        this.speed = Math.random() * 3 + 2;
        this.angle = Math.random() * 360;
        this.rotation = Math.random() * 5 - 2.5;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    update() {
        this.y += this.speed;
        this.x += Math.sin(this.angle * Math.PI / 180) * 2;
        this.angle += this.rotation;

        if (this.y > this.canvas!.height) {
            this.reset();
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    }
}
