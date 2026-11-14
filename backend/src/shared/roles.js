"use strict";

const ROLES = Object.freeze({
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
});
const isAdmin = (user) =>
  user.role === ROLES.OWNER || user.role === ROLES.ADMIN;

module.exports = { ROLES, isAdmin };
