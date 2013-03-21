// main js file containing the Backbone objects needed
$(function(){
	// Our basic **Todo** model has `title`, `order`, and `done` attributes.
	var TwitterFeed = Backbone.Model.extend({

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
		  return 'http://search.twitter.com/search.json?q=' + this.query + '&page=' + this.page + '&callback=?'
		},

		initialize: function() {
	    	this.page = 1;
			this.query = '';
	    },	

		//overwrite the parse function to collect the result and catch errors
		parse: function(resp, xhr) {
		  console.log(resp.results);
		  return resp.results;
		},

		//Sets all the parameters used
		setSearchParam: function(searchParam, page)
		{
			this.page = page | 1;
			this.query = searchParam;
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
		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
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
			this.listenTo(TwitterFeeds, 'Tweets', this.addOne);
			this.listenTo(TwitterFeeds, "reset", this.addNewFeed);

			//binding shortcuts to DOM
			this.searchInput = $('#searchInput');
			this.refreshButton = $('#refreshButton');
			this.searchOverview = $('#currentSearchString');

			//initialize search string if it has been stored in local storage
			this.currentSearch = localStorage.getItem('lastTwitterFeedSearch')||'';
			$('#searchInput').val(this.currentSearch);
		},

		//
		addOne: function(message){
			console.log('Add event is thrown '+message);
		},

		//
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
			TwitterFeeds.setSearchParam(this.currentSearch);
			TwitterFeeds.fetch({reset: true});
			console.log("Refreshing the feed "+this.currentSearch);
		}
	});

	var App = new AppView;
});