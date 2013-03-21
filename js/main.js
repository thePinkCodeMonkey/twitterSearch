// main js file containing the Backbone objects needed
$(function(){
	// Our basic **Todo** model has `title`, `order`, and `done` attributes.
	var TwitterFeed = Backbone.Model.extend({
		idAttribute:"id",
	    // Default attributes for the todo item.
	    defaults: function() {
	      return {
	        fromUsername: '',
	        profileImage: '',
	        tweetText: '',
	        createDate: ''
	      };
	    },

	    //intialize the feed
	    initialize: function(jsonObj) {
	    	this.set({"fromUsername": jsonObj.from_user});
			this.set({"profileImage": jsonObj.profile_image_url});
			this.set({"tweetText": jsonObj.text});
			this.set({"createDate": jsonObj.created_at});
	    },	
	});

	//Collection of tweets
	var TweetCollections = Backbone.Collection.extend({
		model: TwitterFeed,
		url: function () {
		  return 'http://search.twitter.com/search.json?'+this.constructUri();
		},

		initialize: function() {
	    	this.page = 1;
			this.query = '';
			this.sinceId = '0';
	    },

	    constructUri: function()
	    {
	    	var uriParam = new Array();
	    	uriParam.push('q='+escape(this.query));
	    	uriParam.push('page='+this.page);
	    	uriParam.push('since_id='+escape(this.sinceId));
			uriParam.push('callback=?');
			return uriParam.join('&');

	    },

		//overwrite the parse function to collect the result and catch errors
		parse: function(resp, xhr) {

			if(resp.error ===undefined)
			{
				//process each tweet slightly to extract the info we want
				var processedResult = new Array();
				var iteratorFunc = function(response){
					var newObj = {
						from_user: response.from_user,
						profile_image_url: response.profile_image_url,
						text: response.text,
						created_at: response.created_at,
						id: response.id
					};
					//insert the tweets in reverse order, so they can be populated in correct order
					processedResult.unshift(newObj);
				};

				//update the since id, so we get the latest tweets
				this.sinceId = resp.max_id_str;
				_.each(resp.results, iteratorFunc);
				return(processedResult);
			}
			else
			{
				//pass the error through an error event
				this.trigger("Error", resp.error);
				return([]);
			}
		},

		//Sets all the parameters used
		setSearchParam: function(searchParam, page, sinceId)
		{
			this.page = page || 1;
			this.query = searchParam;
			this.sinceId = sinceId ||this.sinceId;
		},
	});

	// The DOM element for a single feed
	var TwitterFeedView = Backbone.View.extend({
		tagName:  "li",
		template: _.template($('#feed-template').html()),

		render: function() {
		  this.$el.html(this.template(this.model.toJSON()));
		  return this;
		},
	});
	
	//create an actual collection for tweets
	var TwitterFeeds = new TweetCollections;

	//main application, handles the search
	var AppView = Backbone.View.extend({
		
		el: $("#search"),

		// Bind events for search submission and manual refresh
		events: {
		  "click #submitButton": "submitSearch",
		  "click #refreshButton": "refreshFeed",
		  "click #stopAutoRefresh": "stopTimer",
		},

		//Initialize the main application by loading last inputted search,
		//biding shortcuts to elements and listening to the twitter feed collection
		initialize: function()
		{
			this.currentSearch = '';

			//Listening to events on TwitterFeeds Collection
			this.listenTo(TwitterFeeds, "reset", this.addNewFeed);
			this.listenTo(TwitterFeeds, "Error", this.displayNotification);

			//binding shortcuts to DOM
			this.searchInput = $('#searchInput');
			this.refreshButton = $('#refreshButton');
			this.searchOverview = $('#currentSearchString');
			this.notificationPanel = $('#notificationPanel');
			this.notification = $('#notification');

			//initialize search string if it has been stored in local storage
			this.currentSearch = localStorage.getItem('lastTwitterFeedSearch')||'';
			$('#searchInput').val(this.currentSearch);

			//setup variables
			this.intervalId = null;
			this.intervalInSec = 5;

			//set up view
			$('#feed').hide();
			this.notificationPanel.hide();
		},

		//call back to the reset event, adds a list of new feeds
		addNewFeed: function(){
			$('#feedList li').removeClass("newFeed");
			TwitterFeeds.each(function(m){
				var view = new TwitterFeedView({model: m});
				view.$el.addClass("newFeed");
				this.$("#feedList").prepend(view.render().el);
			});
		},
		
		//Validates user search input and initiate the twitter search API call
		//Resets the timer if the input is valid
		submitSearch: function(){
			//validate input
			if(this.searchInput.val() === '')
			{
				this.displayNotification("Please enter some words to search for.");
			}
			else
			{
				$('#feed').show();
				this.currentSearch = this.searchInput.val();
				this.searchOverview.text("Currently Searching for '"+this.currentSearch+"'.");
				//save search string to local storage
				localStorage.setItem('lastTwitterFeedSearch', this.currentSearch);
				this.refreshFeed();
			}			
		},

		//Refreshes the search with the this.currentSearch param, resets the timer
		refreshFeed: function(){
			var fetchTweets = function(){
				TwitterFeeds.fetch({reset: true});
			};

			TwitterFeeds.setSearchParam(this.currentSearch);
			this.stopTimer();
			fetchTweets();
			this.intervalId = window.setInterval(fetchTweets, this.intervalInSec*1000);
		},

		//stops the timer for auto fetching feeds
		stopTimer: function(){
			window.clearInterval(this.intervalId);
		},

		//display notifications if an error occurs and stops the auto refresh
		displayNotification: function(message){
			this.notification.text(message);
			this.notificationPanel.show().fadeOut(2000);
			this.stopTimer();
		}
	});

	var App = new AppView;
	window.app = App;
});