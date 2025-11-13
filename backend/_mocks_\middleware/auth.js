module.exports = (req, res, next) => {
  req.user = { id: 1, role: "admin" }; // fake logged in user
  next();
};
