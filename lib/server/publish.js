/**
 * Return user ids by the given comment.
 *
 * @param {Object} comment
 *
 * @returns {Array}
 */
function getUserIdsByComment(comment) {
  var ids = []

  ids.push(comment.uid)

  if (comment.replies) {
    _.each(comment.replies, function (reply) {
      ids = _.union(ids, getUserIdsByComment(reply))
    })
  }

  return ids
}

Meteor.publishComposite('comments/reference', function (id, sorting, limit, skip = 0) {
  check(id, String)
  check(sorting, String)
  check(limit, Number)
  check(skip, Number)

  return {
    find: () => JComments._collection.find(
      { referenceId: id },
      { limit, skip, sort: JComments.getSortOption(sorting) }
    ),
    children: [{
      find(comment) {
        const userIds = getUserIdsByComment(comment)

        return Meteor.users.find(
          { _id: { $in: userIds } },
          { fields: JComments.config().publishUserFields }
        )
      }
    }]
  }
})
