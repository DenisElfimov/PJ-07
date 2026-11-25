import { ElementsType, createUuid, getElements, getStoredComments } from './utils.js';
import { UserType, getUser } from './request.js';
import { CommentType } from './comment.js';

enum Elements {
  avatar = 'avatar',
  name = 'name',
  charCount = 'charCount',
  error = 'error',
  form = 'form',
  textArea = 'textArea',
  buttonSend = 'buttonSend',
  buttonCancel = 'buttonCancel',
}

export class CommentForm {
  private readonly _commentForm: HTMLElement;
  private readonly _elements: ElementsType = {};
  private _charCount: number | undefined;
  private _user: UserType | null = null;
  private readonly _parent: CommentType | null;

  private readonly _updateComments: () => void;
  private readonly _updateCounter: () => void;

  private _sampleCommentForm = `
    <form action="/" class="form" data-element="${Elements.form}">
      <div class="user_wrapper">
        <img alt="commenter avatar" data-element="${Elements.avatar}"/>
        <p data-element="${Elements.name}"></p>
      </div>
      <div class="textarea_wrapper">
        <textarea class="textarea" placeholder="Введите текст сообщения..." data-element="${Elements.textArea}"></textarea>
        <div class="validation_wrapper">
          <p data-element="${Elements.charCount}">Макс. 1000 символов</p>
          <p data-element="${Elements.error}">Слишком длинное сообщение</p>
        </div>
      </div>
      <div class="form_btn_wrapper">
        <button class="form_btn" type="submit" disabled data-element="${Elements.buttonSend}">Отправить</button>
        <button class="form_btn" type="button" data-element="${Elements.buttonCancel}">Отмена</button>
      </div>
    </form>
  `;
  constructor(
    commentForm: HTMLElement,
    updateComments: () => void,
    updateCounter: () => void,
    parent: CommentType | null = null
  ) {
    this._commentForm = commentForm;
    this._parent = parent;

    this._updateComments = updateComments;
    this._updateCounter = updateCounter;
    this.introduce();
  }

  introduce() {
    this._commentForm.innerHTML = this._sampleCommentForm;
    getElements(this._commentForm, this._elements);

    if (!this._parent) {
      this._elements[Elements.buttonCancel].remove();
      delete this._elements[Elements.buttonCancel];
    }

    getUser().then((user) => {
      this._user = user;
      this.updateUser();
    });

    this.addListeners();
  }

  addListeners() {
    const form = this._elements[Elements.form] as HTMLFormElement;
    const textArea = this._elements[Elements.textArea] as HTMLTextAreaElement;
    const cancelBtn = this._elements[Elements.buttonCancel] as HTMLButtonElement | undefined;

    form.addEventListener('submit', this.onSubmit);
    cancelBtn?.addEventListener('click', this.onCancel);
    textArea.addEventListener('input', () => this.autoResizeTextArea(textArea));
  }

  onSubmit = (event: Event) => {
    event.preventDefault();

    const textArea = this._elements[Elements.textArea] as HTMLTextAreaElement;
    const commentText = textArea.value.trim();

    if (!commentText || commentText.length > 1000 || !this._user) return;

    const comments = getStoredComments();
    const data: CommentType = {
      ...this._user,
      uuid: createUuid(),
      comment: commentText,
      date: new Date().toISOString(),
      favorite: false,
      rating: Math.floor(Math.random() * 201 - 100),
      increment: true,
      decrement: true,
      parent: this._parent?.uuid,
    };

    comments.push(data);
    localStorage.setItem('comments', JSON.stringify(comments));

    this._updateCounter();
    this._updateComments();

    if (!this._parent) {
      textArea.value = '';
      this.autoResizeTextArea(textArea);
    }
  };

  onCancel = () => {
    this._commentForm.remove();
  };

  autoResizeTextArea(textArea: HTMLTextAreaElement) {
    textArea.style.height = 'auto';

    const textAreaHeight = Math.min(textArea.scrollHeight, 400);
    textArea.style.height = `${textAreaHeight}px`;
    textArea.style.overflowY = textArea.scrollHeight > 400 ? 'auto' : 'hidden';

    this.formSymbolValidation(textArea);
  }

  formSymbolValidation(textArea: HTMLTextAreaElement) {
    const charCountElement = this._elements[Elements.charCount] as HTMLParagraphElement;
    const errorElement = this._elements[Elements.error] as HTMLParagraphElement;
    const buttonElement = this._elements[Elements.buttonSend] as HTMLButtonElement;
    this._charCount = textArea.value.length;

    const isLengthValid =
      textArea.value.trim().length > 0 && this._charCount <= 1000;
    buttonElement.disabled = !isLengthValid || !this._user;

    charCountElement.textContent = `${this._charCount}/1000`;

    if (this._charCount > 1000) {
      charCountElement.style.color = '#FF0000';
      charCountElement.style.opacity = '1';
      errorElement.style.visibility = 'visible';
    } else {
      charCountElement.style.color = '#000000';
      charCountElement.style.opacity = '0.4';
      errorElement.style.visibility = 'hidden';
    }
  }

  updateUser() {
    if (!this._user) return;

    const avatar = this._elements[Elements.avatar] as HTMLImageElement;
    const name = this._elements[Elements.name] as HTMLParagraphElement;
    const textArea = this._elements[Elements.textArea] as HTMLTextAreaElement | undefined;

    avatar.setAttribute('src', this._user.avatar);
    name.textContent = this._user.name;

    if (textArea?.value) {
      this.formSymbolValidation(textArea);
    }
  }
}
