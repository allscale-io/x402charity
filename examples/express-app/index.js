import express from 'express';
import { x402charity } from 'x402charity/express';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to trigger a $0.001 donation on every POST request to /api/*
app.use('/api', x402charity({
    privateKey: process.env.DONATION_PRIVATE_KEY,
    donateEndpoint: process.env.DONATE_ENDPOINT || 'http://localhost:3402/donate',
    amount: '$0.001',
    shouldDonate: (req) => req.method === 'POST',
}));

app.get('/', (req, res) => {
    res.send('x402 Charity Express Example. Try POSTing to /api/action to trigger a donation!');
});

app.post('/api/action', (req, res) => {
    res.json({ message: 'Action processed! A micro-donation has been triggered.' });
});

app.listen(port, () => {
    console.log(`Express example app listening at http://localhost:${port}`);
});
