import Camera from "./camera";
import Player from "./player";
import Point from "./point";

const MINIMAP_SIZE = 150;

export default class MiniMap {

    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;

    WORLD_WIDTH: number = 0;
    WORLD_HEIGHT: number = 0;

    bots: Player[] = [];
    player: Player | null = null;
    points: Point[] = [];
    camera: Camera | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        canvas.width = MINIMAP_SIZE;
        canvas.height = MINIMAP_SIZE;
    }

    setWorldSize(width: number, height: number) {
        this.WORLD_WIDTH = width;
        this.WORLD_HEIGHT = height;
    }

    setBots(bots: Player[]) {
        this.bots = bots;
    }

    setPlayer(player: Player) {
        this.player = player;
    }

    setPoints(points: Point[]) {
        this.points = points;
    }

    setCamera(camera: Camera) {
        this.camera = camera;
    }

    draw() {
        // Dibujar minimapa
        // minimapCtx.save();
        this.ctx!.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
        this.ctx!.fillStyle = 'white';
        this.ctx!.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
        // this.ctx!.strokeStyle = '#0ff';
        // this.ctx!.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
        // ctx.restore();
    
        // Escala para dibujar bots y jugador en el minimapa
        const minimapScaleWidth = MINIMAP_SIZE / this.WORLD_WIDTH;
        const minimapScaleHeight = MINIMAP_SIZE / this.WORLD_HEIGHT;
    
        // Dibujar bots en el minimapa
        this.bots.forEach(bot => {
            this.ctx!.fillStyle = bot.color;
            this.ctx!.beginPath();
            this.ctx!.arc(
                bot.x * minimapScaleWidth,
                bot.y * minimapScaleHeight,
                bot.size * minimapScaleWidth,
                0,
                Math.PI * 2
            );
            this.ctx!.fill();
        });
    
        // Dibujar posición del jugador en el minimapa
        this.ctx!.fillStyle = this.player!.color;
        this.ctx!.beginPath();
        this.ctx!.arc(
            this.player!.x * minimapScaleWidth,
            this.player!.y * minimapScaleHeight,
            this.player!.size * minimapScaleWidth,
            0,
            Math.PI * 2
        );
        this.ctx!.fill();
    
        // Dibujar comida en el minimapa
        this.ctx!.fillStyle = '#555';
        this.points.forEach(point => {
            this.ctx!.beginPath();
            this.ctx!.arc(
                point.x * minimapScaleWidth,
                point.y * minimapScaleHeight,
                point.size * minimapScaleWidth,
                0,
                Math.PI * 2
            );
            this.ctx!.fill();
        });
    
        // Dibujar cámara en el minimapa    
        this.ctx!.fillStyle = this.camera!.color;
        this.ctx!.fillRect(
            this.camera!.x * minimapScaleWidth,
            this.camera!.y * minimapScaleHeight,
            this.camera!.width * minimapScaleWidth,
            this.camera!.height * minimapScaleHeight
        );
        // minimapCtx.strokeStyle = camera.color;
        // minimapCtx.strokeRect(0, 0, minimapScale / 2, minimapScale / 2);   
    }
}