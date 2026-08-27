const pendingCustomerRegistrations = new Map();

const savePendingRegistration = (email, data) => {
  pendingCustomerRegistrations.set(email, data);
};

const getPendingRegistration = (email) => {
  return pendingCustomerRegistrations.get(email);
};

const deletePendingRegistration = (email) => {
  pendingCustomerRegistrations.delete(email);
};

module.exports = {
  savePendingRegistration,
  getPendingRegistration,
  deletePendingRegistration,
};