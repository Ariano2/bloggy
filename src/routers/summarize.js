const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

router.post('/summarize', (req, res) => {
  const blogText = req.body.text;
  const python = spawn('python', ['summarizer.py']);

  let output = '';
  let errorOutput = '';

  python.stdin.write(blogText);
  python.stdin.end();

  python.stdout.on('data', (data) => {
    output += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  python.on('close', (code) => {
    if (code !== 0 || errorOutput) {
      console.error('Python Error:', errorOutput);
      return res
        .status(500)
        .json({ error: 'Summarization failed', details: errorOutput });
    }

    // 🧼 Final cleanup of summary to remove unwanted path info
    const cleanSummary = output
      .replace(
        /(?:[A-Z]:)?\\(?:Users|AppData|[^\\]+\\)*site-packages\r?\n?/gi,
        ''
      ) // Remove paths
      .replace(/\r?\n|\r/g, ' ') // Remove newlines
      .replace(/\s\s+/g, ' ') // Collapse multiple spaces
      .trim();

    res.json({ summary: cleanSummary });
  });
});

module.exports = router;
