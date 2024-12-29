import Camera from "./camera";
import Player from "./player";

export default class FogOfWar {

    canvasFogWar: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    canvas: HTMLCanvasElement | null = null;
    player: Player | null = null;
    camera: Camera | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvasFogWar = canvas;
        this.ctx = this.canvasFogWar.getContext('2d') as CanvasRenderingContext2D;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    setPlayer(player: Player) {
        this.player = player;
    }

    setCamera(camera: Camera) {
        this.camera = camera;
    }

    drawDarken() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

        const screenX = this.player!.x - this.camera!.x;
        const screenY = this.player!.y - this.camera!.y;

        const radius = ((this.player!.size * 0.50) * 10) + this.player!.size;

        this.ctx.globalCompositeOperation = 'destination-out';
        const gradient = this.ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();

    }

    drawLighten() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        this.ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
        this.ctx.restore();
    }

}