river.model.Vote = {

  upvoteComment: function(voterEl) {
    river.model.Vote.vote("comments", voterEl, 1);
  },

  downvoteComment: function(voterEl) {
    river.model.Vote.vote("comments", voterEl, -1);
  },

  upvoteRepository: function(voterEl) {
    river.model.Vote.vote("repositories", voterEl, 1);
  },

  upvoteSubtitle: function(voterEl) {
    river.model.Vote.vote("subtitles", voterEl, 1);
  },

  downvoteRepository: function(voterEl) {
    river.model.Vote.vote("repositories", voterEl, -1);
  },

  vote: function(thingType, voterEl, point, reason) {
    // if (!Lobsters.curUser)
    //   return Lobsters.bounceToLogin();

    var li = $(voterEl).closest(".repository, .comment, .subtitle");
    var scoreDiv = li.find("div.score").get(0);
    var score = parseInt(scoreDiv.innerHTML);
    if (isNaN(score)) score = 0;

    var action = "";

    if (li.hasClass("upvoted") && point > 0) {
      /* already upvoted, neutralize */
      li.removeClass("upvoted");
      score--;
      action = "unvote";
    }
    else if (li.hasClass("downvoted") && point < 0) {
      /* already downvoted, neutralize */
      li.removeClass("downvoted");
      score++;
      action = "unvote";
    }
    else if (point > 0) {
      if (li.hasClass("downvoted"))
        /* flip flop */
        score++;

      li.removeClass("downvoted").addClass("upvoted");
      score++;
      action = "upvote";
    }
    else if (point < 0) {
      if (li.hasClass("upvoted"))
        /* flip flop */
        score--;

      li.removeClass("upvoted").addClass("downvoted");
      score--;
      action = "downvote";
    }

    if (action == "upvote" || action == "unvote") {
      li.find(".reason").html("");

      if (action == "unvote" && thingType == "repository" && point < 0)
        li.find(".flagger").text("flag");
    }

    var url = "/" + thingType + "/" + li.data("shortid") + "/" + action;
    
    $.ajax({
      type: "POST",
      url: url,
      data: { reason: reason },
      success: function() {
        scoreDiv.innerHTML = score;
      },
      error: function(data) {
        if (data.status == 401) {
          window.location.href = data.responseText;
        }
      },
      dataType: "text"
    });

  },

}