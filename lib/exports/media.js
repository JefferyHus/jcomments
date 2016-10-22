const ClassMedia = (() => {
  return {
    getContentIncludedMedia: function (content) {
      const analyzers = JComments.config().mediaAnalyzers
      let media = {}

      if (analyzers && _.isArray(analyzers)) {
        _.forEach(analyzers, function (analyzer) {
          const mediaContent = analyzer.getContentIncludedMedia(content)

          if (mediaContent && !media.content) {
            media = {
              type: analyzer.name,
              content: mediaContent
            }
          }
        })
      }

      return media
    },
    getMarkup(media) {
      const analyzers = JComments.config().mediaAnalyzers

      const filteredAnalyzers = _.filter(analyzers, function (filter) {
        return filter.name === media.type
      })

      if (filteredAnalyzers && filteredAnalyzers.length > 0) {
        return filteredAnalyzers[0].getMarkup(media.content)
      }
    }
  }
})()

export default ClassMedia