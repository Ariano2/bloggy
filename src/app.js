const express = require('express');
const app = express();
const port = 9000;
app.use('/', (req, res) => {
  res.send('Hello World');
});

app.listen(port, () => {
  console.log('App Running successfully on port ' + port);
});
