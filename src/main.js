import Player from './player.js';
import Camera from './camera.js';
import Point from './point.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const fogCanvas = document.getElementById('fogCanvas');
const fogCtx = fogCanvas.getContext('2d');

const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const MINIMAP_SIZE = 150;

// Configuración del game loop
const FIXED_FPS = 60;
const FRAME_TIME = 1000 / FIXED_FPS;
const MAX_FRAME_SKIP = 5;

let lastFrameTime = performance.now();
let deltaTime = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFps = 0;
let gameTimeMs = 0; // Tiempo total del juego en milisegundos
let gamePaused = false;

let fogStartTime = 0;  // Variable para almacenar el tiempo cuando se activa la niebla
let fogDuration = 5000; // Duración de la niebla en milisegundos (5 segundos)
let fogActive = false; // Variable para saber si la niebla está activa
let lastTimeChecked = 0; // Tiempo de la última comprobación de la niebla

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fogCanvas.width = window.innerWidth;
    fogCanvas.height = window.innerHeight;
    minimap.width = MINIMAP_SIZE;
    minimap.height = MINIMAP_SIZE;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Seguimiento del mouse
// const mouse = { x: 0, y: 0 };

// // Función para actualizar la posición del mouse/touch
// function updateMousePosition(e) {
//     const rect = canvas.getBoundingClientRect();
//     if (e.type.startsWith("touch")) {
//         // Si es un evento de toque, usa la primera posición del toque
//         mouse.x = e.touches[0].clientX - rect.left;
//         mouse.y = e.touches[0].clientY - rect.top;
//     } else {
//         // Si es un evento de mouse, usa las coordenadas del mouse
//         mouse.x = e.clientX - rect.left;
//         mouse.y = e.clientY - rect.top;
//     }
// }

// // Evento de mouse para escritorio
// canvas.addEventListener('mousemove', updateMousePosition);

// // Evento de touch para móviles
// canvas.addEventListener('touchmove', (e) => {
//     e.preventDefault(); // Para evitar el comportamiento predeterminado de desplazamiento o zoom
//     updateMousePosition(e);
// });

// // Variables para el joystick
// const joystick = { x: 0, y: 0, active: false };
// const joystickBase = { x: 0, y: 0 };
// const joystickRadius = 50;
// const handleRadius = 20;

// // Función para obtener la posición del evento (mouse o touch)
// function getEventPosition(e) {
//     const rect = canvas.getBoundingClientRect();
//     if (e.type.startsWith("touch")) {
//         return {
//             x: e.touches[0].clientX - rect.left,
//             y: e.touches[0].clientY - rect.top
//         };
//     } else {
//         return {
//             x: e.clientX - rect.left,
//             y: e.clientY - rect.top
//         };
//     }
// }

// // Función para iniciar el joystick
// function startJoystick(e) {
//     const pos = getEventPosition(e);
//     joystickBase.x = pos.x;
//     joystickBase.y = pos.y;
//     joystick.x = pos.x;
//     joystick.y = pos.y;
//     joystick.active = true;
// }

// // Función para mover el joystick
// function moveJoystick(e) {
//     if (joystick.active) {
//         const pos = getEventPosition(e);
//         const dx = pos.x - joystickBase.x;
//         const dy = pos.y - joystickBase.y;
//         const distance = Math.sqrt(dx * dx + dy * dy);

//         if (distance < joystickRadius) {
//             joystick.x = pos.x;
//             joystick.y = pos.y;
//         } else {
//             const angle = Math.atan2(dy, dx);
//             joystick.x = joystickBase.x + Math.cos(angle) * joystickRadius;
//             joystick.y = joystickBase.y + Math.sin(angle) * joystickRadius;
//         }
//     }
// }

// // Función para finalizar el joystick
// function endJoystick() {
//     joystick.active = false;
// }

// // Eventos para móviles
// canvas.addEventListener('touchstart', (e) => {
//     e.preventDefault();
//     startJoystick(e);
// });
// canvas.addEventListener('touchmove', (e) => {
//     e.preventDefault();
//     moveJoystick(e);
// });
// canvas.addEventListener('touchend', (e) => {
//     e.preventDefault();
//     endJoystick();
// });


// Control de teclas
const keys = {};
document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    // Agregar ceros a la izquierda cuando sea necesario
    const pad = (num) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}


// Bots para simular otros jugadores
let bots = Array(15).fill().map(() => {
    const bot = new Player(
        Math.random() * WORLD_WIDTH,
        Math.random() * WORLD_HEIGHT,
        20,
        Math.random() * 360,
        "Bot" + Math.floor(Math.random() * 1000),
        {
            x: Math.floor(Math.random() * (400 - 300 + 100) + 300),
            y: Math.floor(Math.random() * (400 - 300 + 100) + 300)
        }
    );
    bot.setType('bot');
    return bot;
});

// Puntos para recolectar
let points = Array(500).fill().map(() => {
    return new Point(
        Math.random() * WORLD_WIDTH,
        Math.random() * WORLD_HEIGHT,
        10,
        Math.random() * 360
    );
});

// Jugador
const player = new Player(
    WORLD_WIDTH / 2,
    WORLD_HEIGHT / 2,
    20,
    Math.random() * 360,
    "Player" + Math.floor(Math.random() * 1000)
);
player.setType('player');
player.setCanvas(canvas);
player.setSizeWorld(WORLD_WIDTH, WORLD_HEIGHT);

// Cámara
const camera = new Camera(0, 0, canvas.width, canvas.height);
camera.init(WORLD_WIDTH, WORLD_HEIGHT, player);

function updateBots(dt) {
    // Convertir deltaTime a segundos
    const dtSeconds = dt / 1000;

    bots.forEach(bot => {
        // Movimiento
        bot.x += bot.velocity.x * dtSeconds;
        bot.y += bot.velocity.y * dtSeconds;

        // Rebotar en los bordes
        if (bot.x < 0 || bot.x > WORLD_WIDTH) bot.velocity.x *= -1;
        if (bot.y < 0 || bot.y > WORLD_WIDTH) bot.velocity.y *= -1;

        // Colisión con puntos
        points = points.filter(point => {
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

        // Colisionar con el player
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bot.size + player.size) {
            if (bot.size > player.size) {
                bot.score += player.score + 10;
                bot.size += player.size * 0.5;
                // player.restart();
                location.reload();
            }
        }

        // Colisionar entre bots
        bots.forEach((otherBot) => {
            if (bot.id !== otherBot.id) {
                const dx = bot.x - otherBot.x;
                const dy = bot.y - otherBot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Si los bots colisionan
                if (distance < bot.size + otherBot.size) {
                    // El bot más grande "se come" al más pequeño
                    if (bot.size > otherBot.size) {
                        bot.score += otherBot.score + 10;
                        bot.size += otherBot.size * 0.5;
                        // El bot más pequeño es eliminado
                        bots = bots.filter(b => b.id !== otherBot.id);
                    } else {
                        otherBot.score += bot.score + 10;
                        otherBot.size += bot.size * 0.5;
                        // El bot más pequeño es eliminado
                        bots = bots.filter(b => b.id !== bot.id);
                    }
                }
            }
        });
    });
}

function spawnPoints() {
    // Número de puntos depende de la cantidad de bots
    const numberOfPoints = bots.length === 0 ? 0 : bots.length === 1 ? 10 : 50;

    if (bots.length === 0) {
        location.reload();
    }

    // Genera puntos mientras haya menos puntos de los que queremos
    while (points.length < numberOfPoints) {
        // Generar posiciones aleatorias para los puntos
        const x = Math.random() * WORLD_WIDTH;
        const y = Math.random() * WORLD_WIDTH;

        // Asegurarse de que los puntos no estén demasiado cerca de los bordes
        if (x < 20 || x > WORLD_WIDTH - 20 || y < 20 || y > WORLD_WIDTH - 20) {
            continue; // Saltar si el punto está cerca del borde
        }

        // Verificar que no haya otro punto cerca de este
        let isTooClose = false;
        for (let i = 0; i < points.length; i++) {
            const dx = x - points[i].x;
            const dy = y - points[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 20) {  // Si está demasiado cerca de otro punto, lo omitimos
                isTooClose = true;
                break;
            }
        }

        if (isTooClose) continue;

        // Crear un nuevo punto con color y tamaño aleatorio
        points.push(new Point(
            x,
            y,
            5,
            Math.random() * 360
        ));
    }
}

function updateLeaderboard() {
    const allPlayers = [...bots, player].sort((a, b) => b.score - a.score).slice(0, 5);
    document.getElementById('top').innerHTML = allPlayers
        .map((p, i) => `${i + 1}. ${p.name}: ${Math.floor(p.score)}`)
        .join('<br>');
    document.getElementById('playerCount').textContent = bots.length + 1;
}

function updateFpsCounter(currentTime) {
    frameCount++;

    if (currentTime - lastFpsUpdate >= 1000) {
        currentFps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdate));
        document.getElementById('fpsText').textContent = `FPS: ${currentFps}`;
        frameCount = 0;
        lastFpsUpdate = currentTime;
    }
}

function update(dt) {
    // Actualizar el tiempo del juego
    gameTimeMs += dt;

    // Comprobar si han pasado 5 segundos
    if (gameTimeMs - lastTimeChecked >= 5000) {
        lastTimeChecked = gameTimeMs;  // Actualiza el tiempo de la última comprobación
        // Alterna el estado de la niebla
        fogActive = !fogActive;

        // Si la niebla se activa, guarda el tiempo de inicio
        if (fogActive) {
            fogStartTime = gameTimeMs;
        }
    }

    // Actualizar timeDisplay
    document.getElementById('gameTime').textContent = `Time: ${formatTime(gameTimeMs)}`;

    // Actualizar estado
    player.update(keys, dt);
    camera.update(keys);
    updateBots(dt);
    spawnPoints();
    updateLeaderboard();

    // Colisión con puntos
    points = points.filter(point => {
        const dx = player.x - point.x;
        const dy = player.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.size + point.size) {
            player.score += 10;
            player.size += 0.5;
            return false;
        }
        return true;
    });


    // Colisión con bots
    bots = bots.filter(bot => {
        const dx = player.x - bot.x;
        const dy = player.y - bot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.size + bot.size) {
            if (player.size > bot.size) {
                player.score += bot.score + 10;
                player.size += bot.size * 0.5;
                return false;
            }
        }
        return true;
    });

}

function drawFog() {
    if (fogActive) {
        // Si ha pasado el tiempo de duración de la niebla, desactívala
        if (gameTimeMs - fogStartTime >= fogDuration) {
            fogActive = false;
        }
    }

    if (fogActive) {
        fogCtx.save();
        fogCtx.clearRect(0, 0, canvas.width, canvas.height);
        fogCtx.fillStyle = 'black';
        fogCtx.fillRect(0, 0, canvas.width, canvas.height);

        const screenX = player.x - camera.x;
        const screenY = player.y - camera.y;

        const radius = ((player.size * 0.50) * 10) + player.size;

        fogCtx.globalCompositeOperation = 'destination-out';
        const gradient = fogCtx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        fogCtx.fillStyle = gradient;
        fogCtx.beginPath();
        fogCtx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        fogCtx.fill();

        fogCtx.globalCompositeOperation = 'source-over';
        fogCtx.restore();
    } else {
        fogCtx.save();
        fogCtx.clearRect(0, 0, canvas.width, canvas.height);
        fogCtx.fillStyle = 'rgba(255, 255, 255, 0)';
        fogCtx.fillRect(0, 0, canvas.width, canvas.height);
        fogCtx.restore();
    }
}

function drawMinimap() {
    // Dibujar minimapa
    // minimapCtx.save();
    minimapCtx.fillStyle = 'white';
    minimapCtx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    // minimapCtx.strokeStyle = '#0ff';
    // minimapCtx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
    // ctx.restore();

    // Escala para dibujar bots y jugador en el minimapa
    const minimapScaleWidth = MINIMAP_SIZE / WORLD_WIDTH;
    const minimapScaleHeight = MINIMAP_SIZE / WORLD_HEIGHT;

    // Dibujar bots en el minimapa
    bots.forEach(bot => {
        minimapCtx.fillStyle = bot.color;
        minimapCtx.beginPath();
        minimapCtx.arc(
            bot.x * minimapScaleWidth,
            bot.y * minimapScaleHeight,
            3,
            0,
            Math.PI * 2
        );
        minimapCtx.fill();
    });

    // Dibujar posición del jugador en el minimapa
    minimapCtx.fillStyle = player.color;
    minimapCtx.beginPath();
    minimapCtx.arc(
        player.x * minimapScaleWidth,
        player.y * minimapScaleHeight,
        3,
        0,
        Math.PI * 2
    );
    minimapCtx.fill();

    // Dibujar comida en el minimapa
    minimapCtx.fillStyle = '#555';
    points.forEach(point => {
        minimapCtx.beginPath();
        minimapCtx.arc(
            point.x * minimapScaleWidth,
            point.y * minimapScaleHeight,
            1,
            0,
            Math.PI * 2
        );
        minimapCtx.fill();
    });

    // Dibujar cámara en el minimapa    
    minimapCtx.fillStyle = camera.color;
    minimapCtx.fillRect(
        camera.x * minimapScaleWidth,
        camera.y * minimapScaleHeight,
        camera.width * minimapScaleWidth,
        camera.height * minimapScaleHeight
    );
    // minimapCtx.strokeStyle = camera.color;
    // minimapCtx.strokeRect(0, 0, minimapScale / 2, minimapScale / 2);   
}

function draw() {
    // Fondo con trail
    ctx.fillStyle = fogActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Dibujar cuadrícula
    ctx.strokeStyle = fogActive ? 'black' : 'white';
    ctx.lineWidth = 1;
    const gridSize = 100;
    for (let x = 0; x < WORLD_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y < WORLD_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_WIDTH, y);
        ctx.stroke();
    }

    // Dibujar puntos
    points.forEach(point => point.draw(ctx));

    // Dibujar bots y jugador
    bots.forEach(bot => bot.draw(ctx));
    player.draw(ctx);

    // Dibujar cámara
    // camera.draw(ctx);
    ctx.restore();

    // Dibujar el joystick si está activo
    if (player.joystick.active) {
        ctx.beginPath();
        ctx.arc(player.joystickBase.x, player.joystickBase.y, player.joystickRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(player.joystick.x, player.joystick.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.fill();
    }

    // Dibujar el fog
    drawFog();

    // Dibujar minimapa
    drawMinimap();
}


// Eventos para el mouse
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.updateMousePosition(e.clientX - rect.left, e.clientY - rect.top);
});

// Eventos para el touch (joystick)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.startJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.updateJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    player.endJoystick();
});

function gameLoop(currentTime) {
    // Calcular el tiempo transcurrido
    deltaTime = currentTime - lastFrameTime;

    // Limitar el delta time para evitar saltos grandes
    if (deltaTime > 1000) {
        deltaTime = FRAME_TIME;
    }

    // Acumular tiempo y actualizar mientras sea necesario
    let framesToProcess = Math.floor(deltaTime / FRAME_TIME);

    // Limitar el número de frames que se pueden procesar
    if (framesToProcess > MAX_FRAME_SKIP) {
        framesToProcess = MAX_FRAME_SKIP;
    }

    // Procesar los frames necesarios
    if (framesToProcess > 0) {
        // Actualizar el juego el número correcto de veces
        for (let i = 0; i < framesToProcess; i++) {
            update(FRAME_TIME);
        }

        // Dibujar una vez después de todas las actualizaciones
        draw();

        // Actualizar el tiempo del último frame
        lastFrameTime = currentTime - (deltaTime % FRAME_TIME);
    }

    // Actualizar contador de FPS
    updateFpsCounter(currentTime);

    // Programar el siguiente frame
    requestAnimationFrame(gameLoop);
}

const music = document.getElementById('backgroundMusic');
const musicButtonContainer = document.getElementById('musicButtonContainer');
const startMusicButton = document.getElementById('startMusicButton');

// Evento de clic para comenzar la música
startMusicButton.addEventListener('click', () => {
    music.play(); // Reproducir la música
    musicButtonContainer.style.display = 'none'; // Mostrar los botones de música

    // Iniciar el game loop
    lastFrameTime = performance.now();
    lastFpsUpdate = lastFrameTime;
    requestAnimationFrame(gameLoop);
});

