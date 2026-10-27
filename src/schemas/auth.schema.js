import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(4, "Kullanıcı adı en az 4 karakter olmalıdır."),

  password: z.string().min(4, "Şifre alanı zorunludur."),
});
