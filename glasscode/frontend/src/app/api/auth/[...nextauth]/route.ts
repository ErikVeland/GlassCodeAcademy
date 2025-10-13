import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

// Helper to read optional env vars safely
const env = (name: string) => process.env[name];

// Optional dev/demo credentials stored securely in env as JSON:
// DEMO_USERS_JSON='[{"email":"user@example.com","name":"Demo User","passwordHash":"$2a$10$..."}]'
type DemoUser = { email: string; name: string; passwordHash: string };
const demoUsers: DemoUser[] = (() => {
  try {
    const raw = env('DEMO_USERS_JSON');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(u => u.email && u.passwordHash);
    return [];
  } catch {
    return [];
  }
})();

const providers = [] as NextAuthOptions['providers'];

// Google OAuth
if (env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET')) {
  providers.push(GoogleProvider({
    clientId: env('GOOGLE_CLIENT_ID')!,
    clientSecret: env('GOOGLE_CLIENT_SECRET')!,
  }));
}

// GitHub OAuth
if (env('GITHUB_ID') && env('GITHUB_SECRET')) {
  providers.push(GitHubProvider({
    clientId: env('GITHUB_ID')!,
    clientSecret: env('GITHUB_SECRET')!,
  }));
}

// Apple OAuth (requires proper credentials)
if (env('APPLE_CLIENT_ID') && env('APPLE_CLIENT_SECRET')) {
  providers.push(AppleProvider({
    clientId: env('APPLE_CLIENT_ID')!,
    clientSecret: env('APPLE_CLIENT_SECRET')!,
  }));
}

// Email/Password via Credentials (secure dev/demo only)
providers.push(CredentialsProvider({
  name: 'Email and Password',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      return null;
    }

    // Look up user from secure env-configured demo list
    const user = demoUsers.find(u => u.email.toLowerCase() === String(credentials.email).toLowerCase());
    if (!user) {
      return null;
    }

    const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
    if (!ok) return null;

    const authUser: User = { id: user.email, email: user.email, name: user.name };
    return authUser;
  },
}));

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  cookies: {
    // Rely on secure defaults; ensure `NEXTAUTH_URL` is set in env in production
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Attach basic provider info
      if (account?.provider) token.provider = account.provider;
      if (profile?.email && !token.email) token.email = profile.email as string;
      return token;
    },
    async session({ session, token }) {
      // Expose minimal fields to the client
      const t = token as JWT & { provider?: string };
      if (typeof t.email === 'string') {
        session.user = { ...(session.user || {}), email: t.email };
      }
      // If you need provider client-side, consider NextAuth module augmentation to type it on Session.
      return session;
    },
  },
  // IMPORTANT: set NEXTAUTH_SECRET and NEXTAUTH_URL in production
  secret: env('NEXTAUTH_SECRET'),
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };