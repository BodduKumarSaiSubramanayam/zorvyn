import { Navbar } from './Navbar';

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Navbar />
    <main style={{
      marginLeft: 240,
      flex: 1,
      padding: '40px 48px',
      maxWidth: '100%',
      minHeight: '100vh',
      zIndex: 10,
      position: 'relative',
    }}>
      {children}
    </main>
  </div>
);
