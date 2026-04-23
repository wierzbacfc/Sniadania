import { AppProvider } from './store';
import MainLayout from './components/MainLayout';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
             background: 'var(--color-dark-surface)',
             color: 'var(--color-text-primary)',
             border: '1px solid var(--color-dark-border)',
             fontSize: '13px',
             fontWeight: '400',
             borderRadius: '12px',
             padding: '12px 20px',
             boxShadow: 'var(--shadow-elegant)',
             marginBottom: '80px',
          },
        }}
      />
    </AppProvider>
  );
}
