// TEMP in-memory requests
let requests = [];

exports.createRequest = (req, res) => {
  const { blood_type, units_required, urgency_level } = req.body;

  const newRequest = {
    id: requests.length + 1,
    hospital_id: req.user.id,
    blood_type,
    units_required,
    urgency_level,
    status: "PENDING",
  };

  requests.push(newRequest);

  res.json({ message: "Blood request created" });
};

exports.getMyRequests = (req, res) => {
  const hospitalId = req.user.id;

  const myRequests = requests.filter(
    (r) => r.hospital_id === hospitalId
  );

  res.json(myRequests);
};