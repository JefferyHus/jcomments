const linkAnalyzer = {
  name: 'link',
  /**
   * @param {String} content
   *
   * @return {String}
   */
  getMediaFromContent(content) {
    if (content) {
      const urls = content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)

      if (urls && urls[0]) {
        return urls[0]
      }
    }

    return ''
  },
  /**
   * @param {String} mediaContent
   *
   * @return {String}
   */
  getMarkup: (mediaContent) => `<a href="${mediaContent}" class="link lnk-string" />${mediaContent}</a>`
}

export default linkAnalyzer
