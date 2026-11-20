'use strict';

const AppError = require('../errors');
const { ROLES } = require('../roles');

const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };

module.exports = {
  requireRole,
  requireAdmin: requireRole(ROLES.OWNER, ROLES.ADMIN),
  requireOwner: requireRole(ROLES.OWNER),
};
