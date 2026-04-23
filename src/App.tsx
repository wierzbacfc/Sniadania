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
             background: '#334155',
             color: '#fff',
             fontSize: '14px',
             fontWeight: '600',
             borderRadius: '16px',
             padding: '12px 20px',
             boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
             marginBottom: '80px',
          },
        }}
      />
    </AppProvider>
  );
}
