console.log("bus");

function newElement(tagName, className) {
  const elem = document.createElement(tagName);
  elem.className = className;
  return elem;
}

// Define the size of the bus
const BUS_WIDTH = 400;
const BUS_HEIGHT = 240; // Adjust height as needed

function Bird(gameHeight, METER, SECOND, VELOCITY, TICKTIME) {
  let ticks = 0;

  this.impulseY = !matchMedia("screen and (max-width: 600px)").matches
    ? 30
    : 20;
  this.impulseT = 0;
  this.previousY = 0;
  this.time = 0;

  // Create the bus element
  this.element = newElement("img", "bird");
  this.element.src = "bus.png";
  // Set the size of the bus
  this.element.style.width = `${BUS_WIDTH}px`;
  this.element.style.height = `${BUS_HEIGHT}px`;

  this.position = (t, v0 = 0, p0 = 0) => {
    return ((-(12 * METER) * (t * t)) / 2 + v0 * t + p0) * METER;
  };

  this.getY = () => {
    let bottom = this.element.style.bottom;
    return !!bottom ? parseInt(this.element.style.bottom.split("px")[0]) : 0;
  };
  this.setY = (y) => (this.element.style.bottom = `${y}px`);

  this.animate = () => {
    this.time = ticks * TICKTIME;

    const newY = this.position(
      (this.time - this.impulseT) / SECOND,
      VELOCITY,
      this.impulseY
    );
    const maxHeight = gameHeight - BUS_HEIGHT; // Adjusted for bus height

    if (newY <= 0) {
      if (this.time > 0) this.setY(0);
      else this.setY(maxHeight / 2);
    } else if (newY >= maxHeight) {
      this.setY(maxHeight);
    } else {
      this.setY(newY);
    }

    ticks++;
    this.previousY = newY;
  };
}

function Progress(bestScoreElem, scoreElem) {
  this.bElement = bestScoreElem;
  this.sElement = scoreElem;
  this.element = newElement("span", "progress");

  let bestScore = localStorage.getItem("anz-flappie-bestScore");
  if (!!bestScore && !isNaN(bestScore)) this.bElement.innerHTML = bestScore;

  this.updateScore = (score) => {
    this.element.innerHTML = score;
    this.sElement.innerHTML = score;
  };
  this.updateBestScore = (score) => {
    this.bElement.innerHTML = score;
    localStorage.setItem("anz-flappie-bestScore", score);
  };
  this.updateScore(0);
}

function FlappyBird() {
  this.timer = null;

  const FPS = 60,
    SECOND = 1000,
    METER = 10,
    TICKTIME = Number.parseInt(SECOND / FPS),
    VELOCITY = 40;

  let score = 0,
    PAUSED = true;

  const gameArea = document.querySelector("[anz-flappy]"),
    wrap = document.querySelector("[anz-wrap]"),
    $status = document.getElementById("status");

  gameArea.style.backgroundImage =
    new Date().getHours() > 18 ? "url(bg_night.png)" : "url(bg.png)";

  const progress = new Progress(
    wrap.querySelector("div#score h3#best"),
    wrap.querySelector("div#score h2#actual")
  );

  let height = gameArea.clientHeight,
    width = gameArea.clientWidth,
    bird = null;

  function velocity(t, v0 = 0) {
    return (-(12 * METER) * t + v0) * METER;
  }

  function updateStatus(PAUSED, time, impulseT, impulseP, p, previousP) {
    $status.innerHTML = `${PAUSED ? "PAUSED..." : ""}
        TIME: ${time}s
        VELOCITY: ${velocity(time - impulseT, VELOCITY)}m/s
        POSITION: ${p}y
        MOTION: ${p - previousP}m
        IMPULSE: ${impulseP}m / ${impulseT}s
        `;
  }

  this.start = () => {
    this.reset();
    wrap.style.display = "none";
    gameArea.classList.remove("paused");
    PAUSED = false;
    updateStatus(
      PAUSED,
      bird.time,
      bird.impulseT,
      bird.impulseY,
      bird.getY(),
      bird.previousY
    );

    gameArea.onclick = (e) => {
      if (!PAUSED) {
        bird.impulseY = bird.getY() / METER;
        bird.impulseT = bird.time;
      }
    };
    window.onkeyup = (e) => {
      if (e.keyCode == 32 && !PAUSED) {
        bird.impulseY = bird.getY() / METER;
        bird.impulseT = bird.time;
      }
    };

    // loop
    timer = setInterval(() => {
      bird.animate();

      if (theyCollided(bird, height)) {
        let bestScore = localStorage.getItem("anz-flappie-bestScore");
        if (
          !bestScore ||
          isNaN(bestScore) ||
          (!isNaN(bestScore) && score > bestScore)
        )
          progress.updateBestScore(score);
        PAUSED = true;
        console.log("game over 💀");
        gameArea.classList.add("paused");
        clearInterval(timer);
        wrap.style.display = "block";
      }

      updateStatus(
        PAUSED,
        bird.time,
        bird.impulseT,
        bird.impulseY,
        bird.getY(),
        bird.previousY
      );
    }, TICKTIME);

    this.timer = timer;
  };

  this.reset = () => {
    gameArea.classList.add("paused");
    clearInterval(this.timer);

    gameArea.innerHTML = "";
    height = gameArea.clientHeight;
    width = gameArea.clientWidth;
    score = 0;

    progress.updateScore(0);

    bird = new Bird(height, METER, SECOND, VELOCITY, TICKTIME);

    gameArea.appendChild(progress.element);
    gameArea.appendChild(bird.element);

    wrap.style.display = "block";
  };
}

(function () {
  const btnStart = document.getElementById("start");
  const main = new FlappyBird();

  window.addEventListener("resize", function () {
    main.reset();
  });

  btnStart.onclick = function (e) {
    main.start();
  };
})();

// Remove theyCollided function since barriers are removed
