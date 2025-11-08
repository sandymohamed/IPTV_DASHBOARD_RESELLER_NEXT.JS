// This layout ensures login page doesn't require authentication
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
