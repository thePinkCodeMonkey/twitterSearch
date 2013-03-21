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
    initialize: function(fromUsername, profileImage, tweetText, createDate) {
    	this.set({"fromUsername": fromUsername});
		this.set({"profileImage": profileImage});
		this.set({"tweetText": tweetText});
		this.set({"createDate": createDate});
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
	  console.log(resp);
	  this.trigger("Tweets","Got something from server.");
	  return resp.results;
	},

	//Sets all the parameters used
	setSearchParam: function(searchParam, page)
	{
		this.page = page | 1;
		this.query = searchParam;
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
		TwitterFeeds.fetch({success: function (tweets){}});
		console.log("Refreshing the feed "+this.currentSearch);
	}

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos that might be saved in *localStorage*.
/*    initialize: function() {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      this.listenTo(Todos, 'add', this.addOne);
      this.listenTo(Todos, 'reset', this.addAll);
      this.listenTo(Todos, 'all', this.render);

      this.footer = this.$('footer');
      this.main = $('#main');

      Todos.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var done = Todos.done().length;
      var remaining = Todos.remaining().length;

      if (Todos.length) {
        this.main.show();
        this.footer.show();
        this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      } else {
        this.main.hide();
        this.footer.hide();
      }

      this.allCheckbox.checked = !remaining;
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(todo) {
      var view = new TodoView({model: todo});
      this.$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function() {
      Todos.each(this.addOne, this);
    },

    // If you hit return in the main input field, create new **Todo** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Todos.create({title: this.input.val()});
      this.input.val('');
    },

    // Clear all done todo items, destroying their models.
    clearCompleted: function() {
      _.invoke(Todos.done(), 'destroy');
      return false;
    },

    toggleAllComplete: function () {
      var done = this.allCheckbox.checked;
      Todos.each(function (todo) { todo.save({'done': done}); });
    }
    */

  });

  // Finally, we kick things off by creating the **App**.
  var App = new AppView;
  window.m = new TwitterFeed('Lena');
  console.log(m);  
});