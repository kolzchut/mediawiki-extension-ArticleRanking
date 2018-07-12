( function ( mw, $ ) {
	'use strict';

	mw.ranking = {
		positiveVote: false,
		config: mw.config.get( 'wgArticleRankingConfig' ),
		$btns: $( '.ranking-section .sub-section1 .ranking-btn' ),
		$statusIcon: $( '<i class="fa fa-spinner fa-spin"></i>' ),
		$votingMessages: $( '.ranking-section .voting-messages' ),
		vote: function ( token ) {
			return $.ajax( {
				method: 'POST',
				url: mw.config.get( 'wgServer' ) + mw.config.get( 'wgScriptPath' ) + '/api.php',
				data: {
					action: 'rank-vote',
					id: mw.config.get( 'wgArticleId' ),
					format: 'json',
					token: token,
					vote: Number( this.positiveVote )
				},
				success: function ( response ) {
					if ( response.ranking.success ) {
						mw.ranking.setMessage( mw.messages.get( 'ranking-vote-success' ) );
						mw.ranking.$statusIcon.removeClass( 'fa-spinner fa-spin' ).addClass( 'fa-check' );
						mw.ranking.trackEvent( 'click', 'vote', mw.ranking.positiveVote );
					} else {
						mw.ranking.informFailedVote();
					}
				}
			} );
		},
		setMessage: function ( msg ) {
			mw.ranking.$votingMessages.text( msg ).show();
		},
		informFailedVote: function () {
			mw.ranking.$btns.attr( 'disabled', false ).removeClass( 'selected' );
			mw.ranking.$statusIcon.detach();
			mw.ranking.setMessage( mw.messages.get( 'ranking-vote-fail' ) );
		},
		verifyCaptcha: function ( token ) {
			return mw.ranking.vote( token );
		},
		trackEvent: function ( action, label, value ) {
			if ( mw.ranking.config.trackClicks !== true ||
				mw.loader.getState( 'ext.googleUniversalAnalytics.utils' ) === null
			) {
				return;
			}

			mw.loader.using( 'ext.googleUniversalAnalytics.utils' ).then( function () {
				mw.googleAnalytics.utils.recordEvent( {
					eventCategory: 'ranking',
					eventAction: action,
					eventLabel: label,
					eventValue: value,
					nonInteraction: false
				} );
			} );
		}
	};

	$( document ).ready( function () {
		$( mw.ranking.$btns ).on( 'click', function () {
			mw.ranking.$votingMessages.hide(); // In case we already displayed a message before
			mw.ranking.positiveVote = $( this ).hasClass( 'yes' );
			mw.ranking.$btns.attr( 'disabled', true );
			$( this ).prepend( mw.ranking.$statusIcon );
			$( this ).addClass( 'selected' );
			grecaptcha.execute();
		} );

	} );

	window.verifyRankingCaptcha = mw.ranking.verifyCaptcha;
	window.handleRankingCaptchaError = mw.ranking.informFailedVote;

}( mediaWiki, jQuery ) );
