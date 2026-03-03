// TEMP in-memory donations
let donations = [];

exports.getMyDonations = (req, res) => {
  const userId = req.user.id;

  const myDonations = donations.filter(
    (d) => d.donor_id === userId
  );

  res.json(myDonations);
};