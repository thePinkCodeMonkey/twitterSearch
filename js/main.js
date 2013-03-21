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
		  return 'http://search.twitter.com/search.json?q=' + this.query + '&page=' + this.page + '&since_id='+this.sinceId+'&callback=?'
		},

		initialize: function() {
	    	this.page = 1;
			this.query = '';
			this.sinceId = '0';
	    },

		//overwrite the parse function to collect the result and catch errors
		parse: function(resp, xhr) {

			//process each tweet slightly to extrac the info we want
			var processedResult = new Array();
			var iteratorFunc = function(response){
				var newObj = {
					from_user: response.from_user,
					profile_image_url: response.profile_image_url,
					text: response.text,
					created_at: response.created_at,
					id: response.id
				};
				//insert the tweets in reverse order
				processedResult.unshift(newObj);
			};
			this.sinceId = resp.max_id_str;
			_.each(resp.results, iteratorFunc);
			return(processedResult);
			//return resp.results;
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
	
	var TwitterFeeds = new TweetCollections;

	//main application, handles the search
	var AppView = Backbone.View.extend({
		
		el: $("#search"),

		// Bind events for search submission and manual refresh
		events: {
		  "click #submitButton": "submitSearch",
		  "click #refreshButton": "refreshFeed"
		},

		//Initialize the main application by loading last inputted search,
		//biding shortcuts to elements and listening to the twitter feed collection
		initialize: function()
		{
			$('#feed').hide();
			this.currentSearch = '';

			//Listening to events on TwitterFeeds Collection
			this.listenTo(TwitterFeeds, "reset", this.addNewFeed);

			//binding shortcuts to DOM
			this.searchInput = $('#searchInput');
			this.refreshButton = $('#refreshButton');
			this.searchOverview = $('#currentSearchString');

			//initialize search string if it has been stored in local storage
			this.currentSearch = localStorage.getItem('lastTwitterFeedSearch')||'';
			$('#searchInput').val(this.currentSearch);

			//setup variables
			this.intervalId = null;
			this.intervalInSec = 5;
		},

		//call back to the reset event, adds a list of new feeds
		addNewFeed: function(){
			TwitterFeeds.each(function(m){
				var view = new TwitterFeedView({model: m});
				this.$("#feedList").prepend(view.render().el);
			});
			console.log('Add a lot of stuff');
		},
		
		//Validates user search input and initiate the twitter search API call
		//Resets the timer if the input is valid
		submitSearch: function(){
			//validate
			this.currentSearch = this.searchInput.val();
			$('#feed').show();
			this.searchOverview.text("Currently Searching for '"+this.currentSearch+"'.");
			//save search string to local storage
			localStorage.setItem('lastTwitterFeedSearch', this.currentSearch);
			this.refreshFeed();
		},

		//Refreshes the search with the this.currentSearch param, resets the timer
		refreshFeed: function(){
			var fetchTweets = function(){
				TwitterFeeds.fetch({reset: true});
			};

			TwitterFeeds.setSearchParam(this.currentSearch);
			this.stopTimer();
			this.intervalId = window.setInterval(fetchTweets, this.intervalInSec*1000);
			console.log("Refreshing the feed "+this.currentSearch);
		},

		//stops the timer for auto fetching feeds
		stopTimer: function(){
			window.clearInterval(this.intervalId);
		}
	});

	var App = new AppView;
	window.app = App;
});