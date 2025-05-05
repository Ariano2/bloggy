const validateComment = (comment) => {
  if (comment === '')
    throw new Error('empty comments not allowed. No Spamming!');
  if (comment.length > 150)
    throw new Error('comments cannot exceed 150 characters');
  return true;
};
module.exports = validateComment;
