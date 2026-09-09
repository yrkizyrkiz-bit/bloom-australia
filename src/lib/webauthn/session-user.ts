import type { User } from "@prisma/client";

export function authUserFromRecord(user: Pick<
  User,
  "id" | "email" | "firstName" | "lastName" | "role" | "gender" | "image" | "dateOfBirth"
>) {
  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    gender: user.gender,
    image: user.image,
    dateOfBirth: user.dateOfBirth?.toISOString() || null,
  };
}
