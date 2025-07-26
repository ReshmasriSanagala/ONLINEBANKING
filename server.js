const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/send-statement-email', async (req, res) => {
  const { email, statements } = req.body;

  if (!email || !Array.isArray(statements)) {
    return res.status(400).send('Invalid request');
  }

  const htmlContent = `
    <h2>Your Bank Statement</h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead>
        <tr>
          <th>Date</th><th>Description</th><th>Type</th><th>Amount</th><th>Balance</th>
        </tr>
      </thead>
      <tbody>
        ${statements.map(txn => `
          <tr>
            <td>${txn.date}</td>
            <td>${txn.description}</td>
            <td>${txn.type}</td>
            <td>₹${txn.amount}</td>
            <td>₹${txn.balance}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'spammingrn10@gmail.com',
      pass: 'ufxh bmhg sndx dcqj'
    }
  });

  const mailOptions = {
    from: 'spammingrn10@gmail.com',
    to: email,
    subject: 'Your Bank Statement',
    html: htmlContent
  };

  try {
  await transporter.sendMail(mailOptions);
  res.status(200).json({ message: 'Email sent successfully' }); // <-- This is better for Angular
} catch (error) {
  console.error('Error sending email:', error);
  res.status(500).json({ message: 'Failed to send email' }); // <-- Angular reads this
}
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
