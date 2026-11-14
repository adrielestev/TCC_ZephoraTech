"use strict";

const service = require("./users.service");

module.exports = {
  list: async (req, res) => res.json(service.list(req.valid.query)),
  get: async (req, res) => res.json(service.get(req.valid.params.id)),
  updateMe: async (req, res) =>
    res.json(service.updateProfile(req.user.id, req.valid.body)),
  setMyAvatar: async (req, res) =>
    res.json(await service.setAvatar(req.user.id, req.file)),
  removeMyAvatar: async (req, res) =>
    res.json(await service.removeAvatar(req.user.id)),
  changeRole: async (req, res) =>
    res.json(
      service.changeRole(req.user, req.valid.params.id, req.valid.body.role),
    ),
  changeStatus: async (req, res) =>
    res.json(
      service.changeStatus(
        req.user,
        req.valid.params.id,
        req.valid.body.isActive,
      ),
    ),
  getRooms: async (req, res) =>
    res.json(service.getRoomIds(req.valid.params.id)),
  setRooms: async (req, res) =>
    res.json(
      service.setRoomAccess(
        req.user,
        req.valid.params.id,
        req.valid.body.roomIds,
      ),
    ),
};
