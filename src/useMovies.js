import { useEffect, useState } from 'react';

export const API_KEY = 'c1231679';

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setIsLoading(true);
        setError('');
        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`,
          { signal: controller.signal }
        );
        const data = await res.json();

        if (!res.ok) throw new Error('Something went wrong. Try again.');
        if (data.Response === 'False')
          throw new Error('⛔ No movies were found');

        setMovies(data.Search);
        setError('');
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (query.length < 3) {
      setMovies([]);
      setError('');
      return;
    }
    fetchData();

    return function () {
      controller.abort();
    };
  }, [query]);

  return { movies, isLoading, error };
}
