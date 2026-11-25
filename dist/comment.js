import { getElements, getStoredComments, getStoredFavorites, _, } from './utils.js';
import { CommentForm } from './commentForm.js';
var Elements;
(function (Elements) {
    Elements["avatar"] = "avatar";
    Elements["name"] = "name";
    Elements["parent"] = "parent";
    Elements["parentName"] = "parentName";
    Elements["date"] = "date";
    Elements["comment"] = "comment";
    Elements["favorite"] = "favorite";
    Elements["rating"] = "rating";
    Elements["reply"] = "reply";
    Elements["replies"] = "replies";
    Elements["decrement"] = "decrement";
    Elements["increment"] = "increment";
    Elements["commentForm"] = "commentForm";
})(Elements || (Elements = {}));
export class Comment {
    constructor(comment, uuid, updateComments, patchCommentData, showFavoriteComments) {
        this._elements = {};
        this._repliesData = [];
        this._sampleComment = `
    <div class="comment_container">
      <img alt="commenter avatar" class="avatar" data-element="${Elements.avatar}"/>
      <div class="comment_inner">
        <div class="comment_info">
          <p data-element="${Elements.name}"></p>
          <div class="parent" data-element="${Elements.parent}">
            <img class="parent_icon" src="./images/arrow_reply.svg" alt="arrow answer"/>
            <p data-element="${Elements.parentName}"></p>
          </div>
          <p data-element="${Elements.date}"></p>
        </div>
        <p data-element="${Elements.comment}"></p>
        <div class="comment_panel">
          <button class="reply_btn" data-element="${Elements.reply}">
            <img src="./images/arrow_reply.svg" alt="arrow reply"/> Ответить
          </button>
          <button class="favorite_btn" data-element="${Elements.favorite}"></button>
          <div class="vote_system">
            <div class="vote_btn" data-element="${Elements.decrement}">
              <img src="./images/minus.svg" alt="icon minus" class="icon_minus"/>
            </div>
            <p data-element="${Elements.rating}"></p>
            <div class="vote_btn" data-element="${Elements.increment}">
              <img src="./images/plus.svg" alt="icon plus" class="icon_plus"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
        this.renderReplies = () => {
            const replies = this._elements[Elements.replies];
            if (!replies)
                return;
            this._repliesData.forEach((reply) => {
                const existingElement = Array.from(replies.children).some((element) => element.dataset.uuid === reply.uuid);
                if (!existingElement) {
                    const element = document.createElement('div');
                    element.dataset.uuid = reply.uuid;
                    replies.appendChild(element);
                    new Comment(element, reply.uuid, this._updateComments, this._patchCommentData, this._showFavoriteComments);
                }
            });
        };
        this.onReply = () => {
            if (!this._elements[Elements.replies]) {
                this._comment.insertAdjacentHTML('beforeend', `<div class="replies" data-element="${Elements.replies}"></div>`);
                this._elements[Elements.replies] = this._comment.querySelector(`[data-element="${Elements.replies}"]`);
            }
            const replies = this._elements[Elements.replies];
            if (!replies || replies.querySelector('.comment_form'))
                return;
            const formWrapper = document.createElement('div');
            formWrapper.className = 'comment_form';
            formWrapper.dataset.element = Elements.commentForm;
            replies.prepend(formWrapper);
            new CommentForm(formWrapper, this.updateReplies, _, this._newComment);
        };
        this.onDecrement = () => {
            this.setVote(-1);
        };
        this.onIncrement = () => {
            this.setVote(1);
        };
        this.onFavorite = () => {
            this._newComment.favorite = !this._newComment.favorite;
            this.updateFavoriteButton();
            const favorites = getStoredFavorites().filter((comment) => comment.uuid !== this._newComment.uuid);
            if (this._newComment.favorite) {
                favorites.push(this._newComment);
            }
            localStorage.setItem('favorite', JSON.stringify(favorites));
            this._patchCommentData(this._newComment);
            this._showFavoriteComments();
        };
        this.updateReplies = () => {
            this._repliesData = getStoredComments().filter((item) => item.parent === this._newComment.uuid);
            this._elements[Elements.replies]?.querySelector('.comment_form')?.remove();
            this.renderReplies();
            this._updateComments();
        };
        this._comment = comment;
        this._updateComments = updateComments;
        this._showFavoriteComments = showFavoriteComments;
        this._patchCommentData = patchCommentData;
        const storedComments = getStoredComments();
        const currentComment = storedComments.find((item) => item.uuid === uuid);
        if (!currentComment) {
            this._comment.remove();
            return;
        }
        this._newComment = currentComment;
        this._newComment.rating = Number.isFinite(Number(currentComment.rating))
            ? Number(currentComment.rating)
            : 0;
        this._repliesData = storedComments.filter((item) => item.parent === this._newComment.uuid);
        this.introduce();
    }
    introduce() {
        this._comment.innerHTML = this._sampleComment;
        getElements(this._comment, this._elements);
        this.configureComment();
        this.addListeners();
        if (this._repliesData.length) {
            this._comment.insertAdjacentHTML('beforeend', `<div class="replies" data-element="${Elements.replies}"></div>`);
            this._elements[Elements.replies] = this._comment.querySelector(`[data-element=${Elements.replies}]`);
            this.renderReplies();
        }
    }
    configureComment() {
        const avatar = this._elements[Elements.avatar];
        const name = this._elements[Elements.name];
        const comment = this._elements[Elements.comment];
        const date = this._elements[Elements.date];
        const rating = this._elements[Elements.rating];
        const parent = this._elements[Elements.parent];
        const parentName = this._elements[Elements.parentName];
        const reply = this._elements[Elements.reply];
        const parentUuid = this._newComment.parent;
        avatar.setAttribute('src', this._newComment.avatar);
        name.textContent = this._newComment.name;
        comment.textContent = this._newComment.comment;
        date.textContent = new Date(this._newComment.date)
            .toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
            .replace(',', ' ');
        this.updateFavoriteButton();
        rating.textContent = `${this._newComment.rating}`;
        rating.classList.toggle('negative_rating', this._newComment.rating < 0);
        rating.classList.toggle('positive_rating', this._newComment.rating >= 0);
        if (!parentUuid) {
            parent?.remove();
            delete this._elements[Elements.parent];
            return;
        }
        const parentData = getStoredComments().find((item) => item.uuid === parentUuid);
        if (parentData) {
            parentName.textContent = parentData.name;
        }
        else {
            parent.remove();
        }
        reply?.remove();
        delete this._elements[Elements.reply];
    }
    addListeners() {
        const reply = this._elements[Elements.reply];
        const decrement = this._elements[Elements.decrement];
        const increment = this._elements[Elements.increment];
        const favorite = this._elements[Elements.favorite];
        reply?.addEventListener('click', this.onReply);
        decrement.addEventListener('click', this.onDecrement);
        increment.addEventListener('click', this.onIncrement);
        favorite.addEventListener('click', this.onFavorite);
    }
    getVote() {
        if (this._newComment.increment === false)
            return 1;
        if (this._newComment.decrement === false)
            return -1;
        return 0;
    }
    setVote(vote) {
        const currentVote = this.getVote();
        const nextVote = currentVote === vote ? 0 : vote;
        this._newComment.rating += nextVote - currentVote;
        this._newComment.increment = nextVote !== 1;
        this._newComment.decrement = nextVote !== -1;
        this._patchCommentData(this._newComment);
        this._updateComments();
    }
    updateFavoriteButton() {
        const favoriteButton = this._elements[Elements.favorite];
        favoriteButton.innerHTML = this._newComment.favorite
            ? `<img src="./images/completed_heart.svg" alt="completed heart"/> В избранном`
            : `<img src="./images/empty_heart.svg" alt="empty heart"/> В избранное`;
    }
}
