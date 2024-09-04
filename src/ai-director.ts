import { drawLine, drawRect, mainCanvasSize, rgb, time, Timer, vec2, Vector2 } from "littlejsengine";
import { subscribe } from "./event-bus";
import { findPath } from "./findPath";
import { Enemy } from "./enemy";

let _emotionalIntensity = 0;
const debugData: { time: number; enemies: number; intensity: number }[] = [];
const maxDebugDataPoints = 10 * 60; // 10 minutes at 1 point per second

function setEmotionalIntensity(value: number) {
  _emotionalIntensity = value;
}

let _lastActionTimestamp = performance.now();
let _timeBeforeIntensityDecayMs = 1_000;

subscribe("PLAYER_DAMAGED", ({ damage }) => {
  setEmotionalIntensity(_emotionalIntensity + damage);
  _lastActionTimestamp = performance.now();
});

subscribe("PLAYER_INCAPACITATED", () => {
  setEmotionalIntensity(_emotionalIntensity + 500);
  _lastActionTimestamp = performance.now();
});

subscribe("ENEMY_KILLED", () => {
  setEmotionalIntensity(_emotionalIntensity + 100);
  _lastActionTimestamp = performance.now();
});

subscribe("BASE_DAMAGED", ({ damage }) => {
  setEmotionalIntensity(_emotionalIntensity + damage);
  _lastActionTimestamp = performance.now();
});

type States = "BUILD_UP" | "SUSTAIN_PEAK" | "PEAK_FADE" | "RELAX";
let _state: States = "BUILD_UP";

const _stateTransitionTimer = new Timer();

const _peakEmotionalIntensityThreshold = 1_000;
const _relaxEmotionalIntensityThreshold = 100;
const _sustainPeakPeriodSecs = 5;
const _realaxPeriodSecs = 45;

const _spawnTimer = new Timer();
const _spawnIntervalSecs = 2;

let _enemySpawns: Vector2[];
let _playerPosition: Vector2;
let _basePosition: Vector2;

function init(enemySpawns: Vector2[], basePosition: Vector2) {
  _enemySpawns = enemySpawns;
  _basePosition = basePosition;

  _spawnTimer.set(_spawnIntervalSecs);

  setInterval(() => {
    if (debugData.length > 10 * 60) {
      debugData.shift();
    }
    debugData.push({ time: Math.round(time), enemies: Enemy.all.size, intensity: _emotionalIntensity });
  }, 1000);
}

function update(playerPosition: Vector2) {
  _playerPosition = playerPosition;

  if (performance.now() - _lastActionTimestamp > _timeBeforeIntensityDecayMs && _emotionalIntensity > 0) {
    setEmotionalIntensity(_emotionalIntensity - 1);
  }

  _stateMachine[_state]();
}

function debug() {
  const screenWidth = mainCanvasSize.x;
  const screenHeight = mainCanvasSize.y;
  const graphWidth = 600;
  const graphHeight = 300;
  // Draw the graph background
  drawRect(
    vec2(screenWidth - graphWidth / 2, screenHeight - graphHeight / 2),
    vec2(graphWidth, graphHeight),
    rgb(0, 0, 0, 0.5),
    0,
    true,
    true
  );

  const yPeak = screenHeight - 0.85 * graphHeight;
  const scalingFactor = (yPeak - screenHeight) / _peakEmotionalIntensityThreshold;
  const intensityToGraphY = (intensity: number) => screenHeight + scalingFactor * intensity;

  // Draw the peak emotional intensity threshold line
  drawLine(vec2(screenWidth - graphWidth, yPeak), vec2(screenWidth, yPeak), 3, rgb(1, 0, 0, 0.5), true, true);

  // Draw the relax emotional intensity threshold line
  const yRelax = intensityToGraphY(_relaxEmotionalIntensityThreshold);
  drawLine(vec2(screenWidth - graphWidth, yRelax), vec2(screenWidth, yRelax), 3, rgb(0, 0, 1, 0.5), true, true);

  for (let i = 0; i < debugData.length - 1; i++) {
    const xPos = (graphWidth / maxDebugDataPoints) * i + (screenWidth - graphWidth);
    // Draw a vertical line for each 30 seconds
    if (debugData[i].time !== 0 && debugData[i].time % 30 === 0) {
      drawLine(vec2(xPos, screenHeight), vec2(xPos, screenHeight - graphHeight), 1, rgb(1, 1, 1, 0.3), true, true);
    }

    // Draw the intensity
    const intensityY = intensityToGraphY(debugData[i].intensity);
    drawRect(vec2(xPos, intensityY), vec2(3, 3), rgb(1, 1, 1, 0.7), 0, true, true);
  }
}

const _stateMachine: Record<States, () => void> = {
  BUILD_UP() {
    if (_spawnTimer.elapsed()) {
      spawnEnemy();
    }

    if (_emotionalIntensity >= _peakEmotionalIntensityThreshold) {
      _state = "SUSTAIN_PEAK";
      _stateTransitionTimer.set(_sustainPeakPeriodSecs);
    }
  },
  SUSTAIN_PEAK() {
    if (_spawnTimer.elapsed()) {
      spawnEnemy();
    }

    if (_stateTransitionTimer.elapsed()) {
      _state = "PEAK_FADE";
    }
  },
  PEAK_FADE() {
    if (_emotionalIntensity <= _relaxEmotionalIntensityThreshold) {
      _state = "RELAX";
      _stateTransitionTimer.set(_realaxPeriodSecs);
    }
  },
  RELAX() {
    if (_stateTransitionTimer.elapsed()) {
      _state = "BUILD_UP";
    }
  },
};

function spawnEnemy() {
  // Choose a spawn point at random amongs the farthest 3 from the player
  let farthestSpawns: Vector2[] = [];
  for (const spawn of _enemySpawns) {
    const distance = _playerPosition.distance(spawn);
    if (farthestSpawns.length < 3) {
      farthestSpawns.push(spawn);
      continue;
    }
    if (farthestSpawns.some((s) => s.distance(_playerPosition) < distance)) {
      farthestSpawns.sort((a, b) => b.distance(_playerPosition) - a.distance(_playerPosition));
      farthestSpawns.pop();
      farthestSpawns.push(spawn);
    }
  }

  // Spawn the enemy
  const spawnIndex = Math.floor(Math.random() * farthestSpawns.length);
  const spawn = farthestSpawns[spawnIndex];
  const path = findPath(spawn, _basePosition)!;
  const enemy = new Enemy(spawn);
  enemy.path = path;

  _spawnTimer.set(_spawnIntervalSecs);
}

export const AIDirector = { init, update, debug } as const;
