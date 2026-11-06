import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeProvider';
import { LanguageProvider } from './context/LanguageProvider';
import AppRouter from './routes/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // news lists are fresh for a minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AppRouter />
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
