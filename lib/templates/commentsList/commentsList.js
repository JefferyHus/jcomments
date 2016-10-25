import ClassUser from '../../exports/user'

Template.commentsList.helpers(_.extend(defaultCommentHelpers, {
  comment() {
    return JComments.get(this.id, JComments.getSortOption(JComments.ui.getSorting(this.id)))
  },
  customLoadingTemplate() {
    return defaultCommentHelpers.getCustomTemplate('loadingTemplate', 'commentsList', this)
  },
  customListTemplate() {
    return defaultCommentHelpers.getCustomTemplate('commentListTemplate', 'commentsList', this)
  }
}))

Template.commentsList.onCreated(function () {
  this.autorun(() => {
    this.subscribe(
      'comments/reference',
      this.data.id,
      JComments.ui.getSorting(this.data.id),
      JComments.ui.config().limit
    )
  })
})
