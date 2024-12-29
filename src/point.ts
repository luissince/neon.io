export default class Point {

    // x, y, size, hue
    x: number;
    y: number;
    size: number;
    hue: number;

    constructor(x: number, y: number, size: number, hue: number) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.hue = hue;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}