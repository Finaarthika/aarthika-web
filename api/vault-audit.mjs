export default (req, res) => {
  if (req.query.secret !== 'shriyanshu') {
    return res.status(401).send('Unauthorized');
  }
  res.status(200).json({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.PASSBOOK_PRIVATE_KEY_BASE64
  });
};
