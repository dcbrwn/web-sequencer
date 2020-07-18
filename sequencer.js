'use strict';

const NOTES = 13 * 2 - 1;
const BARS = 8 * 4;
const TICK_TIME = 100;

const audioCtx = new window.AudioContext();
const engine = initAudio();

let scenario = [
  { time: 0, type: 'start' },
];

for (let i = 0; i < BARS; i += 1) {
  scenario.push({
    time: i * TICK_TIME,
    type: 'active',
    bar: i + 1,
  });
}

scenario.push({ time: BARS * TICK_TIME, type: 'end' });

const player = new ScenarioPlayer(scenario);
let currentBar = 0;
player.on('event', (params) => {
  if (params.event.type === 'noteOn') {
    noteOn(params.event.note);
  } else if (params.event.type === 'active') {
    const currentCol = document.getElementById('bar' + currentBar);
    currentCol.classList.remove("active");
    currentBar = params.event.bar;
    const nextCol = document.getElementById('bar' + currentBar);
    nextCol.classList.add("active");
  }
});
player.play();

const pianoRoll = document.getElementById('piano-roll');
const grid = document.getElementById('grid');

initGrid(BARS, NOTES, grid);

function initGrid(barsCount, notesCount, table) {
  grid.style.width = (barsCount + 1) * 30 + 'px';

  const noteLabels = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

  const colGroup = document.createElement('colgroup');

  for (let i = 0; i <= barsCount; i += 1) {
    const col = document.createElement('col');
    col.id = 'bar' + i;
    col.classList.add("bar");
    colGroup.appendChild(col);
  }

  table.appendChild(colGroup);


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

  engine.master.gain.value = 1.0;

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
      // engine.master.connect(audioCtx.destination);
    }, function(error) {
      throw error;
    });
  }

  ajaxRequest.send();

  return engine;
}

async function noteOn(note) {
  const velocity = 0.3;
  const attenuator = audioCtx.createGain();
  attenuator.connect(engine.master);

  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = getNoteFrequency(note);
  oscillator.connect(attenuator);

  const startTime = audioCtx.currentTime;

  engine.poly += 1;

  oscillator.start();
  attenuator.gain.setValueAtTime(1e-10, startTime);
  attenuator.gain.exponentialRampToValueAtTime((1 / engine.poly) * velocity, startTime + 0.05);
  attenuator.gain.linearRampToValueAtTime(0, startTime + 0.2);

  await delay(10);

  engine.poly -= 1;

  await delay(500);

  oscillator.stop();
  attenuator.disconnect(engine.master);
  oscillator.disconnect(attenuator);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  })
}

function getNoteFrequency(note) {
  return 220 * Math.pow(1.059463094359, note);
}
