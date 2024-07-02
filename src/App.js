import { useEffect, useState, useRef } from 'react';
import StarRating from './StarRating';
import { useMovies, API_KEY } from './useMovies';
import { useLocalStorage } from './useLocalStorage';
import { useKey } from './useKey';

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [watched, setWatched] = useLocalStorage([], 'watched');

  const { movies, isLoading, error } = useMovies(query);

  function handleSelectedId(id) {
    setSelectedId((prevId) => (id === prevId ? null : id));
  }
  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((prev) => [...prev, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched(watched.filter((movie) => movie.imdbID !== id));
  }

  return (
    <>
      <Navigation>
        <Search query={query} onChangeQuery={setQuery} />
        <NumResults movies={movies} />
      </Navigation>
      <Main>
        <ContentBox>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MoviesList movies={movies} handleSelectedId={handleSelectedId} />
          )}
          {error && <ErrorMessage message={error} />}
        </ContentBox>

        <ContentBox>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              watchedMovies={watched}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </ContentBox>
      </Main>
    </>
  );
}

function MovieDetails({
  selectedId,
  onCloseMovie,
  watchedMovies,
  onAddWatched,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);

  const counterRef = useRef(0);

  const isWatched = watchedMovies.some((movie) => movie.imdbID === selectedId);

  function addWatched() {
    const watchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      userRating: Number(userRating),
      runtime: Number(runtime.split(' ').at(0)),
      counterRatingDecision: counterRef.current,
    };

    if (isWatched) {
      const movie = watchedMovies.find((movie) => movie.imdbID === selectedId);
      movie.userRating = userRating;
      onCloseMovie();
      return;
    }

    onAddWatched(watchedMovie);
    onCloseMovie();
  }

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  useEffect(() => {
    if (userRating) counterRef.current++;
  }, [userRating]);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!selectedId) return;
        setIsLoading(true);

        const res = await fetch(
          `http://www.omdbapi.com/?apikey=${API_KEY}&i=${selectedId}`
        );
        const data = await res.json();

        setMovie(data);
        setIsLoading(false);
      } catch (err) {
        console.log(`Error: ${err}`);
      }
    }
    fetchData();
  }, [selectedId]);

  // Changing page title after getting movie details

  useEffect(() => {
    if (!title) return;
    document.title = `MOVIE | ${title}`;

    return () => (document.title = 'usePopcorn');
  }, [title]);

  useKey('escape', onCloseMovie);

  return (
    <div className="details">
      {isLoading && <Loader />}
      {!isLoading && (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie}`} />
            <div className="details-overview">
              <h3>{title}</h3>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>⭐ {imdbRating}</p>
            </div>
          </header>

          <section>
            <div className="rating">
              <StarRating
                maxRating={10}
                size={'24px'}
                defaultRating={
                  !isWatched
                    ? 1
                    : watchedMovies.find((movie) => movie.imdbID === selectedId)
                        .userRating
                }
                onSetRating={setUserRating}
              />
              {isWatched && <p>You have already rated this movie.</p>}
              {userRating && (
                <button className="btn-add" onClick={addWatched}>
                  {isWatched ? 'Change my rating' : '+ Add to list'}
                </button>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return <p className="error">{message}</p>;
}

function Navigation({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      {movies?.length && (
        <span>
          Found <strong>{movies.length}</strong> results
        </span>
      )}
    </p>
  );
}

function Search({ query, onChangeQuery }) {
  const inputEl = useRef(null);

  useEffect(() => {
    inputEl.current.focus();
  }, []);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => onChangeQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function ContentBox({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <Button onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? '–' : '+'}
      </Button>
      {isOpen && children}
    </div>
  );
}

function MoviesList({ movies, handleSelectedId }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          handleSelectedId={handleSelectedId}
        />
      ))}
    </ul>
  );
}
function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, handleSelectedId }) {
  return (
    <li onClick={() => handleSelectedId(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}

function WatchedSummary({ watched }) {
  const average = (arr) =>
    arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{Math.round(avgImdbRating * 100) / 100}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function Button({ children, onClick }) {
  return (
    <button className="btn-toggle" onClick={onClick}>
      {children}
    </button>
  );
}
