import { getStoredComments, getStoredFavorites, sortBy } from './utils.js';
import { Comment, CommentType } from './comment.js';

export class Comments {
  private readonly _comments: HTMLElement;
  private _commentContain: CommentType[] = [];

  constructor(comments: HTMLElement) {
    this._comments = comments;

    this.introduce();
  }

  introduce() {
    this.renderCurrentView();
    this._comments.classList.add('load_animation');
  }

  updateComments = () => {
    this.renderCurrentView();
  };

  showFavoriteComments = () => {
    if (localStorage.getItem('favoriteState') === 'true') {
      this.renderCurrentView();
    }
  };

  private renderCurrentView() {
    this._commentContain = getStoredComments();

    if (localStorage.getItem('favoriteState') === 'true') {
      const favoriteUuids = new Set(
        getStoredFavorites().map((comment) => comment.uuid)
      );
      const favoriteComments = this._commentContain.filter((comment) =>
        favoriteUuids.has(comment.uuid)
      );

      this.renderComments(sortBy(favoriteComments));
      return;
    }

    const parentComments = this._commentContain.filter((comment) => !comment.parent);

    this.renderComments(sortBy(parentComments));
  }

  private renderComments(comments: CommentType[]) {
    this._comments.innerHTML = '';

    comments.forEach((comment) => {
      const element = document.createElement('div');
      element.dataset.element = comment.uuid;
      this._comments.appendChild(element);

      new Comment(
        element,
        comment.uuid,
        this.updateComments,
        this.patchCommentData,
        this.showFavoriteComments
      );
    });
  }

  patchCommentData = (data: CommentType) => {
    const patchedData = getStoredComments().map((comment) =>
      comment.uuid === data.uuid ? data : comment
    );
    localStorage.setItem('comments', JSON.stringify(patchedData));
  };
}
