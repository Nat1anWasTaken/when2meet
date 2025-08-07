import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "mongodb" }),
    emailAndPassword: {
        enabled: true
    }
});
