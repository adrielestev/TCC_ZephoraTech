"use strict";

const { Router } = require("express");
const validate = require("../../shared/middlewares/validate");
const authenticate = require("../../shared/middlewares/authenticate");
const {
  requireAdmin,
  requireOwner,
} = require("../../shared/middlewares/authorize");
const { singleImage } = require("../../shared/middlewares/upload");
const schemas = require("./users.schemas");
const controller = require("./users.controller");

const router = Router();
router.use(authenticate);

// Perfil do próprio usuário
router.patch(
  "/me",
  validate({ body: schemas.updateMeBody }),
  controller.updateMe,
);
router.put("/me/avatar", singleImage("avatar"), controller.setMyAvatar);
router.delete("/me/avatar", controller.removeMyAvatar);

// Gestão (admin)
router.get(
  "/",
  requireAdmin,
  validate({ query: schemas.listQuery }),
  controller.list,
);
router.get(
  "/:id",
  requireAdmin,
  validate({ params: schemas.idParams }),
  controller.get,
);
router.patch(
  "/:id/role",
  requireOwner,
  validate({ params: schemas.idParams, body: schemas.roleBody }),
  controller.changeRole,
);
router.patch(
  "/:id/status",
  requireAdmin,
  validate({ params: schemas.idParams, body: schemas.statusBody }),
  controller.changeStatus,
);
router.get(
  "/:id/rooms",
  requireAdmin,
  validate({ params: schemas.idParams }),
  controller.getRooms,
);
router.put(
  "/:id/rooms",
  requireAdmin,
  validate({ params: schemas.idParams, body: schemas.roomsBody }),
  controller.setRooms,
);

module.exports = router;
