import {
  ElementsType,
  getElements,
  getStoredComments,
  getStoredFavorites,
  _,
} from './utils.js';
import type { UserType } from './request.js';
import { CommentForm } from './commentForm.js';

enum Elements {
  avatar = 'avatar',
  name = 'name',
  parent = 'parent',
  parentName = 'parentName',
  date = 'date',
  comment = 'comment',
  favorite = 'favorite',
  rating = 'rating',
  reply = 'reply',
  replies = 'replies',
  decrement = 'decrement',
  increment = 'increment',
  commentForm = 'commentForm',
}

export type ParentComment = {
  comment: string;
  date: string;
  favorite: boolean;
  rating: number;
  increment: boolean;
  decrement: boolean;
  replies?: ChildComment[];
  parent?: never;
} & UserType;

export type ChildComment = {
  comment: string;
  date: string;
  favorite: boolean;
  rating: number;
  increment: boolean;
  decrement: boolean;
  parent: string;
  replies?: never;
} & UserType;

export type CommentType = ParentComment | ChildComment;

type Vote = -1 | 0 | 1;

export class Comment {
  private _comment: HTMLElement;
  private readonly _elements: ElementsType = {};
  private readonly _newComment!: CommentType;
  private _repliesData: ChildComment[] = [];

  private readonly _updateComments: () => void;
  private readonly _patchCommentData: (data: CommentType) => void;
  private readonly _showFavoriteComments: () => void;

  private _sampleComment = `
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

  constructor(
    comment: HTMLElement,
    uuid: string,
    updateComments: () => void,
    patchCommentData: (data: CommentType) => void,
    showFavoriteComments: () => void
  ) {
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
    this._repliesData = storedComments.filter(
      (item) => item.parent === this._newComment.uuid
    ) as ChildComment[];

    this.introduce();
  }

  introduce() {
    this._comment.innerHTML = this._sampleComment;
    getElements(this._comment, this._elements);
    this.configureComment();
    this.addListeners();
    if (this._repliesData.length) {
      this._comment.insertAdjacentHTML(
        'beforeend',
        `<div class="replies" data-element="${Elements.replies}"></div>`
      );
      this._elements[Elements.replies] = this._comment.querySelector(
        `[data-element=${Elements.replies}]`
      ) as HTMLElement;
      this.renderReplies();
    }
  }

  renderReplies = () => {
    const replies = this._elements[Elements.replies];

    if (!replies) return;

    this._repliesData.forEach((reply) => {
      const existingElement = Array.from(replies.children).some(
        (element) => (element as HTMLElement).dataset.uuid === reply.uuid
      );

      if (!existingElement) {
        const element = document.createElement('div');
        element.dataset.uuid = reply.uuid;
        replies.appendChild(element);
        new Comment(
          element,
          reply.uuid,
          this._updateComments,
          this._patchCommentData,
          this._showFavoriteComments
        );
      }
    });
  };

  configureComment() {
    const avatar = this._elements[Elements.avatar] as HTMLImageElement;
    const name = this._elements[Elements.name] as HTMLParagraphElement;
    const comment = this._elements[Elements.comment] as HTMLParagraphElement;
    const date = this._elements[Elements.date] as HTMLDataElement;
    const rating = this._elements[Elements.rating] as HTMLDivElement;

    const parent = this._elements[Elements.parent] as HTMLDivElement;
    const parentName = this._elements[Elements.parentName] as HTMLParagraphElement;
    const reply = this._elements[Elements.reply] as HTMLButtonElement;
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
    } else {
      parent.remove();
    }

    reply?.remove();
    delete this._elements[Elements.reply];
  }

  addListeners() {
    const reply = this._elements[Elements.reply];
    const decrement = this._elements[Elements.decrement] as HTMLDivElement;
    const increment = this._elements[Elements.increment] as HTMLDivElement;
    const favorite = this._elements[Elements.favorite] as HTMLButtonElement;

    reply?.addEventListener('click', this.onReply);
    decrement.addEventListener('click', this.onDecrement);
    increment.addEventListener('click', this.onIncrement);
    favorite.addEventListener('click', this.onFavorite);
  }

  onReply = () => {
    if (!this._elements[Elements.replies]) {
      this._comment.insertAdjacentHTML(
        'beforeend',
        `<div class="replies" data-element="${Elements.replies}"></div>`
      );
      this._elements[Elements.replies] = this._comment.querySelector(
        `[data-element="${Elements.replies}"]`
      ) as HTMLElement;
    }

    const replies = this._elements[Elements.replies];

    if (!replies || replies.querySelector('.comment_form')) return;

    const formWrapper = document.createElement('div');
    formWrapper.className = 'comment_form';
    formWrapper.dataset.element = Elements.commentForm;
    replies.prepend(formWrapper);

    new CommentForm(formWrapper, this.updateReplies, _, this._newComment);
  };

  private getVote(): Vote {
    if (this._newComment.increment === false) return 1;
    if (this._newComment.decrement === false) return -1;

    return 0;
  }

  private setVote(vote: Vote) {
    const currentVote = this.getVote();
    const nextVote: Vote = currentVote === vote ? 0 : vote;

    this._newComment.rating += nextVote - currentVote;
    this._newComment.increment = nextVote !== 1;
    this._newComment.decrement = nextVote !== -1;

    this._patchCommentData(this._newComment);
    this._updateComments();
  }

  onDecrement = () => {
    this.setVote(-1);
  };

  onIncrement = () => {
    this.setVote(1);
  };

  onFavorite = () => {
    this._newComment.favorite = !this._newComment.favorite;
    this.updateFavoriteButton();

    const favorites = getStoredFavorites().filter(
      (comment) => comment.uuid !== this._newComment.uuid
    );

    if (this._newComment.favorite) {
      favorites.push(this._newComment);
    }

    localStorage.setItem('favorite', JSON.stringify(favorites));

    this._patchCommentData(this._newComment);
    this._showFavoriteComments();
  };

  updateFavoriteButton() {
    const favoriteButton = this._elements[Elements.favorite] as HTMLButtonElement;
    favoriteButton.innerHTML = this._newComment.favorite
      ? `<img src="./images/completed_heart.svg" alt="completed heart"/> В избранном`
      : `<img src="./images/empty_heart.svg" alt="empty heart"/> В избранное`;
  }

  updateReplies = () => {
    this._repliesData = getStoredComments().filter(
      (item) => item.parent === this._newComment.uuid
    ) as ChildComment[];

    this._elements[Elements.replies]?.querySelector('.comment_form')?.remove();
    this.renderReplies();
    this._updateComments();
  };
}
