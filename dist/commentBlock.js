import { getElements, normalizeStoredComments } from './utils.js';
import { ControlPanel } from './controlPanel.js';
import { CommentForm } from './commentForm.js';
import { Comments } from './comments.js';
var Elements;
(function (Elements) {
    Elements["controlPanel"] = "controlPanel";
    Elements["commentForm"] = "commentForm";
    Elements["comments"] = "comments";
})(Elements || (Elements = {}));
export class CommentBlock {
    constructor(commentBlock) {
        this._elements = {};
        this._sampleCommentBlock = `
    <div class="control_panel" data-element="${Elements.controlPanel}"></div>
    <div class="comment_form" data-element="${Elements.commentForm}"></div>
    <div data-element="${Elements.comments}"></div>
  `;
        this.updateCounter = () => {
            this._controlPanel.updateCounter();
        };
        this.addComment = () => {
            this._controlPanel.resetFavoriteFilter();
            this._comments.updateComments();
        };
        this.updateComments = () => {
            this._comments.updateComments();
        };
        this.showFavoriteComments = () => {
            this._comments.showFavoriteComments();
        };
        this._commentBlock = commentBlock;
        this.introduce();
    }
    introduce() {
        this._commentBlock.innerHTML = this._sampleCommentBlock;
        getElements(this._commentBlock, this._elements);
        if (!localStorage.getItem('comments'))
            localStorage.setItem('comments', '[]');
        if (!localStorage.getItem('sort')) {
            localStorage.setItem('sort', 'relevance');
        }
        if (!localStorage.getItem('favorite'))
            localStorage.setItem('favorite', '[]');
        localStorage.setItem('favoriteState', 'false');
        normalizeStoredComments();
        this._controlPanel = new ControlPanel(this._elements[Elements.controlPanel], this.updateComments, this.showFavoriteComments);
        new CommentForm(this._elements[Elements.commentForm], this.addComment, this.updateCounter);
        this._comments = new Comments(this._elements[Elements.comments]);
    }
}
