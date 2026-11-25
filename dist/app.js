import { Main } from './main.js';
class App {
    constructor() {
        this._basis = document.getElementById('app');
        this.introduce();
    }
    introduce() {
        if (!this._basis)
            return;
        new Main(this._basis).introduce();
    }
}
new App();
