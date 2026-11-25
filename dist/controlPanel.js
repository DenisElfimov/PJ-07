import { getElements, getStoredComments } from './utils.js';
var Elements;
(function (Elements) {
    Elements["commentsFilter"] = "commentsFilter";
    Elements["counter"] = "counter";
    Elements["selectButton"] = "selectButton";
    Elements["selectDropdown"] = "selectDropdown";
    Elements["favoriteFilter"] = "favoriteFilter";
})(Elements || (Elements = {}));
export class ControlPanel {
    constructor(controlPanel, updateComments, showFavoriteComments) {
        this._elements = {};
        this._selectData = [
            { key: 'date', value: 'По дате' },
            { key: 'rating', value: 'По количеству оценок' },
            { key: 'relevance', value: 'По актуальности' },
            { key: 'replies', value: 'По количеству ответов' },
        ];
        this._sampleControlPanel = `
    <button class="comments_btn active" data-element="${Elements.commentsFilter}">
      Комментарии <span data-element="${Elements.counter}"></span>
    </button>
    <div class="btn_wrapper">
      <div class="select">
        <button class="select_btn" data-element="${Elements.selectButton}">
          <span>По актуальности</span> <img src="./images/arrow_up.svg" alt="arrow up"/>
        </button>
        <ul class="select_dropdown hide"
        data-element="${Elements.selectDropdown}">
          ${this._selectData
            .map((item) => `<li data-value="${item.key}"><img src="./images/checkbox.svg" alt="checkbox"/> ${item.value}</li>`)
            .join('')}
        </ul>
      </div>
      <button class="favorite_btn" data-element="${Elements.favoriteFilter}">
        <span>Избранное</span> <img src="./images/favorite_heart.svg" alt="favorite heart"/>
      </button>
    </div>
  `;
        this.onSelectButton = () => {
            const button = this._elements[Elements.selectButton];
            const icon = button.lastElementChild;
            const dropdown = this._elements[Elements.selectDropdown];
            icon?.classList.toggle('rotate');
            dropdown.classList.toggle('hide');
        };
        this.onSelectDropdown = (event) => {
            if (!(event.target instanceof HTMLElement))
                return;
            const listItem = event.target.closest('li');
            if (!listItem)
                return;
            const sortType = listItem.getAttribute('data-value');
            if (!sortType || !this._selectData.some((item) => item.key === sortType))
                return;
            localStorage.setItem('sort', sortType);
            this.updateSortState();
            const button = this._elements[Elements.selectButton];
            const icon = button.lastElementChild;
            const dropdown = this._elements[Elements.selectDropdown];
            icon?.classList.remove('rotate');
            dropdown.classList.add('hide');
            this._updateComments();
        };
        this._controlPanel = controlPanel;
        this._updateComments = updateComments;
        this._showFavoriteComments = showFavoriteComments;
        this.introduce();
    }
    introduce() {
        this._controlPanel.innerHTML = this._sampleControlPanel;
        getElements(this._controlPanel, this._elements);
        this.updateCounter();
        this.addListeners();
        this.updateSortState();
    }
    updateCounter() {
        const counter = this._elements[Elements.counter];
        const commentsCounter = getStoredComments().filter((item) => !item.parent).length;
        counter.textContent = `(${commentsCounter})`;
    }
    resetFavoriteFilter() {
        const favoriteFilter = this._elements[Elements.favoriteFilter];
        const commentsFilter = this._elements[Elements.commentsFilter];
        commentsFilter.classList.add('active');
        favoriteFilter.classList.remove('active');
        localStorage.setItem('favoriteState', 'false');
    }
    getSortType() {
        const sortType = localStorage.getItem('sort');
        if (sortType && this._selectData.some((item) => item.key === sortType)) {
            return sortType;
        }
        return 'relevance';
    }
    updateSortState() {
        const sortType = this.getSortType();
        const sortData = this._selectData.find((item) => item.key === sortType);
        const button = this._elements[Elements.selectButton];
        const buttonLabel = button.querySelector('span');
        const dropdown = this._elements[Elements.selectDropdown];
        if (buttonLabel && sortData) {
            buttonLabel.textContent = sortData.value;
        }
        dropdown.querySelectorAll('li').forEach((item) => {
            const checkMark = item.querySelector('img');
            if (checkMark) {
                checkMark.style.visibility =
                    item.getAttribute('data-value') === sortType ? 'visible' : 'hidden';
            }
        });
    }
    addListeners() {
        const selectButton = this._elements[Elements.selectButton];
        const selectDropdown = this._elements[Elements.selectDropdown];
        const favoriteFilter = this._elements[Elements.favoriteFilter];
        const commentsFilter = this._elements[Elements.commentsFilter];
        selectButton.addEventListener('click', this.onSelectButton);
        selectDropdown.addEventListener('click', this.onSelectDropdown);
        favoriteFilter.addEventListener('click', () => {
            favoriteFilter.classList.add('active');
            commentsFilter.classList.remove('active');
            localStorage.setItem('favoriteState', 'true');
            this._showFavoriteComments();
        });
        commentsFilter.addEventListener('click', () => {
            this.resetFavoriteFilter();
            this._updateComments();
        });
    }
}
