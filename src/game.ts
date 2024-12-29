import Camera from "./camera";
import Confetti from "./confetti";
import FogOfWar from "./fog-war";
import MiniMap from "./mini-map";
import Player from "./player";
import Point from "./point";
import { formatTime } from "./util";

const FIXED_FPS = 60;
const FRAME_TIME = 1000 / FIXED_FPS;
const MAX_FRAME_SKIP = 5;

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const INITIAL_BOT_COUNT = 15;
const INITIAL_POINT_COUNT = 500;

const top = document.getElementById('top') as HTMLDivElement;
const playerCount = document.getElementById('playerCount') as HTMLSpanElement;
const fpsText = document.getElementById('fpsText') as HTMLSpanElement;
const gameTime = document.getElementById('gameTime') as HTMLSpanElement;

const music = document.getElementById('backgroundMusic') as HTMLAudioElement;

export default class Game {

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private miniMap: MiniMap | null = null;
    private fogOfWar: FogOfWar | null = null;
    private camera: Camera | null = null;
    private player: Player | null = null;

    private bots: Player[] = [];
    private points: Point[] = [];

    private lastFrameTime: number = 0;
    private deltaTime: number = 0;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;
    private currentFps: number = 0;
    private gameTimeMs: number = 0;

    private fogStartTime: number = 0;
    private fogDuration: number = 5000;
    private fogActive: boolean = false;
    private lastTimeChecked: number = 0;

    private gameOver: boolean = false;
    private gameWinner: boolean = false;
    private conettis: Confetti[] = [];
    private restartButton: HTMLDivElement | null = null;
    private titleMessage: HTMLDivElement | null = null;
    private descriptionMessage: HTMLDivElement | null = null;
    private startButton: HTMLButtonElement | null = null;

    constructor(canvas: HTMLCanvasElement, canvasMiniMap: HTMLCanvasElement, fogCanvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        this.initializeUI();
        this.initializeGame(canvasMiniMap, fogCanvas);
        this.setupControls();
    }

    private initializeUI() {
        // Create restart button
        // Crear el contenedor principal
        this.restartButton = document.createElement("div");
        this.restartButton.className = "musicButtonContainer";
        this.restartButton.style.display = "none";

        // Crear y agregar el título
        this.titleMessage = document.createElement("h1");
        this.restartButton.appendChild(this.titleMessage);

        // Crear y agregar la descripción
        this.descriptionMessage = document.createElement("p");
        this.restartButton.appendChild(this.descriptionMessage);

        // Crear y agregar el botón
        this.startButton = document.createElement("button");
        this.startButton.addEventListener("click", () => this.restart());
        this.restartButton.appendChild(this.startButton);

        // Agregar el contenedor al cuerpo del documento
        document.body.appendChild(this.restartButton);
    }

    private initializeGame(canvasMiniMap: HTMLCanvasElement, fogCanvas: HTMLCanvasElement) {
        // Initialize minimap
        this.miniMap = new MiniMap(canvasMiniMap);
        this.miniMap.setWorldSize(WORLD_WIDTH, WORLD_HEIGHT);

        // Initialize fog of war
        this.fogOfWar = new FogOfWar(fogCanvas);
        this.fogOfWar.setCanvas(this.canvas);

        this.initializeBots();
        this.initializePoints();
        this.initializePlayer();
        this.initializeCamera();
        this.initializeConfetti();

        this.updateMiniMapReferences();
    }

    private initializeBots() {
        this.bots = Array(INITIAL_BOT_COUNT).fill(0).map(() => {
            // Crear velocidad inicial aleatoria en una dirección
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (450 - 350) + 350; // Velocidad entre 350 y 450

            const bot = new Player(
                Math.random() * WORLD_WIDTH,
                Math.random() * WORLD_HEIGHT,
                20,
                Math.random() * 360,
                "Bot" + Math.floor(Math.random() * 1000),
                {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                }
            );
            bot.setType('bot');
            return bot;
        });
    }

    private initializePoints() {
        this.points = Array(INITIAL_POINT_COUNT).fill(0).map(() => {
            return new Point(
                Math.random() * WORLD_WIDTH,
                Math.random() * WORLD_HEIGHT,
                10,
                Math.random() * 360
            );
        });
    }

    private initializePlayer() {
        this.player = new Player(
            WORLD_WIDTH / 2,
            WORLD_HEIGHT / 2,
            20,
            Math.random() * 360,
            "Player" + Math.floor(Math.random() * 1000)
        );
        this.player.setType('player');
        this.player.setCanvas(this.canvas);
        this.player.setSizeWorld(WORLD_WIDTH, WORLD_HEIGHT);
    }

    private initializeCamera() {
        this.camera = new Camera(0, 0, this.canvas.width, this.canvas.height);
        this.camera.init(WORLD_WIDTH, WORLD_HEIGHT, this.player!);
    }

    private initializeConfetti() {
        this.conettis = Array(100).fill(0).map(() => {
            return new Confetti(this.canvas);
        });
    }

    private updateMiniMapReferences() {
        this.miniMap!.setBots(this.bots);
        this.miniMap!.setPoints(this.points);
        this.miniMap!.setPlayer(this.player!);
        this.miniMap!.setCamera(this.camera!);
        this.fogOfWar!.setPlayer(this.player!);
        this.fogOfWar!.setCamera(this.camera!);
    }

    private setupControls() {
        // Eventos para el mouse
        this.canvas!.addEventListener('mousemove', (e) => {
            const rect = this.canvas!.getBoundingClientRect();
            this.player!.updateMousePosition(e.clientX - rect.left, e.clientY - rect.top);
        });

        // Eventos para el touch (joystick)
        this.canvas!.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas!.getBoundingClientRect();
            const touch = e.touches[0];
            this.player!.startJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });

        this.canvas!.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas!.getBoundingClientRect();
            const touch = e.touches[0];
            this.player!.updateJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
        }, { passive: false });

        this.canvas!.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.player!.endJoystick();
        });
    }

    restart() {
        this.gameOver = false;
        this.gameWinner = false;
        this.gameTimeMs = 0;
        this.lastTimeChecked = 0;
        this.fogActive = false;
        this.restartButton!.style.display = 'none';

        // Reset game elements
        this.initializeBots();
        this.initializePoints();
        // this.initializePlayer();
        this.player?.restart();
        this.updateMiniMapReferences();

        // Restart game loop
        this.lastFrameTime = performance.now();
        this.start();
        music.currentTime = 0;
        music.play();
    }

    private handleGameOver() {
        this.gameOver = true;
        this.restartButton!.style.display = 'flex';
        this.titleMessage!.textContent = "No pudiste escapar";
        this.descriptionMessage!.textContent = "Vuelve a intentarlo y sé el mayor devorador de bolas.";
        this.startButton!.textContent = "Intentar de Nuevo";
    }

    private handleGameWinner() {
        this.gameWinner = true;
        this.restartButton!.style.display = 'flex';
        this.titleMessage!.textContent = "¡Ganaste!";
        this.descriptionMessage!.textContent = "¡Ganaste! Eres el mayor devorador de bolas.";
        this.startButton!.textContent = "A jugar de Nuevo";
    }

    updateBots(dt: number) {
        // Convertir deltaTime a segundos
        const dtSeconds = dt / 1000;

        this.bots.forEach(bot => {
            // Movimiento
            bot.x += bot.velocity.x * dtSeconds;
            bot.y += bot.velocity.y * dtSeconds;

            // Rebotar en los bordes
            if (bot.x < 0 || bot.x > WORLD_WIDTH) bot.velocity.x *= -1;
            if (bot.y < 0 || bot.y > WORLD_WIDTH) bot.velocity.y *= -1;

            // Colisión con puntos
            this.points = this.points.filter(point => {
                const dx = bot.x - point.x;
                const dy = bot.y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < bot.size + point.size) {
                    bot.score += 10;
                    bot.size += 0.5;
                    return false;
                }
                return true;
            });

            // Colisionar entre bots
            this.bots.forEach((otherBot: Player) => {
                if (bot.id !== otherBot.id) {
                    const dx = bot.x - otherBot.x;
                    const dy = bot.y - otherBot.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Si los bots colisionan
                    if (distance < bot.size + otherBot.size) {
                        // El bot más grande "se come" al más pequeño
                        if (bot.size > otherBot.size) {
                            bot.score += otherBot.score + 10;
                            bot.size += (otherBot.size / 2) + 0.5;
                            // El bot más pequeño es eliminado
                            this.bots = this.bots.filter(b => b.id !== otherBot.id);
                        } else {
                            otherBot.score += bot.score + 10;
                            otherBot.size += (bot.size / 2) + 0.5;
                            // El bot más pequeño es eliminado
                            this.bots = this.bots.filter((b: Player) => b.id !== bot.id);
                        }
                    }
                }
            });
        });
    }

    spawnPoints() {
        // Número de puntos depende de la cantidad de bots
        const numberOfPoints = this.bots.length === 0 ? 0 : this.bots.length === 1 ? 10 : 50;

        // Genera puntos mientras haya menos puntos de los que queremos
        while (this.points.length < numberOfPoints) {
            // Generar posiciones aleatorias para los puntos
            const x = Math.random() * WORLD_WIDTH;
            const y = Math.random() * WORLD_WIDTH;

            // Asegurarse de que los puntos no estén demasiado cerca de los bordes
            if (x < 20 || x > WORLD_WIDTH - 20 || y < 20 || y > WORLD_WIDTH - 20) {
                continue; // Saltar si el punto está cerca del borde
            }

            // Verificar que no haya otro punto cerca de este
            let isTooClose = false;
            for (let i = 0; i < this.points.length; i++) {
                const dx = x - this.points[i].x;
                const dy = y - this.points[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 20) {  // Si está demasiado cerca de otro punto, lo omitimos
                    isTooClose = true;
                    break;
                }
            }

            if (isTooClose) continue;

            // Crear un nuevo punto con color y tamaño aleatorio
            this.points.push(new Point(
                x,
                y,
                5,
                Math.random() * 360
            ));
        }
    }

    updateLeaderboard() {
        // Combina los bots y el jugador en un solo arreglo
        const players = [...this.bots, this.player];

        // Ordena los jugadores por puntaje de mayor a menor
        const sortedPlayers = players.sort((a, b) => b!.score - a!.score);

        // Selecciona los 5 mejores jugadores
        const topPlayers = sortedPlayers.slice(0, 5);

        // Genera el HTML para mostrar los mejores jugadores
        top.innerHTML = topPlayers
            .map((player, index) => {
                const rank = index + 1; // La posición en la tabla (1-based index)
                const name = player!.name;
                const score = Math.floor(player!.score); // Redondea el puntaje
                return `${rank}. ${name}: ${score}`;
            })
            .join('<br>'); // Agrega un salto de línea entre los jugadores

        // Actualiza el contador de jugadores
        const totalPlayers = this.bots.length + 1; // Bots + el jugador actual
        playerCount.textContent = String(totalPlayers);
    }

    update(dt: number) {
        if (this.gameOver) return;

        if (this.gameWinner) {
            this.conettis.forEach(confetti => {
                confetti.update();
            });
            return;
        }

        // Actualizar el tiempo del juego
        this.gameTimeMs += dt;

        // Comprobar si han pasado 5 segundos
        if (this.gameTimeMs - this.lastTimeChecked >= 5000) {
            this.lastTimeChecked = this.gameTimeMs;  // Actualiza el tiempo de la última comprobación
            // Alterna el estado de la niebla
            this.fogActive = !this.fogActive;

            // Si la niebla se activa, guarda el tiempo de inicio
            if (this.fogActive) {
                this.fogStartTime = this.gameTimeMs;
            }
        }

        // Actualizar timeDisplay
        gameTime.textContent = `Time: ${formatTime(this.gameTimeMs)}`;

        // Actualizar estado
        this.player!.update(dt);
        this.camera!.update();
        this.updateBots(dt);
        this.spawnPoints();
        this.updateLeaderboard();

        // Player se comer una bolita
        this.points = this.points.filter((point: Point) => {
            const dx = this.player!.x - point.x;
            const dy = this.player!.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player!.size + point.size) {
                this.player!.score += 10;
                this.player!.size += 0.5;
                return false;
            }
            return true;
        });


        // Player se come a un bot
        this.bots = this.bots.filter((bot: Player) => {
            const dx = this.player!.x - bot.x;
            const dy = this.player!.y - bot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.player!.size + bot.size) {
                if (this.player!.size > bot.size) {
                    this.player!.score += bot.score + 10;
                    this.player!.size += (bot.size / 2) + 0.5;
                    return false;
                }
            }
            return true;
        });

        // Bot mata al jugador
        this.bots.forEach(bot => {
            const dx = this.player!.x - bot.x;
            const dy = this.player!.y - bot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bot.size + this.player!.size && bot.size > this.player!.size) {
                this.handleGameOver();
            }
        });

        // Si no hay bots, reiniciar el juego
        if (this.bots.length === 0) {
            this.handleGameWinner();
        }
    }

    draw() {
        // Fondo con trail
        this.ctx!.fillStyle = this.fogActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
        this.ctx!.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

        this.ctx!.save();
        this.ctx!.translate(-this.camera!.x, -this.camera!.y);

        // Dibujar cuadrícula
        this.ctx!.strokeStyle = this.fogActive ? 'black' : 'white';
        this.ctx!.lineWidth = 1;
        const gridSize = 100;
        for (let x = 0; x < WORLD_WIDTH; x += gridSize) {
            this.ctx!.beginPath();
            this.ctx!.moveTo(x, 0);
            this.ctx!.lineTo(x, WORLD_HEIGHT);
            this.ctx!.stroke();
        }
        for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {
            this.ctx!.beginPath();
            this.ctx!.moveTo(0, y);
            this.ctx!.lineTo(WORLD_WIDTH, y);
            this.ctx!.stroke();
        }

        // Dibujar puntos
        this.points.forEach(point => point.draw(this.ctx!));

        // Dibujar bots y jugador
        this.bots.forEach(bot => bot.draw(this.ctx!));
        this.player!.draw(this.ctx!);

        // Dibujar cámara
        // camera.draw(this.ctx!);
        this.ctx!.restore();

        // Dibujar el joystick si está activo
        if (this.player!.joystick.active) {
            this.ctx.beginPath();
            this.ctx.arc(this.player!.joystickBase.x, this.player!.joystickBase.y, this.player!.joystickRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.arc(this.player!.joystick.x, this.player!.joystick.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
            this.ctx.fill();
        }

        // Dibujar el fog
        if (this.fogActive) {
            // Si ha pasado el tiempo de duración de la niebla, desactívala
            if (this.gameTimeMs - this.fogStartTime >= this.fogDuration) {
                this.fogActive = false;
            }
        }

        if (this.fogActive) {
            this.fogOfWar!.drawDarken();
        } else {
            this.fogOfWar!.drawLighten();
        }

        // Dibujar minimapa
        this.miniMap!.setBots(this.bots);
        this.miniMap!.setPoints(this.points);
        this.miniMap!.draw();

        // Dibujar confettis
        if (this.gameWinner) {
            this.conettis.forEach(confetti => {
                confetti.draw(this.ctx);
            });
            return;
        }

    }

    updateFpsCounter(currentTime: number) {
        this.frameCount++;

        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            fpsText.textContent = `FPS: ${this.currentFps}`;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }
    }

    gameLoop(currentTime: number) {
        // Calcular el tiempo transcurrido
        this.deltaTime = currentTime - this.lastFrameTime;

        // Limitar el delta time para evitar saltos grandes
        if (this.deltaTime > 1000) {
            this.deltaTime = FRAME_TIME;
        }

        // Acumular tiempo y actualizar mientras sea necesario
        let framesToProcess = Math.floor(this.deltaTime / FRAME_TIME);

        // Limitar el número de frames que se pueden procesar
        if (framesToProcess > MAX_FRAME_SKIP) {
            framesToProcess = MAX_FRAME_SKIP;
        }

        // Procesar los frames necesarios
        if (framesToProcess > 0) {
            // Actualizar el juego el número correcto de veces
            for (let i = 0; i < framesToProcess; i++) {
                this.update(FRAME_TIME);
            }

            // Dibujar una vez después de todas las actualizaciones
            this.draw();

            // Actualizar el tiempo del último frame
            this.lastFrameTime = currentTime - (this.deltaTime % FRAME_TIME);
        }

        // Actualizar contador de FPS
        this.updateFpsCounter(currentTime);

        // Programar el siguiente frame
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    start() {
        this.lastFrameTime = performance.now();
        this.lastFpsUpdate = this.lastFrameTime;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

}