import { useEffect } from 'react';

export function useKey(key, action) {
  useEffect(() => {
    function callback(e) {
      if (e.key.toLowerCase() === key.toLowerCase()) {
        action();
      }
    }

    document.addEventListener('keydown', callback);

    return function () {
      document.removeEventListener('keydown', callback);
    };
  }, [key, action]);
}
