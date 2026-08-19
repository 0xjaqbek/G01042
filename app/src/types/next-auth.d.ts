import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    isLeader?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
      isLeader: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    isLeader?: boolean;
  }
}
