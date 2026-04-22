// Clerk shim - provides no-op replacements when Clerk is disabled
// All components render as if always authenticated as admin

export const ClerkProvider = ({ children }) => children;

export function SignedIn({ children }) { return children; }
export function SignedOut({ children }) { return null; }

export function SignInButton({ children, redirectUrl }) { return children; }
export function SignUpButton({ children, redirectUrl }) { return children; }

export function UserButton({ appearance }) {
  return <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#333' }} />;
}

export function useUser() {
  return {
    user: { id: 'admin', username: 'admin', emailAddress: 'admin@localhost' },
    isLoaded: true,
    isSignedIn: true,
  };
}

export function useAuth() {
  return { isSignedIn: true, userId: 'admin' };
}

export function auth() {
  return { userId: 'admin' };
}

export function useSession() {
  return { session: { user: { id: 'admin' } }, isLoaded: true, isSignedIn: true };
}

// Server-side clerkClient (no-op for when Clerk is disabled)
export const clerkClient = null;
