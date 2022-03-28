const sidebarTranslate = { left: -100, right: 100 };

export default class Sidebar {

  #el;
  #side;
  #capitalized;
  #isOpened = false;

  constructor(side, el) {
    this.#el = el;
    this.#side = side;
    this.#capitalized = this.#side.charAt(0).toUpperCase() + this.#side.slice(1);
  }

  get #content() {
    return document.getElementById('pageAreaCenter');
  }

  #setStyles() {
    const translate = sidebarTranslate[this.#side];
    const margin = this.#isOpened ?  `${this.#el.offsetWidth}px` : 0;
    const transform = this.#isOpened ? 'none' : `translateX(${translate}%)`;
    this.#content.style[`margin${this.#capitalized}`] = margin;
    this.#el.style.transform = transform;
  }

  open() {
    this.#isOpened = true;
    this.#setStyles();
    return this.#isOpened;
  }

  hide() {
    this.#isOpened = false;
    this.#setStyles();
    return this.#isOpened;
  }

  toggle() {
    return this.#isOpened ? this.hide() : this.open();
  }

}
