"use strict";

const { Router } = require("express");
const validate = require("../../shared/middlewares/validate");
const authenticate = require("../../shared/middlewares/authenticate");
const { requireAdmin } = require("../../shared/middlewares/authorize");
const { singleImage } = require("../../shared/middlewares/upload");
const schemas = require("./rooms.schemas");
const controller = require("./rooms.controller");

const router = Router();
router.use(authenticate);

router.get("/", controller.list);
router.post(
  "/",
  requireAdmin,
  validate({ body: schemas.createBody }),
  controller.create,
);
router.get(
  "/:roomId",
  validate({ params: schemas.roomParams }),
  controller.get,
);
router.patch(
  "/:roomId",
  requireAdmin,
  validate({ params: schemas.roomParams, body: schemas.updateBody }),
  controller.update,
);
router.delete(
  "/:roomId",
  requireAdmin,
  validate({ params: schemas.roomParams }),
  controller.remove,
);

router.get(
  "/:roomId/access",
  requireAdmin,
  validate({ params: schemas.roomParams }),
  controller.listAccess,
);
router.put(
  "/:roomId/photos/:slot",
  requireAdmin,
  validate({ params: schemas.photoParams }),
  singleImage("photo"),
  controller.setPhoto,
);
router.delete(
  "/:roomId/photos/:slot",
  requireAdmin,
  validate({ params: schemas.photoParams }),
  controller.removePhoto,
);

module.exports = router;
