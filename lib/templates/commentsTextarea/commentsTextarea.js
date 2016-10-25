import ClassUser from '../../exports/user'

Template.commentsTextarea.helpers(_.extend(defaultCommentHelpers, {
  customTextareaTemplate() {
    return defaultCommentHelpers.getCustomTemplate('textareaTemplate', 'commentsTextarea', this)
  },
  addButtonKey() {
    return this.reply ? 'add-button-reply' : 'add-button'
  },
  defaultAddButtonText() {
    return this.reply ? 'Add reply' : 'Add comment'
  }
}))
