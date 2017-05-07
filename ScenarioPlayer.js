'use strict';

class ScenarioPlayer extends EventEmitter {
  constructor(scenario) {
    super();
    this._isPlaying = false;
    this._playbackRate = 1.0;
    this._index = 0;
    this._time = 0;
    if (scenario) this.load(scenario);
  }

  play() {
    this._isPlaying = true;
    this._prevTime = Date.now();
    this._schedule(this._tick);
  }

  stop() {
    this._isPlaying = false;
  }

  load(data) {
    this._scenario = data.sort((a, b) => a.time - b.time);
    this._stats = this._getStatistics();

    if (this._index >= this._scenario.length) {
      this._index = this._scenario.length - 1;
      this._time = this._scenario[this._index].time;
    }
  }

  setPlaybackRate(rate) {
    this._playbackRate = rate;
  }

  _getStatistics() {
    return {
      minTime: this._scenario[0].time,
      maxTime: this._scenario[this._scenario.length - 1].time,
    };
  }

  _schedule(fn) {
    const currentTime = Date.now();
    const deltaTime = currentTime - this._prevTime;
    this._prevTime = currentTime;

    setTimeout(() => {
      fn.call(this, deltaTime);
    }, 10);
  }

  _isAheadInDirection(target, time, direction) {
    return direction > 0
      ? target > time
      : target < time;
  }

  _tick(deltaTime) {
    if (this._playbackRate !== 0) {
      const direction = this._playbackRate > 0 ? 1 : -1;

      while (!this._isAheadInDirection(
        this._scenario[this._index].time,
        this._time,
        direction))
      {
        this.emit('event', {
          actualTime: this._time,
          event: this._scenario[this._index],
        });

        this._index += direction;

        if (this._index === this._scenario.length) {
          this._index = 0;
          this._time = 0;
        } else if (this._index === -1) {
          this._index = this._scenario.length - 1;
          this._time = this._stats.maxTime;
        }
      }

      const event = this._scenario[this._index];

      this._time += deltaTime * this._playbackRate;
    }


    if (this._isPlaying) {
      this._schedule(this._tick);
    }
  }
}
