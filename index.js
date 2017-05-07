'use strict';

const scenario = [
  { time: 500 },
  { time: 1000 },
  { time: 1500 },
  { time: 2000 },
  { time: 2500 },
  { time: 3000 },
  { time: 3500 },
]

const player = new ScenarioPlayer(scenario);

player.on('event', (event) => console.log(event));
player.play();
