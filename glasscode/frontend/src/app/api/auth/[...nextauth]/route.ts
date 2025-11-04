import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import AppleProvider from 'next-auth/providers/apple';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuthProviders } from '@/lib/authProviders';
import { getApiBaseStrict } from '@/lib/urlUtils';

export const runtime = 'nodejs';

// Helper to read optional env vars safely
const env = (name: string) => process.env[name];

// Extended user type with backend token and role
interface ExtendedUser extends User {
  backendToken?: string;
  role?: string;
}

// Extended token type
interface ExtendedToken {
  id?: string;
  email?: string;
  name?: string;
  provider?: string;
  backendToken?: string;
  role?: string;
}

// Extended session type
interface ExtendedSession {
  backendToken?: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

const authProviders = getAuthProviders();

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

// Email/Password via Credentials (database-backed for production)
if (authProviders.some(p => p.id === 'credentials')) {
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

      try {
        // Call our backend API to authenticate the user
        const response = await fetch(`${getApiBaseStrict()}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        
        if (!data?.data?.token || !data?.data?.user) {
          return null;
        }

        const backendToken: string = data.data.token as string;
        // Try to fetch user profile to capture role info
        let role: string | undefined;
        try {
          const meRes = await fetch(`${getApiBaseStrict()}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${backendToken}`,
            },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const userResp = meData?.data ?? meData?.user ?? meData;
            role = (userResp?.role as string | undefined) ?? undefined;
          }
        } catch {
          // Ignore failures; server-side will still use token for authorization
        }

        // Return user object that NextAuth expects
        const user: ExtendedUser = {
          id: data.data.user.id.toString(),
          email: data.data.user.email,
          name: `${data.data.user.firstName} ${data.data.user.lastName}`,
          backendToken: backendToken,
        };
        if (role) {
          user.role = role;
        }
        
        // We'll store the token in the JWT callback
        return user;
      } catch (error) {
        console.error('Authentication error:', error);
        return null;
      }
    },
  }));
}

const getAuthOptions = (): NextAuthOptions => ({
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    newUser: '/register', // Redirect new users to register page
  },
  cookies: {
    // Rely on secure defaults; ensure `NEXTAUTH_URL` is set in env in production
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For OAuth providers, we would get user info from the provider
        if (account.type === 'oauth') {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.provider = account.provider;
        } 
        // For credentials, we need to authenticate with our backend
        else if (account.type === 'credentials') {
          // The authorize function already authenticated the user
          // We just need to pass through the user data
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.provider = 'credentials';
          const extendedUser = user as ExtendedUser;
          if (extendedUser?.backendToken) {
            (token as ExtendedToken).backendToken = extendedUser.backendToken;
          }
          if (extendedUser?.role) {
            (token as ExtendedToken).role = extendedUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose user data to the client
      if (token?.email) {
        const extendedToken = token as ExtendedToken;
        const extendedSession = session as ExtendedSession;
        
        extendedSession.user = {
          email: token.email,
          name: typeof token.name === 'string' ? token.name : '',
        };
        
        if (typeof extendedToken.role === 'string') {
          extendedSession.user.role = extendedToken.role;
        }
      }
      
      const extendedToken = token as ExtendedToken;
      const extendedSession = session as ExtendedSession;
      if (extendedToken?.backendToken) {
        extendedSession.backendToken = extendedToken.backendToken;
      }
      
      return session;
    },
  },
  // IMPORTANT: set NEXTAUTH_SECRET and NEXTAUTH_URL in production
  secret: env('NEXTAUTH_SECRET'),
});

const handler = NextAuth(getAuthOptions());

// Export a function to get auth options for use in other API routes
export { getAuthOptions };

export { handler as GET, handler as POST };