import { useEffect, useState } from "react";

export function useFetch(fetchFn, initialValue) {
  const [isLoading, setIsLoading] = useState();
  const [fetchingError, setFetchingError] = useState();
  const [fetchedData, setFetchedData] = useState(initialValue);

  useEffect(() => {
    async function fetchUserPlace() {
      try {
        setIsLoading(true);
        const response = await fetchFn();
        setFetchedData(response);
        setIsLoading(false);
      } catch (error) {
        setFetchingError({
          message:
            error.message || "Failed to fetch data. Please try again later.",
        });
        setIsLoading(false);
      }
    }

    fetchUserPlace();
  }, [fetchFn]);

  return {
    isLoading,
    fetchedData,
    setFetchedData,
    fetchingError,
  };
}
