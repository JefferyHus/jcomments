import ClassUser from '../exports/user'
import ClassTime from '../exports/time'
import linkifyStr from 'linkifyjs/string'


JCommentsCollection = new Mongo.Collection('comments')

JCommentsCollection.schemas = {}

JCommentsCollection.schemas.StarRatingSchema = new SimpleSchema({
	uid: {
		type: String
	},
	rating: {
		type: Number
	}
})

/**
 * This function will build a complete collection schema for our JComments package
 * 
 * @param  {Object} schemaAdditionalConfig [additional values to be enhanced with the core schema]
 * @return {Object}                        [returns a complete collection schema, optionally enhanced with additional configurations]
 */
function getJCommentSchema(schemaAdditionalConfig = {}){
	return {
		uid: {
			type: String
		},
		content: {
			type: String,
			min: 1,
			max: 1000,
		},
		likes: {
			type: [String],
			autoValue: function() {
				if (this.isInsert) {
					return [];
				}
			},
			optional: true
		},
		'media.type': {
		  type: String,
		  optional: true
		},
		'media.content': {
		  type: String,
		  optional: true
		},
		startRatings: {
			type: [JCommentsCollection.schemas.StarRatingSchema],
			autoValue: function() {
				if (this.isInsert) {
					return []
				}
			},
			optional: true
		},
		// Sorting param to be used as a key to sort comments
		ratingScore: {
			type: Number,
			decimal: true,
			autoValue: function() {
				if (this.isInsert) {
					return 0
				}
			}
		},
	    createdAt: {
	      type: Date,
	      autoValue: function() {
	        if (this.isInsert) {
	          return new Date
	        } else if (this.isUpsert) {
	          return { $setOnInsert: new Date }
	        } else {
	          this.unset()
	        }
	      }
	    },
	    UpdatedAt: {
	      type: Date,
	      autoValue: function() {
	        if (this.isUpdate) {
	          return new Date()
	        }
	      },
	      denyInsert: true,
	      optional: true
	    },
	    ...schemaAdditionalConfig
	}
}

JCommentsCollection.schemas.CommentSchema = new SimpleSchema(getJCommentSchema({
  referenceId: {
    type: String
  }
}))

JCommentsCollection.attachSchema(JCommentsCollection.schemas.CommentSchema)

// Set as being handled with Meteor.methods
JCommentsCollection.allow({
	insert: () => false,
	update: () => false,
	remove: () => false
})

// Calculate the avrage rating value
const calculateRatingAvrageValue = (ratingValues) => _.reduce(
	ratingValues,
	(avrageRating, rating) => (avrageRating + rating.rating / ratingValues.length),
	0
)

JCommentsCollection._calculateRatingAvrageValue = calculateRatingAvrageValue

// Collection helpers
JCommentsCollection.helpers({
	totalLikes: function () {
		if (this.likes && this.likes.length) {
			return this.likes.length;
		}

		return null
	},
	user: function () {
		return ClassUser.getUserById(this.uid)
	},
	timeAgo: function () {
		return ClassTime.fromNowReactive(moment(this.createdAt))
	},
	enhancedContent: function () {
		return linkifyStr(this.content)
	},
	getStarRating: function () {
		if (_.isArray(this.starRatings)) {
		  const ownRating = _.find(this.starRatings, rating => rating.uid === Meteor.userId())

		  if (ownRating) {
		    return {
		      type: 'user',
		      rating: ownRating.rating
		    }
		  }

		  return {
		    type: 'average',
		    rating: calculateAverageRating(this.starRatings)
		  }
		}

		return {
		  type: 'average',
		  rating: 0
		}
	}
})