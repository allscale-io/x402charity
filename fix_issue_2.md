```json
{
  "name": "express-basic",
  "version": "1.0.0",
  "description": "A minimal example Express app with x402charity middleware",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "x402charity": "^1.0.0"
  }
}
```

```javascript
// index.js
const express = require('express');
const x402charity = require('x402charity');

const app = express();
const port = 3000;

// Configure x402charity middleware for Base Sepolia testnet
const x402Config = {
  network: 'base-sepolia',
  // Add any other necessary configuration options
};

app.use(x402charity(x402Config));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
```

```markdown
# README.md

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/allscale-io/x402charity.git
   cd x402charity/examples/express-basic
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Access the app:**
   Open your browser and navigate to `http://localhost:3000`.

This example demonstrates a simple Express app with the x402charity middleware integrated to automatically handle donations on API routes using the Base Sepolia testnet.
```

### Explanation of Changes
- **`package.json`:** Added a new `package.json` file with dependencies for Express and x402charity.
- **`index.js`:** Created a simple Express server and integrated the x402charity middleware, configured for the Base Sepolia testnet.
- **`README.md`:** Provided setup instructions to run the example app.

This implementation ensures that the example app works out of the box with `npm install && npm start` and demonstrates the x402charity middleware in action.