$.extend(river.controller,{
  "requests#index": function() {
    $(".request_category_select").on("change", function() {
      document.location.href = $(this).val();
    });
  }
});