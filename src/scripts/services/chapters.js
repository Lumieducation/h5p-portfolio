import Chapter from './../chapter';

export default class Chapters {

  /**
   * Fill chapters with chapters.
   * @param {object} chapters Chapters.
   */
  static fill(params = [], contentId, extras = {}) {
    Chapters.chapters = Chapters.build(
      Chapters.sanitize(params),
      contentId,
      extras
    );
  }

  /**
   * Convenience function to retrieve chapters.
   * Parameter undefined: all chapters.
   * Parameter number: get by index.
   * Parameter string: get by subContentId.
   * @param {undefined|string|number} param Parameter.
   * @return {Chapter|Chapter[]} Chapter|Chapters.
   */
  static get(param) {
    if (typeof param === 'number') {
      return Chapters.getByIndex(param);
    }
    else if (typeof param === 'string') {
      return Chapters.getBySubcontentId(param);
    }
    else if (!param) {
      return Chapters.getAll();
    }
    else {
      return null;
    }
  }

  /**
   * Get all chapters.
   * @return {Chapter[]} Chapters.
   */
  static getAll() {
    return Chapters.chapters || [];
  }

  /**
   * Get chapter by index.
   * @param {number} index Chapter index.
   * @return {Chapter} Chapter.
   */
  static getByIndex(index) {
    const length = Chapters.chapters?.length;

    if (!length || index < 0 || index > length - 1) {
      return {}; // Nothing to offer
    }

    return Chapters.chapters[index] || {};
  }

  /**
   * Get chapter by subContentId.
   * @param {string} subContentId SubContentId.
   * @return {Chapter} Chapter.
   */
  static getBySubcontentId(subContentId) {
    if (typeof subContentId !== 'string') {
      return {};
    }

    return Chapters.chapters.find(chapter => {
      return chapter.instance?.subContentId === subContentId;
    }) || {};
  }

  /**
   * Sanitize parameters.
   * @param {object[]} params Semantics parameters for chapters.
   * @return {object} Sanitized parameters for chapters.
   */
  static sanitize(params = []) {
    // Filter out empty chapters
    params = params.filter(chapter => {
      return chapter?.content?.params?.contents?.length > 0;
    });

    // Add dummy chapter. TODO: parameters for Advanced Text
    if (!params.length) {
      params = [{
        id: 0,
        chapterHierarchy: 1,
        content: {}
      }];
    }

    return params;
  }

  /**
   * Build chapters.
   * @param {object[]} params Semantics parameters for chapters.
   * @return {Chapter[]} Sanitized parameters for chapters.
   */
  static build(params = [], contentId, extras = {}) {
    return params.map((chapter, index) => {
      const newChapter = new Chapter({
        id: index,
        hierarchy: chapter.chapterHierarchy,
        content: chapter.content,
        contentId: contentId,
        previousState: Array.isArray(extras.previousState.chapters) ?
          this.previousState.chapters[index] :
          {}
      });

      return newChapter;
    });
  }
}

Chapters.chapters = [];
