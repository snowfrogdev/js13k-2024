import { abs, clamp, drawTextScreen, mainCanvasSize, rgb, time, Timer, vec2 } from "littlejsengine";
import { EVENTS, subscribe } from "./event-bus";
import { Player } from "./player";

const respawnTimer = new Timer();

let _player: Player;

subscribe(EVENTS.PLAYER_INCAPACITATED, ({ player }) => {
  respawnTimer.set(5);
  _player = player;
});

function update() {
  if (respawnTimer.elapsed()) {
    _player.respawn();
    respawnTimer.unset();
  }
}

function render() {
  if (respawnTimer.active()) {
    // Draw the respawn timer in the center of the screen
    const screenWidth = mainCanvasSize.x;
    const screenHeight = mainCanvasSize.y;

    const fontSize = 600;
    const text = clamp(abs(Math.ceil(respawnTimer.time - time)), 1, 5).toString();

    drawTextScreen(text, vec2(screenWidth / 2, screenHeight / 2), fontSize, rgb(0,0,0),);
  }
}

export const Respawner = { update, render };
