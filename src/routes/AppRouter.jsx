import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import ArticleDetailPage from '../pages/ArticleDetailPage';
import CategoryPage from '../pages/CategoryPage';
import SearchPage from '../pages/SearchPage';
import SourcePage from '../pages/SourcePage';
import BookmarksPage from '../pages/BookmarksPage';
import NotFoundPage from '../pages/NotFoundPage';
import RouteError from '../components/errors/RouteError';

// React Router reuses the same component instance when only a URL param
// changes (/category/world → /category/sports), so local state such as the
// selected source filter would leak between pages. Keying on the param gives
// each category/source a fresh component with fresh state.
function CategoryRoute() {
  const { slug } = useParams();
  return <CategoryPage key={slug} />;
}

function SourceRoute() {
  const { id } = useParams();
  return <SourcePage key={id} />;
}

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteError fullPage />, // layout itself crashed
    children: [
      {
        errorElement: <RouteError />, // a page crashed — keep navbar/footer
        children: [
          { path: '/',               element: <HomePage /> },
          { path: '/article/:id',    element: <ArticleDetailPage /> },
          { path: '/category/:slug', element: <CategoryRoute /> },
          { path: '/search',         element: <SearchPage /> },
          { path: '/source/:id',     element: <SourceRoute /> },
          { path: '/saved',          element: <BookmarksPage /> },
          { path: '*',               element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
