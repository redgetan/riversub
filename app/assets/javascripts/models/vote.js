river.model.Vote = {

  upvoteComment: function(voterEl) {
    river.model.Vote.vote("comment", voterEl, 1);
  },

  downvoteComment: function(voterEl) {
    river.model.Vote.vote("comment", voterEl, -1);
  },

  vote: function(thingType, voterEl, point, reason) {
    // if (!Lobsters.curUser)
    //   return Lobsters.bounceToLogin();

    var li = $(voterEl).closest(".comment");
    var scoreDiv = li.find("div.score").get(0);
    var score = parseInt(scoreDiv.innerHTML);
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

    scoreDiv.innerHTML = score;

    if (action == "upvote" || action == "unvote") {
      li.find(".reason").html("");

      if (action == "unvote" && thingType == "story" && point < 0)
        li.find(".flagger").text("flag");
    }
    else if (action == "downvote" && thingType == "story")
      li.find(".flagger").text("unflag");

    $.post("/" + (thingType == "story" ? "stories" : thingType + "s") + "/" +
      li.attr("data-shortid") + "/" +
      action, { reason: reason });
  },

}