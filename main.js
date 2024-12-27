const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const minimap = document.getElementById('minimap');
const minimapCtx = minimap.getContext('2d');

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;
const MINIMAP_SIZE = 150;

const fps = 60;
let frameInterval = 1000 / fps;
let lastFrameTime = 0;
let accumulator = 0;

// Para el cálculo de FPS
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFps = 0;

// Para mostrar/ocultar FPS
let showFps = true;
let lastPressTime = 0;

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

// Jugador
const player = new Player(
    WORLD_WIDTH / 2,
    WORLD_HEIGHT / 2,
    20,
    Math.random() * 360,
    "Player" + Math.floor(Math.random() * 1000)
);
player.setType('player');

// Bots para simular otros jugadores
let bots = Array(10).fill().map(() => {
    const bot = new Player(
        Math.random() * WORLD_WIDTH,
        Math.random() * WORLD_HEIGHT,
        20,
        Math.random() * 360,
        "Bot" + Math.floor(Math.random() * 1000),
        {
            x: Math.random() * 10 - 2,
            y: Math.random() * 10 - 2
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
        5,
        Math.random() * 360
    );
});

// Cámara
const camera = new Camera(0, 0, canvas.width, canvas.height);
camera.init(WORLD_WIDTH, WORLD_HEIGHT, player);

function updatePlayer() {
    // Movimiento suave hacia el mouse
    player.update(keys, WORLD_WIDTH, WORLD_HEIGHT, canvas);

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

function updateBots() {
    bots.forEach(bot => {
        // Movimiento
        bot.x += bot.velocity.x;
        bot.y += bot.velocity.y;

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
                player.restart();
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

    document.getElementById('fpsText').textContent = currentFps.toFixed(2);
}

function update() {
    // Actualizar estado
    updatePlayer();
    camera.update(keys);
    updateBots();
    spawnPoints();
    updateLeaderboard();

}

function draw() {
    // Fondo con trail
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Dibujar cuadrícula
    ctx.strokeStyle = '#345222';
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
    player.draw(ctx, canvas);

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


    // if (joystick.active) {
    //     // Dibujar base del joystick
    //     ctx.beginPath();
    //     ctx.arc(joystickBase.x, joystickBase.y, joystickRadius, 0, Math.PI * 2);
    //     ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
    //     ctx.fill();

    //     // Dibujar el mango del joystick
    //     ctx.beginPath();
    //     ctx.arc(joystick.x, joystick.y, handleRadius, 0, Math.PI * 2);
    //     ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    //     ctx.fill();
    // }

    // Dibujar minimapa
    // minimapCtx.save();
    minimapCtx.fillStyle = '#000';
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

function calculateFps(currentTime) {
    frameCount++;

    if (currentTime > lastFpsUpdate + 1000) { // Actualizar FPS cada segundo
        currentFps = frameCount * 1000 / (currentTime - lastFpsUpdate);
        lastFpsUpdate = currentTime;
        frameCount = 0;
    }
}


// Eventos para el mouse
canvas.addEventListener('mousemove', (e) => {
    console.log("Mouse move");
    const rect = canvas.getBoundingClientRect();
    player.updateMousePosition(e.clientX - rect.left, e.clientY - rect.top);
});

// Eventos para el touch (joystick)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    console.log("Touch start");
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.startJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    console.log("Touch move");
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    player.updateJoystick(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    console.log("Touch end");
    player.endJoystick();
});

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    const deltaTime = currentTime - lastFrameTime;
    accumulator += deltaTime;

    calculateFps(currentTime);

    while (accumulator >= frameInterval) {
        update();
        accumulator -= frameInterval;
    }

    draw();

    lastFrameTime = currentTime;
}

lastFrameTime = performance.now();
lastFpsUpdate = lastFrameTime;
requestAnimationFrame(gameLoop);