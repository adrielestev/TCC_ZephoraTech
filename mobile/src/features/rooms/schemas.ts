import { z } from 'zod';

export const roomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter ao menos 2 letras')
    .max(80, 'Máximo de 80 caracteres'),
  description: z.string().max(500, 'Máximo de 500 caracteres'),
});

export type RoomForm = z.infer<typeof roomSchema>;
