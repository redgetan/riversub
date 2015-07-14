river.model.SocialShare = {
  populateShareCounts: function (url) {

    // twitter share count
    $.ajax({
      url: "https://urls.api.twitter.com/1/urls/count.json?url=" + url,
      type: "GET",
      dataType: "jsonp",
      success: function(data) {
        if (data.count > 0) {
          $(".tweet_count").text(data.count); 
          $(".tweet_count").addClass("positive");
        }
      }
    });

    // Facebook Shares Count
    $.ajax({
      url: "https://api.facebook.com/restserver.php?method=links.getStats&format=json&urls=" + url,
      type: "GET",
      dataType: "jsonp",
      success: function(data) {
        if (data[0].total_count > 0) {
          $(".facebook_count").text(data[0].total_count); 
          $(".facebook_count").addClass("positive");
        }
      }
    });

  }
}