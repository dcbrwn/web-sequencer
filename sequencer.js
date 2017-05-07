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

const pianoRoll = document.getElementById('piano-roll');
const grid = document.getElementById('grid');

initGrid(BARS, NOTES, grid);

function initGrid(barsCount, notesCount, table) {
  grid.style.width = (barsCount + 1) * 30 + 'px';

  const noteLabels = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  for (let noteNumber = notesCount - 1; noteNumber >= 0; noteNumber -= 1) {
    const row = document.createElement('tr');

    if (noteLabels[noteNumber % 12][1] === '#') {
      row.classList.add('alter');
    }

    for (let bar = -1; bar < barsCount; bar += 1) {
      const cell = document.createElement('td');

      if (bar === -1) {
        cell.innerText = noteLabels[noteNumber % 12];
      } else {
        cell.onclick = (event) => {
          // Add note to scenario
          const note = {
            time: bar * TICK_TIME,
            type: 'noteOn',
            note: noteNumber,
          };
          scenario.push(note);
          player.load(scenario);

          // Add note to piano roll
          const noteElement = document.createElement('div');
          noteElement.classList.add('note');
          // We also need to compensate borders of cells
          noteElement.style.top = cell.offsetTop + 1 + 'px';
          noteElement.style.left = cell.offsetLeft + 1 + 'px';

          // Add ability to remove note
          noteElement.onclick = function(event) {
            event.stopPropagation();
            scenario = scenario.filter((value) => value !== note);
            player.load(scenario);
            // pianoRoll.removeChild(noteElement);
            this.parentNode.removeChild(this);
          };
          cell.appendChild(noteElement);
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
  oscillator.type = 'sine';
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
