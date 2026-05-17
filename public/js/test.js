let gameTime = 0;

function chrono() {
    setInterval(() => {
    gameTime++;

    console.log(gameTime);
    }, 1000);
}

chrono()
    