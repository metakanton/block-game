const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 480;
canvas.height = 640;

const startButton = document.getElementById("startButton");
const timerDisplay = document.getElementById("timer");

const bgm = document.getElementById("bgm");
const wallHitSound = document.getElementById("wallHit");
const paddleHitSound = document.getElementById("paddleHit");
const brickBreakSound = document.getElementById("brickBreak");
const gameOverSound = document.getElementById("gameOverSound");

const paddleHeight = 10, paddleWidth = 100;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false, leftPressed = false;
let gameRunning = false;

const ballImage = new Image();
ballImage.src = "images/ball.png";

let ballRadius = 12;
let ballX, ballY, ballDX, ballDY;
let rotationAngle = 0;
let rotationSpeed = 0;

let startTime, elapsedTime = 0;
let timerInterval;

// ブロック設定
const brickRowCount = 4, brickColumnCount = 5;
const brickWidth = 70, brickHeight = 25, brickPadding = 10;
const brickOffsetTop = 100, brickOffsetLeft = 55;
let bricks = [];

let consecutiveHits = 0;
let speedUpActive = false;
let sizeUpActive = false;
let speedUpTimeout;
let sizeUpTimeout;

function resetBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = {
                x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                y: r * (brickHeight + brickPadding) + brickOffsetTop,
                status: 1
            };
        }
    }
}

function drawBricks() {
    let remainingBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                ctx.fillStyle = `hsl(${r * 40}, 100%, 50%)`;
                ctx.fillRect(bricks[c][r].x, bricks[c][r].y, brickWidth, brickHeight);
                remainingBricks++;
            }
        }
    }

    if (remainingBricks === 0 && gameRunning) {
        gameClear();
    }
}

function drawBall() {
    ctx.save();
    ctx.translate(ballX, ballY);
    ctx.rotate(rotationAngle);
    ctx.drawImage(ballImage, -ballRadius, -ballRadius, ballRadius * 2, ballRadius * 2);
    ctx.restore();
}

function drawPaddle() {
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
}

function collisionDetection() {
    let hit = false;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1 && ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
                ballDY = -ballDY;
                b.status = 0;
                brickBreakSound.play();
                rotationSpeed += Math.PI / 20;
                consecutiveHits++;
                hit = true;
            }
        }
    }

    if (hit) {
        applyPowerUps();
    }
}

function applyPowerUps() {
    if (!speedUpActive) {
        ballDX *= 1.5;
        ballDY *= 1.5;
        speedUpActive = true;
    }
    clearTimeout(speedUpTimeout);
    speedUpTimeout = setTimeout(() => {
        ballDX /= 1.5;
        ballDY /= 1.5;
        speedUpActive = false;
    }, 2000);

    if (consecutiveHits >= 3 && !sizeUpActive) {
        ballRadius = 24;
        sizeUpActive = true;
        sizeUpTimeout = setTimeout(() => {
            ballRadius = 12;
            sizeUpActive = false;
        }, 5000);
    }
}

function updateTimer() {
    elapsedTime = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = elapsedTime.toFixed(2);
}

function draw() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
    if (leftPressed && paddleX > 0) paddleX -= 7;

    if (ballX + ballDX > canvas.width - ballRadius || ballX + ballDX < ballRadius) {
        ballDX = -ballDX;
        wallHitSound.play();
        rotationSpeed += Math.PI / 30;
    }

    if (ballY + ballDY < ballRadius) {
        ballDY = -ballDY;
        wallHitSound.play();
        rotationSpeed += Math.PI / 30;
    }

    if (ballY + ballDY > canvas.height - paddleHeight - ballRadius - 10 &&
        ballX > paddleX && ballX < paddleX + paddleWidth) {
        ballDY = -ballDY;
        let relativeHitPos = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
        ballDX = relativeHitPos * 3;
        paddleHitSound.play();
        consecutiveHits = 0;
        rotationSpeed += Math.PI / 20;
    }

    if (ballY + ballRadius >= canvas.height) {
        gameOver();
        return;
    }

    ballX += ballDX;
    ballY += ballDY;

    rotationAngle += rotationSpeed;
    rotationSpeed *= 0.98;

    requestAnimationFrame(draw);
}

function gameOver() {
    clearInterval(timerInterval);
    gameOverSound.play();
    gameRunning = false;
    bgm.pause();
    bgm.currentTime = 0;

    setTimeout(() => {
        alert("ゲームオーバー！");
    }, 300);
}

function gameClear() {
    clearInterval(timerInterval);
    gameRunning = false;
    bgm.pause();
    bgm.currentTime = 0;

    setTimeout(() => {
        alert(`ゲームクリア！おめでとうございます！！\nクリアタイム ${elapsedTime.toFixed(2)} 秒`);
    }, 300);
}

function startGame() {
    ballRadius = 12;
    ballX = canvas.width / 2;
    ballY = canvas.height - 40;
    ballDX = 3;
    ballDY = -3;
    paddleX = (canvas.width - paddleWidth) / 2;
    rotationAngle = 0;
    rotationSpeed = 0;
    consecutiveHits = 0;
    startTime = Date.now();
    resetBricks();
    timerInterval = setInterval(updateTimer, 10);
    gameRunning = true;
    bgm.play();
    canvas.classList.add("started");
    draw();
}

document.addEventListener("keydown", e => {
    if (e.key === "a" || e.key === "A") leftPressed = true;
    if (e.key === "d" || e.key === "D") rightPressed = true;
});

document.addEventListener("keyup", e => {
    if (e.key === "a" || e.key === "A") leftPressed = false;
    if (e.key === "d" || e.key === "D") rightPressed = false;
});

startButton.addEventListener("click", startGame);
