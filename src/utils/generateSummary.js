const { spawn } = require('child_process');
const Blog = require('../models/blog');

const generateSummaryAndSave = (blogId, content) => {
  const python = spawn('python', ['summarizer.py']);
  let summary = '';
  let errorOutput = '';

  python.stdin.write(content);
  python.stdin.end();

  python.stdout.on('data', (data) => {
    summary += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  python.on('close', async (code) => {
    if (code !== 0 || errorOutput) {
      console.error(`Summarization failed: ${errorOutput}`);
      return;
    }

    const cleanSummary = summary
      .replace(
        /(?:[A-Z]:)?\\(?:Users|AppData|[^\\]+\\)*site-packages\r?\n?/gi,
        ''
      )
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\s\s+/g, ' ')
      .trim();

    try {
      await Blog.findByIdAndUpdate(blogId, { summary: cleanSummary });
      console.log(`AI summary saved for blog ${blogId}`);
    } catch (err) {
      console.error(`Failed to save summary to DB: ${err.message}`);
    }
  });
};

module.exports = generateSummaryAndSave;
