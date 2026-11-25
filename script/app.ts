import { Main } from './main.js';

class App {
  private readonly _basis = document.getElementById('app');

  constructor() {
    this.introduce();
  }

  private introduce() {
    if (!this._basis) return;

    new Main(this._basis).introduce();
  }
}

new App();