import { getElements } from './utils.js';
import { CommentBlock } from './commentBlock.js';
var Elements;
(function (Elements) {
    Elements["commentsBlock"] = "commentsBlock";
})(Elements || (Elements = {}));
export class Main {
    constructor(basis) {
        this._sections = {};
        this._sample = `
    <section class="commentsBlock" data-element="commentsBlock"></section>
  `;
        this._basis = basis;
    }
    introduce() {
        this._basis.innerHTML = this._sample;
        getElements(this._basis, this._sections);
        new CommentBlock(this._sections[Elements.commentsBlock]);
    }
}
