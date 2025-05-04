const validateBlog = (blogData, editMode) => {
  const { title, banner, des, content, tags } = blogData;
  if (!editMode && (!title || title.length > 200)) {
    throw new Error('title is Invalid');
  }
  if (banner && banner.length > 2000) {
    throw new Error('banner cannot exceed 2000 characters');
  }
  if (des && des.length > 200) {
    throw new Error('description cannot exceed 200 characters');
  }
  if (!editMode && content.length > 20) {
    throw new Error('Content is too long');
  }
  if (!editMode) {
    for (p of content) {
      if (p.length > 2000) {
        throw new Error('Content is too long');
      }
    }
  }
  if (tags && tags.length > 10) {
    throw new Error('Maximum 10 tags are allowed');
  }
  return true;
};
module.exports = validateBlog;
