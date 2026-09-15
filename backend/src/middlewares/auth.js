import * as collaboratorsRepository from "../repositories/collaborators.repository.js";
import * as usersRepository from "../repositories/users.repository.js";
import { verifyAccessToken } from "../services/token.service.js";
import { ApiError } from "../utils/errors.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Token de acesso nao informado.");
    }

    const payload = verifyAccessToken(token);
    const user = await usersRepository.findActiveUserById(Number(payload.sub));

    if (!user) {
      throw new ApiError(401, "Token de acesso invalido.");
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(
      error.statusCode ? error : new ApiError(401, "Token de acesso invalido."),
    );
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.user_level !== "ADMIN") {
    return next(new ApiError(403, "Acesso restrito a administradores."));
  }

  return next();
}

export async function requireRoomOperator(req, _res, next) {
  try {
    if (req.user?.user_level === "ADMIN") {
      return next();
    }

    const roomId = Number(req.params.roomId || req.body.room_id);
    if (!roomId) {
      throw new ApiError(400, "Sala nao informada para checagem de permissao.");
    }

    const collaborator = await collaboratorsRepository.findRoomCollaborator(
      roomId,
      req.user.id,
    );

    if (!collaborator) {
      throw new ApiError(403, "Voce nao tem permissao para operar esta sala.");
    }

    return next();
  } catch (error) {
    return next(error);
  }
}
