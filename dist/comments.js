import { getStoredComments, getStoredFavorites, sortBy } from './utils.js';
import { Comment } from './comment.js';
export class Comments {
    constructor(comments) {
        this._commentContain = [];
        this.updateComments = () => {
            this.renderCurrentView();
        };
        this.showFavoriteComments = () => {
            if (localStorage.getItem('favoriteState') === 'true') {
                this.renderCurrentView();
            }
        };
        this.patchCommentData = (data) => {
            const patchedData = getStoredComments().map((comment) => comment.uuid === data.uuid ? data : comment);
            localStorage.setItem('comments', JSON.stringify(patchedData));
        };
        this._comments = comments;
        this.introduce();
    }
    introduce() {
        this.renderCurrentView();
        this._comments.classList.add('load_animation');
    }
    renderCurrentView() {
        this._commentContain = getStoredComments();
        if (localStorage.getItem('favoriteState') === 'true') {
            const favoriteUuids = new Set(getStoredFavorites().map((comment) => comment.uuid));
            const favoriteComments = this._commentContain.filter((comment) => favoriteUuids.has(comment.uuid));
            this.renderComments(sortBy(favoriteComments));
            return;
        }
        const parentComments = this._commentContain.filter((comment) => !comment.parent);
        this.renderComments(sortBy(parentComments));
    }
    renderComments(comments) {
        this._comments.innerHTML = '';
        comments.forEach((comment) => {
            const element = document.createElement('div');
            element.dataset.element = comment.uuid;
            this._comments.appendChild(element);
            new Comment(element, comment.uuid, this.updateComments, this.patchCommentData, this.showFavoriteComments);
        });
    }
}
