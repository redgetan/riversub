river.model.SocialShare = {
  populateShareCounts: function (url) {
    // twitter share count
    $.ajax({
      url: "http://urls.api.twitter.com/1/urls/count.json?url=" + url,
      type: "GET",
      dataType: "jsonp",
      success: function(data) {
        if (data.count > 0) {
          $(".tweet_count").text(data.count); 
        }
      },
      error: function(data) {
      }
    });
  }
}