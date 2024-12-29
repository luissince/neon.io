import Game from './game';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const fogCanvas = document.getElementById('fogCanvas') as HTMLCanvasElement;
const minimap = document.getElementById('minimap') as HTMLCanvasElement;

const music = document.getElementById('backgroundMusic') as HTMLAudioElement;
const musicButtonContainer = document.getElementById('musicButtonContainer') as HTMLDivElement;
const startMusicButton = document.getElementById('startMusicButton') as HTMLButtonElement;

// Canvas resize handling
function resizeCanvas() {
    const updateCanvasSize = (c: HTMLCanvasElement) => {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
    };
    
    updateCanvasSize(canvas);
    updateCanvasSize(fogCanvas);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Initialize game
const game = new Game(canvas, minimap, fogCanvas);

// Music handling
startMusicButton.addEventListener('click', () => {
    music.currentTime = 0;
    music.play();
    musicButtonContainer.style.display = 'none';
    game.start();
});