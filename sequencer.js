'use strict';

const NOTES = 13 * 2 - 1;
const BARS = 8 * 4;
const TICK_TIME = 100;

const audioCtx = new window.AudioContext();
const engine = initAudio();

let scenario = [
  { time: 0, type: 'start' },
  { time: BARS * TICK_TIME, type: 'end' },
];
const player = new ScenarioPlayer(scenario);
player.on('event', (params) => {
  if (params.event.type === 'noteOn') {
    noteOn(params.event.note);
  }
});
player.play();

initGrid(BARS, NOTES, document.getElementById('piano-roll'));

function setNote(note, bar) {
  scenario.push({
    time: bar * TICK_TIME,
    type: 'noteOn',
    note: note,
  });

  player.load(scenario);
}

// TODO: This looks inefficient! Probably need to change the way how grid
// integrates with scenario
function clearNote(note, bar) {
  scenario = scenario.filter((event) => {
    const isNoteOn = event.type === 'noteOn'
      && event.time === bar * TICK_TIME
      && event.note === note;

    if (isNoteOn) {
      return false;
    }

    return true;
  });

  player.load(scenario);
}

function initGrid(x, y, table) {
  const colors = [0,1,0,1,0,0,1,0,1,0,1,0];
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  for (let i = y - 1; i >= 0; i -= 1) {
    const row = document.createElement('tr');

    if (colors[i % 12]) {
      row.classList.add('alter');
    }

    for (let j = -1; j < x; j += 1) {
      const cell = document.createElement('td');

      if (j === -1) {
        cell.innerText = notes[i % 12];
      } else {
        cell.onclick = function() {
          if (!cell.classList.contains('active')) {
            setNote(i, j);
          } else {
            clearNote(i, j);
          }
          cell.classList.toggle('active');
        }
      }

      row.appendChild(cell);
    }
    table.appendChild(row);
  }
}

function initAudio() {
  const engine = {
    oscillators: [],
    poly: 0,
    master: audioCtx.createGain(),
  };

  engine.master.gain.value = 0;

  const ajaxRequest = new XMLHttpRequest();
  ajaxRequest.open('GET', 'reverb.wav', true);
  ajaxRequest.responseType = 'arraybuffer';
  ajaxRequest.onload = function() {
    var audioData = ajaxRequest.response;
    audioCtx.decodeAudioData(audioData, function(buffer) {
      const reverb = audioCtx.createConvolver();
      reverb.buffer = buffer;
      engine.master.connect(reverb);
      reverb.connect(audioCtx.destination);
    }, function(error) {
      throw error;
    });
  }

  ajaxRequest.send();

  return engine;
}

function noteOn(note) {
  const velocity = 0.3;
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.value = getNoteFrequency(note);
  oscillator.connect(engine.master);

  engine.poly += 1;
  engine.master.gain.value = (1 / engine.poly) * velocity;

  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    oscillator.disconnect(engine.master);
    engine.poly -= 1;
    engine.master.gain.value = engine.poly === 0
      ? 1.0
      : (1 / engine.poly) * velocity;
  }, TICK_TIME);
}

function getNoteFrequency(note) {
  return 220 * Math.pow(1.059463094359, note);
}
