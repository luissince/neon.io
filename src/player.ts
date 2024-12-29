import Camera from "./camera";

// Jugador
export type PlayerType = 'player' | 'bot';

export default class Player {

    // x, y, size, hue, name, velocity
    x: number;
    y: number;
    size: number;
    hue: number;
    name: string;
    score: number;
    velocity: { x: number, y: number };

    initialX: number;
    initialY: number;
    initialSize: number;
    initialHue: number;
    initialName: string;
    initialVelocity: { x: number, y: number };

    id: string;
    color: string;
    speed: number;
    mouse: { x: number, y: number };
    joystick: { x: number, y: number, active: boolean };
    joystickBase: { x: number, y: number };
    joystickRadius: number;
    lastJoystickDirection: { x: number, y: number };
    currentVelocity: { x: number, y: number };
    deceleration: number;

    canvas: HTMLCanvasElement | null = null;
    worldWidth: number = 0;
    worldHeight: number = 0;

    type: PlayerType = 'player';

    camera: Camera | null = null;

    constructor(x: number, y: number, size: number, hue: number, name: string, velocity = { x: 0, y: 0 }) {
        // Almacenar los valores iniciales
        this.initialX = x;
        this.initialY = y;
        this.initialSize = size;
        this.initialHue = hue;
        this.initialName = name;
        this.initialVelocity = { ...velocity };

        // Inicializar las propiedades actuales con los valores iniciales
        this.id = `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.x = x;
        this.y = y;
        this.size = size;
        this.hue = hue;
        this.name = name;
        this.score = 0;
        this.velocity = velocity;

        this.color = `hsl(${hue}, 100%, 50%)`;
        this.speed = 350; // pixels por segundo

        this.mouse = { x: 0, y: 0 };
        this.joystick = { x: 0, y: 0, active: false };
        this.joystickBase = { x: 0, y: 0 };
        this.joystickRadius = 50;
        this.lastJoystickDirection = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        this.deceleration = 0.95; // Factor de desaceleración
    }

    setCamera(camera: Camera) {
        this.camera = camera;
    }

    setType(type: PlayerType) {
        this.type = type;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    setSizeWorld(width: number, height: number) {
        this.worldWidth = width;
        this.worldHeight = height;
    }

    updateMousePosition(x: number, y: number) {
        this.mouse.x = x;
        this.mouse.y = y;
    }

    updateJoystick(x: number, y: number) {
        if (this.joystick.active) {
            const dx = x - this.joystickBase.x;
            const dy = y - this.joystickBase.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.joystickRadius) {
                this.joystick.x = x;
                this.joystick.y = y;
            } else {
                const angle = Math.atan2(dy, dx);
                this.joystick.x = this.joystickBase.x + Math.cos(angle) * this.joystickRadius;
                this.joystick.y = this.joystickBase.y + Math.sin(angle) * this.joystickRadius;
            }

            // Actualizar la última dirección del joystick
            this.lastJoystickDirection.x = this.joystick.x - this.joystickBase.x;
            this.lastJoystickDirection.y = this.joystick.y - this.joystickBase.y;
            const directionMagnitude = Math.sqrt(
                this.lastJoystickDirection.x ** 2 + this.lastJoystickDirection.y ** 2
            );
            if (directionMagnitude > 0) {
                this.lastJoystickDirection.x /= directionMagnitude;
                this.lastJoystickDirection.y /= directionMagnitude;
            }
        }
    }

    startJoystick(x: number, y: number) {
        this.joystickBase.x = x;
        this.joystickBase.y = y;
        this.joystick.x = x;
        this.joystick.y = y;
        this.joystick.active = true;
    }

    endJoystick() {
        this.joystick.active = false;
    }

    restart() {
        // Restaurar los valores iniciales
        this.x = this.initialX;
        this.y = this.initialY;
        this.size = this.initialSize;
        this.hue = this.initialHue;
        this.name = this.initialName;
        this.velocity = { ...this.initialVelocity };
        this.score = 0;

        this.color = `hsl(${this.hue}, 100%, 50%)`;

        this.mouse = { x: 0, y: 0 };
        this.joystick = { x: 0, y: 0, active: false };
        this.joystickBase = { x: 0, y: 0 };
        this.joystickRadius = 50;
        this.lastJoystickDirection = { x: 0, y: 0 };
        this.currentVelocity = { x: 0, y: 0 };
        this.deceleration = 0.95; // Factor de desaceleración
    }

    update(dt: number) {
        // Convertir dt a segundos para cálculos más precisos
        const dtSeconds = dt / 1000;

        // Posición central del canvas
        const centerX = this.canvas!.width / 2;
        const centerY = this.canvas!.height / 2;

        // Vector de velocidad normalizado
        let velocityX = 0;
        let velocityY = 0;

        if (this.joystick.active) {
            // Movimiento con joystick normalizado
            const dx = this.joystick.x - this.joystickBase.x;
            const dy = this.joystick.y - this.joystickBase.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = this.joystickRadius;

            if (distance > 0) {
                // Normalizar la dirección y aplicar la intensidad basada en la distancia
                const intensity = Math.min(distance / maxDistance, 1.0);
                velocityX = (dx / distance) * intensity;
                velocityY = (dy / distance) * intensity;
            }
        } else {
            // Movimiento con mouse normalizado
            const dx = this.mouse.x - centerX;
            const dy = this.mouse.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Zona muerta para evitar movimientos pequeños no deseados
            const deadzone = 10;
            if (distance > deadzone) {
                // Normalizar el vector de dirección
                velocityX = dx / distance;
                velocityY = dy / distance;
            }
        }

        // Aplicar velocidad y aceleración/desaceleración
        if (velocityX !== 0 || velocityY !== 0) {
            // Aceleración gradual
            const targetVelocityX = velocityX * this.speed;
            const targetVelocityY = velocityY * this.speed;

            // Interpolación suave entre velocidad actual y objetivo
            this.currentVelocity.x += (targetVelocityX - this.currentVelocity.x) * 0.1;
            this.currentVelocity.y += (targetVelocityY - this.currentVelocity.y) * 0.1;
        } else if (Math.abs(this.currentVelocity.x) > 0.1 || Math.abs(this.currentVelocity.y) > 0.1) {
            // Desaceleración cuando no hay input
            this.currentVelocity.x *= this.deceleration;
            this.currentVelocity.y *= this.deceleration;
        } else {
            // Detener completamente si la velocidad es muy baja
            this.currentVelocity.x = 0;
            this.currentVelocity.y = 0;
        }

        // Aplicar el movimiento con delta time
        const moveX = this.currentVelocity.x * dtSeconds;
        const moveY = this.currentVelocity.y * dtSeconds;

        // Actualizar posición con colisión con los bordes
        this.x = Math.max(
            this.size,
            Math.min(this.worldWidth - this.size, this.x + moveX)
        );
        this.y = Math.max(
            this.size,
            Math.min(this.worldHeight - this.size, this.y + moveY)
        );

        // Convertir dt a segundos para cálculos más precisos
        // const dtSeconds = dt / 1000;


        /**
         * Movimiento con teclas
         */

        // const temp = {
        //     x: this.x,
        //     y: this.y
        // }

        // if (keys['ArrowLeft']) temp.x -= this.speed;
        // if (keys['ArrowRight']) temp.x += this.speed;
        // if (keys['ArrowUp']) temp.y -= this.speed;
        // if (keys['ArrowDown']) temp.y += this.speed;

        // this.x = Math.max(this.size, Math.min(worldWidth - this.size, temp.x));
        // this.y = Math.max(this.size, Math.min(worldHeight - this.size, temp.y));


        /**
         * Movimiento con ratón
         */

        // // Calcular dirección hacia el mouse
        // const centerX = this.canvas!.width / 2;
        // const centerY = this.canvas!.height / 2;

        // if (this.joystick.active) {
        //     // Movimiento con joystick
        //     const dx = this.joystick.x - this.joystickBase.x;
        //     const dy = this.joystick.y - this.joystickBase.y;
        //     const distance = Math.sqrt(dx * dx + dy * dy);
        //     const maxDistance = this.joystickRadius;

        //     if (distance > 0) {
        //         const baseSpeed = (distance / maxDistance) * this.speed;
        //         this.currentVelocity.x = (dx / distance) * baseSpeed * dtSeconds;
        //         this.currentVelocity.y = (dy / distance) * baseSpeed * dtSeconds;
        //     }
        // } else if (Math.abs(this.currentVelocity.x) > 0.1 || Math.abs(this.currentVelocity.y) > 0.1) {
        //     // Desaceleración gradual cuando el joystick no está activo
        //     this.currentVelocity.x *= this.deceleration;
        //     this.currentVelocity.y *= this.deceleration;
        // } else {
        //     // Calcular el ángulo hacia el mouse
        //     const dx = this.mouse.x - centerX;
        //     const dy = this.mouse.y - centerY;
        //     const angle = Math.atan2(dy, dx);

        //     // Mover en esa dirección con velocidad constante
        //     if (Math.abs(dx) > 10 || Math.abs(dy) > 10) { // pequeña zona muerta
        //         this.x += Math.cos(angle) * this.speed * dtSeconds;
        //         this.y += Math.sin(angle) * this.speed * dtSeconds;
        //     } else {
        //         this.currentVelocity.x = 0;
        //         this.currentVelocity.y = 0;
        //     }
        // }

        // // Aplicar el movimiento
        // this.x += this.currentVelocity.x;
        // this.y += this.currentVelocity.y;

        // // Limitar al mundo
        // this.x = Math.max(0, Math.min(this.worldWidth, this.x));
        // this.y = Math.max(0, Math.min(this.worldHeight, this.y));
        // // this.x = Math.max(this.size, Math.min(this.worldWidth - this.size, this.x));
        // // this.y = Math.max(this.size, Math.min(this.worldHeight - this.size, this.y));


        // // Movimiento suave hacia el mouse
        // const dx = mouse.x - player.x;
        // const dy = mouse.y - player.y;
        // const distance = Math.sqrt(dx * dx + dy * dy);

        // // if (distance > 0) {
        // //     const speed = 5;
        // //     player.x += (dx / distance) * speed;
        // //     player.y += (dy / distance) * speed;
        // // }

        // if (distance > 1) {
        //     const maxSpeed = 10;
        //     const acceleration = 0.2;
        //     const speed = Math.min(distance * acceleration, maxSpeed);
        //     player.x += (dx / distance) * speed;
        //     player.y += (dy / distance) * speed;
        // }
    }

    draw(ctx: CanvasRenderingContext2D) {

        // ctx.save();
        // ctx.fillStyle = this.color;
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        // ctx.fill();

        // if (this.type === 'player') {
        //     // Dirección del mouse (línea que indica hacia dónde va)
        //     const angle = Math.atan2(this.mouse.y - this.canvas.height / 2, this.mouse.x - this.canvas.width / 2);
        //     ctx.beginPath();
        //     ctx.moveTo(this.x, this.y);
        //     ctx.lineTo(
        //         this.x + Math.cos(angle) * 40,
        //         this.y + Math.sin(angle) * 40
        //     );
        //     ctx.strokeStyle = 'black';
        //     ctx.stroke();
        // }

        // ctx.restore();

        // Efecto de brillo
        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;

        // Cuerpo principal
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Ojos
        const eyeSize = this.size * 0.2;
        const pupilSize = this.size * 0.1;

        // Dibujar los ojos
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size * 0.3, -eyeSize, eyeSize, 0, Math.PI * 2); // Ojo derecho
        ctx.arc(-this.size * 0.3, -eyeSize, eyeSize, 0, Math.PI * 2); // Ojo izquierdo
        ctx.fill();

        // Calcular la dirección de las pupilas
        const eyeCenterXRight = this.size * 0.3;
        const eyeCenterXLeft = -this.size * 0.3;
        const eyeCenterY = -eyeSize;
        let angle;

        if (this.type === 'player') {
            if (this.joystick.active) {
                // Usar la posición del joystick para los ojos cuando está activo
                const dx = this.joystick.x - this.joystickBase.x;
                const dy = this.joystick.y - this.joystickBase.y;
                angle = Math.atan2(dy, dx);
            } else {
                // Usar la posición del mouse cuando el joystick no está activo
                angle = Math.atan2(this.mouse.y - this.canvas!.height / 2, this.mouse.x - this.canvas!.width / 2);
            }
        } else {
            // Movimiento automático para los bots (simulando el comportamiento de la pupila)
            // Los bots no siguen al mouse, sino que se mueven aleatoriamente
            angle = Math.atan2(this.velocity.y, this.velocity.x); // Movimiento del bot basado en la velocidad
        }

        // Calcular la posición de las pupilas para ambos ojos
        const pupilXRight = eyeCenterXRight + Math.cos(angle) * (eyeSize - pupilSize);
        const pupilYRight = eyeCenterY + Math.sin(angle) * (eyeSize - pupilSize);

        const pupilXLeft = eyeCenterXLeft + Math.cos(angle) * (eyeSize - pupilSize);
        const pupilYLeft = eyeCenterY + Math.sin(angle) * (eyeSize - pupilSize);

        // Dibujar las pupilas
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(pupilXRight, pupilYRight, pupilSize, 0, Math.PI * 2); // Pupila derecha
        ctx.arc(pupilXLeft, pupilYLeft, pupilSize, 0, Math.PI * 2);   // Pupila izquierda
        ctx.fill();

        // Nombre y puntuación con mejor visibilidad
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.size * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, -this.size - 10);
        ctx.fillText(Math.floor(this.score).toString(), 0, this.size + this.size * 0.9);
        ctx.restore();
    }
}