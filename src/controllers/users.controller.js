import * as usersService from "../services/users.service.js";

export async function updateMe(req, res) {
  const user = await usersService.updateMe(req.user.id, req.body);
  res.json({ user });
}

export async function listUsers(_req, res) {
  const users = await usersService.listUsers();
  res.json({ users });
}

export async function updateUserLevel(req, res) {
  const user = await usersService.updateUserLevel(req.params.id, req.body.user_level);
  res.json({ user });
}

export async function deleteUser(req, res) {
  await usersService.softDeleteUser(req.params.id);
  res.status(204).send();
}
