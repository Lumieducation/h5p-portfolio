import Util from './../helpers/util';
import Chapters from './../services/chapters';

/**
 * @constructor
 * @param {object} params Parameters.
 * @param {object} callbacks Callbacks.
 */
class SideBar extends H5P.EventDispatcher {
  constructor(params = {}, callbacks = {}) {
    super();

    this.callbacks = Util.extend({
      onMoved: (() => {}),
      onResized: (() => {})
    }, callbacks);

    this.content = document.createElement('ul');
    this.content.classList.add('navigation-list');
    this.container = this.buildSideBar();

    // TODO: Rename those to avoid confusion with the chapters - those here are navigational elements
    this.chapterNodes = this.getChapterNodes();

    if (params.mainTitle) {
      this.titleElem = this.buildMainTitle(params.mainTitle);
      this.container.appendChild(this.titleElem);
    }

    this.chapterNodes.forEach(element => {
      this.content.appendChild(element);
    });

    if (Chapters.get().length > 20) {
      this.content.classList.add('large-navigation-list');
    }

    this.container.appendChild(this.content);

    this.initializeNavigationControls();
  }

  initializeNavigationControls() {
    const keys = Object.freeze({
      'UP': 'ArrowUp',
      'DOWN': 'ArrowDown',
    });

    // TODO: Add this when building the elements

    this.chapterNodes.forEach((chapter, i) => {
      const chapterButton = chapter.querySelector('.h5p-interactive-book-navigation-chapter-button');
      chapterButton.addEventListener('keydown', (e) => {
        switch (e.key) {
          case keys.UP:
            this.setFocusToChapterItem(i, -1);
            e.preventDefault();
            break;

          case keys.DOWN:
            this.setFocusToChapterItem(i, 1);
            e.preventDefault();
            break;
        }
      });

      const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
        const section = sections[sectionIndex];
        const sectionButton = section.querySelector('.section-button');
        sectionButton.addEventListener('keydown', e => {
          switch (e.key) {
            case keys.UP:
              this.setFocusToSectionItem(i, sectionIndex, -1);
              e.preventDefault();
              break;

            case keys.DOWN:
              this.setFocusToSectionItem(i, sectionIndex, 1);
              e.preventDefault();
              break;
          }
        });
      }
    });
  }

  setFocusToChapterItem(index, direction = 0) {
    let nextIndex = index + direction;
    if (nextIndex < 0) {
      nextIndex = this.chapterNodes.length - 1;
    }
    else if (nextIndex > this.chapterNodes.length - 1) {
      nextIndex = 0;
    }

    // Check if we should navigate to a section
    if (direction) {
      const chapterIndex = direction > 0 ? index : nextIndex;
      const chapter = this.chapterNodes[chapterIndex];
      if (!chapter.classList.contains('h5p-interactive-book-navigation-closed')) {
        const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');
        if (sections.length) {
          const sectionItemIndex = direction > 0 ? 0 : sections.length - 1;
          this.setFocusToSectionItem(chapterIndex, sectionItemIndex);
          return;
        }
      }
    }

    const nextChapter = this.chapterNodes[nextIndex];
    const chapterButton = nextChapter.querySelector('.h5p-interactive-book-navigation-chapter-button');
    this.setFocusToItem(chapterButton, nextIndex);
  }

  setFocusToSectionItem(chapterIndex, index, direction = 0) {
    const chapter = this.chapterNodes[chapterIndex];
    const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');

    // Navigate chapter if outside of section bounds
    const nextIndex = index + direction;
    if (nextIndex > sections.length - 1) {
      this.setFocusToChapterItem(chapterIndex + 1);
      return;
    }
    else  if (nextIndex < 0) {
      this.setFocusToChapterItem(chapterIndex);
      return;
    }

    const section = sections[nextIndex];
    const sectionButton = section.querySelector('.section-button');
    this.setFocusToItem(sectionButton, chapterIndex);
  }

  setFocusToItem(element, chapterIndex, skipFocusing = false) {
    // Remove focus from all other elements
    this.chapterNodes.forEach((chapter, index) => {
      const chapterButton = chapter.querySelector('.h5p-interactive-book-navigation-chapter-button');

      // Highlight current chapter
      if (index === chapterIndex) {
        chapterButton.classList.add('h5p-interactive-book-navigation-current');
      }
      else {
        chapterButton.classList.remove('h5p-interactive-book-navigation-current');
      }
      chapterButton.setAttribute('tabindex', '-1');

      const sections = chapter.querySelectorAll('.h5p-interactive-book-navigation-section');
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionButton = section.querySelector('.section-button');
        sectionButton.setAttribute('tabindex', '-1');

      }
    });

    element.setAttribute('tabindex', '0');
    this.focusedChapter = chapterIndex;
    if (!skipFocusing) {
      element.focus();
    }
  }

  /**
   * Build sidebar DOM.
   * @return {HTMLElement} DOM for sidebar.
   */
  buildSideBar() {
    const container = document.createElement('div');
    container.classList.add('h5p-interactive-book-navigation');

    return container;
  }

  /**
   * Build main title.
   * @param {string} title Title.
   * @return {HTMLElement} Title element.
   */
  buildMainTitle(titleText) {
    const title = document.createElement('h2');
    title.classList.add('navigation-title');
    title.innerHTML = titleText;
    title.setAttribute('title', titleText);

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('h5p-interactive-book-navigation-maintitle');
    titleWrapper.appendChild(title);

    return titleWrapper;
  }

  /**
   * Find sections in chapter.
   *
   * @param {object} columnData Column data.
   * @return {object[]} Sections data.
   */
  findSectionsInChapter(columnData) {
    const sectionsData = [];
    const sections = columnData.params.contents;
    for (let j = 0; j < sections.length; j++) {
      const content = sections[j].content;

      let title = '';
      switch (content.library.split(' ')[0]) {
        case 'H5P.Link':
          if (content.params.title) {
            title = content.params.title;
          }
          else {
            title = 'New link';
          }
          break;
        default:
          title = content.metadata.title;
      }

      sectionsData.push({
        title: title,
        id: content.subContentId ? `h5p-interactive-book-section-${content.subContentId}` : undefined
      });
    }

    return sectionsData;
  }

  /**
   * Toggle chapter menu.
   *
   * @param {HTMLElement} chapterNode Chapter.
   * @param {boolean} collapse If true, will collapse chapter.
   */
  toggleChapter(chapterNode, collapse) {
    collapse = (collapse !== undefined) ? collapse : !(chapterNode.classList.contains('h5p-interactive-book-navigation-closed'));

    const childNav = chapterNode.querySelector('.h5p-interactive-book-navigation-sectionlist');
    const arrow = chapterNode.getElementsByClassName('h5p-interactive-book-navigation-chapter-accordion')[0];
    const chapterButton = chapterNode.querySelector('.h5p-interactive-book-navigation-chapter-button');
    chapterButton.setAttribute('aria-expanded', (!collapse).toString());

    if (collapse === true) {
      chapterNode.classList.add('h5p-interactive-book-navigation-closed');
      if (arrow) {
        arrow.classList.remove('icon-expanded');
        arrow.classList.add('icon-collapsed');
        if (childNav) {
          childNav.setAttribute('aria-hidden', true);
          childNav.setAttribute('tabindex', '-1');
        }
      }
    }
    else {
      chapterNode.classList.remove('h5p-interactive-book-navigation-closed');
      if (arrow) {
        arrow.classList.remove('icon-collapsed');
        arrow.classList.add('icon-expanded');
        if (childNav) {
          childNav.removeAttribute('aria-hidden');
          childNav.removeAttribute('tabindex');
        }
      }
    }
  }

  /**
   * Update entries' state.
   * @param {number} chapterId Chapter that should stay open in the menu.
   */
  update(chapterId) {
    this.chapterNodes.forEach((node, index) => {
      this.toggleChapter(node, index !== chapterId);
    });

    this.callbacks.onResized();

    // Focus new chapter button if active chapter was closed
    if (chapterId !== this.focusedChapter) {
      const chapterButton = this.chapterNodes[chapterId].querySelector('.h5p-interactive-book-navigation-chapter-button');
      this.setFocusToItem(chapterButton, chapterId, true);
    }
  }

  /**
   * Create chapter.
   *
   * @param {object} chapter Chapter data.
   * @param {number} chapterId Chapter Id.
   * @return {HTMLElement} Chapter node.
   */
  getNodesFromChapter(chapter, chapterId) {
    const chapterNode = document.createElement('li');
    chapterNode.classList.add('h5p-interactive-book-navigation-chapter');

    // TODO: Clean this up. Will require to receive chapter info from parent instead of building itself
    const chapterCollapseIcon = document.createElement('div');
    chapterCollapseIcon.classList.add('h5p-interactive-book-navigation-chapter-accordion');

    const chapterTitleText = document.createElement('div');
    chapterTitleText.classList.add('h5p-interactive-book-navigation-chapter-title-text');
    chapterTitleText.innerHTML = chapter.title;
    chapterTitleText.setAttribute('title', chapter.title);

    const chapterNodeTitle = document.createElement('button');
    chapterNodeTitle.setAttribute('tabindex', chapterId === 0 ? '0' : '-1');
    chapterNodeTitle.classList.add('h5p-interactive-book-navigation-chapter-button');
    chapterCollapseIcon.classList.add('icon-expanded');
    chapterNodeTitle.setAttribute('aria-expanded', 'true');
    chapterNodeTitle.setAttribute('aria-controls', sectionsDivId);
    chapterNodeTitle.addEventListener('click', event => {

      if (!event.currentTarget.classList.contains('h5p-interactive-book-navigation-current')) {
        // Open chapter in main content
        this.callbacks.onMoved({
          chapter: Chapters.get(chapterId).getSubContentId(),
          toTop: true
        });
      }

      // Expand chapter in menu
      if (!chapterCollapseIcon.classList.contains('hidden')) {
        this.toggleChapter(event.currentTarget.parentElement);
        this.callbacks.onResized();
      }
    });

    chapterNodeTitle.appendChild(chapterCollapseIcon);
    chapterNodeTitle.appendChild(chapterTitleText);

    chapterNode.appendChild(chapterNodeTitle);

    this.toggleChapter(chapterNode, true);

    const sectionsWrapper = document.createElement('ul');
    sectionsWrapper.classList.add('h5p-interactive-book-navigation-sectionlist');
    const sectionsDivId = 'h5p-interactive-book-sectionlist-' + chapterId;
    sectionsWrapper.id = sectionsDivId;

    const sectionLinks = [];
    // Add sections to the chapter

    const chap = Chapters.get(chapterId);
    const sections = chap.getSections();

    sections.forEach((section, sectionIndex) => {
      section.getContents().forEach(content => {

        if (!Util.isTask(content.getInstance())) {
          // Check text content for headers
          const semantics = content.getSemantics();

          if (semantics.library.split(' ')[0] === 'H5P.AdvancedText') {
            const text = document.createElement('div');
            text.innerHTML = semantics.params.text;
            const headers = text.querySelectorAll('h2, h3');
            for (let j = 0; j < headers.length; j++) {
              const sectionNode = this.buildContentLink({
                id: sectionIndex,
                chapter: chap,
                section: section,
                content: content,
                header: j,
                title: headers[j].textContent
              });

              sectionLinks.push(sectionNode);
              sectionsWrapper.appendChild(sectionNode);
            }
          }
        }
        else {
          const sectionNode = this.buildContentLink({
            id: sectionIndex,
            chapter: chap,
            section: section,
            content: content
          });          sectionLinks.push(sectionNode);
          sectionsWrapper.appendChild(sectionNode);
        }
      });
    });

    // Don't show collapse arrow if there are no sections or on mobile
    if (sectionLinks.length === 0) {
      const arrowIconElement = chapterNode.querySelector('.h5p-interactive-book-navigation-chapter-accordion');
      if (arrowIconElement) {
        arrowIconElement.classList.add('hidden');
      }
    }

    chapterNode.appendChild(sectionsWrapper);

    return chapterNode;
  }

  buildContentLink(params = {}) {
    if (typeof params.id !== 'number' || !params.chapter) {
      return null;
    }

    // label
    const labelText = params.title || params.content?.getTitle() || params.section?.getTitle();
    const label = document.createElement('div');
    label.classList.add('h5p-interactive-book-navigation-section-title');
    label.setAttribute('title', labelText);
    label.innerHTML = labelText;

    // link
    const link = document.createElement('button');
    link.classList.add('section-button');
    link.setAttribute('tabindex', '-1');
    link.appendChild(label);
    link.addEventListener('click', event => {
      event.preventDefault();

      this.callbacks.onMoved({
        chapter: params.chapter?.getSubContentId(),
        section: params.section?.getSubContentId(),
        content: params.content?.getSubContentId(),
        ...(params.header !== undefined && { header: params.header })
      });
    });

    // item node
    const item = document.createElement('li');
    item.classList.add('h5p-interactive-book-navigation-section');
    item.classList.add('h5p-interactive-book-navigation-section-' + params.id);
    item.appendChild(link);

    return item;
  }

  /**
   * Get chapter elements.
   * @return {HTMLElement[]} Chapter elements.
   */
  getChapterNodes() {
    return Chapters.get().map((chapter, index) => this.getNodesFromChapter(chapter, index));
  }
}
export default SideBar;
