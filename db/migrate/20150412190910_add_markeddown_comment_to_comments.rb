class AddMarkeddownCommentToComments < ActiveRecord::Migration
  def change
    add_column :comments, :markeddown_comment, :text
  end
end
