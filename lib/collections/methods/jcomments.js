import ClassUser from '../../exports/user'
import ClassMedia from '../../exports/media'

const notToOpt = {
	validate: false,
	filter: false,
	getAutoValues: false,
	removeEmptyStrings: false
}

/**
 * Call a meteor method with user id if there is as the last argument.
 *
 * @param {String} methodName
 * @param {Array} methodArgs
 */
function callWithUserData(methodName, ...methodArgs) {
  const UserData = {}
  Meteor.apply(methodName, [...methodArgs, UserData])
}

/**
 * call a service function
 * @param  {string} name    service name to be called
 * @param  {string} action  the method name
 * @param  {object} payload additional options or params
 * @return {void}
 */
const triggerEvent = (name, action, payload) => {
  const func = JComments.config().onEvent

  if (_.isFunction(func)) {
    func(name, action, payload)
  }
}
/**
 * calculates the avrage  rating of a comment
 * @param  {object} doc   comment to get its ratings
 * @return {decimal}
 */
const getRatingScore = (doc) => {
  let score = JCommentsCollection._calculateAverageRating(doc.starRatings)

  if (score ===  0) {
    score = doc.likes.length
  }

  return score
}
/**
 * Updates the rating score for a passed comment into database
 * @param  {string} _id   id of the comment
 * @return {void}
 */
const updateRatingScoreOnDoc = (_id) => {
  JCommentsCollection.update({ _id }, {
    $set: { ratingScore: getRatingScore(JCommentsCollection.findOne(_id)) }
  })
}
/**
 * 
 */
const anonUserDetected = () => {
	if( !Meteor.userId() )
		throw new Meteor.Error('not-authorized')
	else
		return true
}
/**
 * gets the reference id of a specified document
 * @param  {string} documentId
 * @return {string}
 */
const getReferenceIdByDocumentId = documentId => JCommentsCollection.findOne({ _id: documentId }, { fields: { referenceId: 1 } }).referenceId

Meteor.methods({
  'comments/add': function (referenceId, content, _UserData) {
    check(referenceId, String)
    check(content, String)
    
    const uid = this.userId || anonUserDetected()

    content = content.trim()

    if (uid && content) {
      const doc = {
        referenceId,
        content,
        uid,
        createdAt: (new Date()),
        likes: [],
        replies: [],
 
        media: ClassMedia.getContentIncludedMedia(content)
      }

      const docId = JCommentsCollection.insert(doc)

      triggerEvent('comment', 'add', Object.assign({}, doc, { _id: docId }))
    }
  },
  'comments/edit': function (documentId, newContent, _UserData) {
    check(documentId, String)
    check(newContent, String)

    const uid = this.userId || anonUserDetected()

    newContent = newContent.trim()

    if (!uid || !newContent) {
      return
    }

    const setDoc = { content: newContent, likes: [], media: ClassMedia.getContentIncludedMedia(newContent), ratingScore: 0 }
    const findSelector = { _id: documentId, uid }

    JCommentsCollection.update(
      findSelector,
      { $set: setDoc }
    )

    triggerEvent('comment', 'edit', Object.assign({}, setDoc, findSelector))
  },
  'comments/remove': function (documentId, _UserData) {
    check(documentId, String)

    const uid = this.userId || anonUserDetected()

    const removeSelector = { _id: documentId, uid }

    const doc = JCommentsCollection.findOne(removeSelector)

    JCommentsCollection.remove(removeSelector)

    triggerEvent('comment', 'remove', doc)
  },
  'comments/like': function (documentId, _UserData) {
    check (documentId, String)

    const uid = this.userId || anonUserDetected()

    if (!uid || JComments.config().rating !== 'likes') {
      return
    }

    const findSelector = { _id: documentId }

    const likedDoc = JCommentsCollection.findOne({ _id: documentId, likes: { $in: [uid] } })

    if (likedDoc) {
      JCommentsCollection.update(findSelector, { $pull: { likes: uid } }, noOptOptions)
    } else {
      JCommentsCollection.update(findSelector, { $push: { likes: uid } }, noOptOptions)
    }

    updateRatingScoreOnDoc(documentId)

    triggerEvent('comment', 'like', Object.assign({}, likedDoc, findSelector, {
      ratedUserId: uid
    }))
  },
  'comments/star': function (documentId, starsCount, _UserData) {
    check(documentId, String)
    check(starsCount, Number)

    const uid = this.userId || anonUserDetected()

    if (!uid || JComments.config().rating !== 'stars') {
      return
    }

    const findSelector = { _id: documentId }

    const starredDoc = JCommentsCollection.findOne({ _id: documentId, 'starRatings.uid': uid })

    if (starredDoc) {
      JCommentsCollection.update(findSelector, { $pull: { starRatings : { uid } } }, noOptOptions)
    }

    JCommentsCollection.update(findSelector, { $push: { starRatings: { uid, rating: starsCount } } })

    updateRatingScoreOnDoc(documentId)

    triggerEvent('comment', 'star', Object.assign({}, starredDoc, findSelector, {
      ratedUserId: uid,
      rating: starsCount
    }))
  },
  'comments/count': function (referenceId) {
    check(referenceId, String)
    return JCommentsCollection.find({ referenceId: referenceId }).count()
  }
})

JCommentsCollection.methods = {
  add: (referenceId, content) => callWithUserData('comments/add', referenceId, content),
  like: (documentId) => callWithUserData('comments/like', documentId),
  star: (documentId, starsCount) => callWithUserData('comments/star', documentId, starsCount),
  edit: (documentId, newContent) => callWithUserData('comments/edit', documentId, newContent),
  remove: (documentId) => callWithUserData('comments/remove', documentId)
}