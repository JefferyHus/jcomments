const ClassUser = (function (){

	return {
		notLoggedIn() {
			return Meteor.userId() ? false : true;
		},
		/**
		 * Return the user id
		 * @return {String}
		 */
		getUserId() {
			let userId = Meteor.userId();

			if( !userId ){
				userId = {_id: null};
			}

			return userId;
		},
		/**
		 * Set ractive user data for the package
		 * @param {Object} userCommentData
		 */
		setUserCommentSession(userCommentData) {
			JComments.session.set('jcomments-data', userCommentData);
		},
		/**
		 * Return an object containing the user's id and salt
		 * @return {Object}
		 */
		getUserCommentSession() {
			return JComments.session.get('jcomments-data');
		},

		getUserById(uid) {
			const user = Meteor.users.findOne(uid),
				  generateBeautyName = JComments.config().generateBeautyName

			if (user){
				let displayName

				if (generateBeautyName) {
					displayName = generateBeautyName(user);
				} else {
					// oauth facebook users (or other oauth package)
					if ( user.profile ) {
						displayName = user.profile.name
					}
					// set the email's address as a display name
					if ( user.emails && user.emails[0] ) {
						displayName = user.emails[0].address
					}
					// or if there is none use the username
					if ( user.username ){
						displayName = user.username
					}
				}

				return { displayName }
			} else {
				return { displayName: 'Guest' }
			}
		}
	}

})()

export default ClassUser