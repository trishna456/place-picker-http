import { useRef, useState, useCallback, useEffect } from "react";
import { updateUserPlaces, fetchUserPlaces } from "./http.js";
import Places from "./components/Places.jsx";
import Modal from "./components/Modal.jsx";
import DeleteConfirmation from "./components/DeleteConfirmation.jsx";
import logoImg from "./assets/logo.png";
import AvailablePlaces from "./components/AvailablePlaces.jsx";
import Error from "./components/Error.jsx";

function App() {
  const selectedPlace = useRef();

  const [userPlaces, setUserPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingError, setFetchingError] = useState();
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [errorUpdatingPlaces, setErrorUpdatingPlaces] = useState();

  useEffect(() => {
    async function fetchUserPlace() {
      try {
        setIsLoading(true);
        const response = await fetchUserPlaces();
        setUserPlaces(response);
        setIsLoading(false);
      } catch (error) {
        setFetchingError({
          message:
            error.message ||
            "Could not fetch user places. Please try again later.",
        });
        setIsLoading(false);
      }
    }

    fetchUserPlace();
  }, []);

  if (fetchingError) {
    return (
      <Error title={"An error occurred!"} message={fetchingError.message} />
    );
  }

  function handleStartRemovePlace(place) {
    setModalIsOpen(true);
    selectedPlace.current = place;
  }

  function handleStopRemovePlace() {
    setModalIsOpen(false);
  }

  async function handleSelectPlace(selectedPlace) {
    //optimistic updating
    //we are first updating the local state and then sending the updates using the http put req
    setUserPlaces((prevPickedPlaces) => {
      if (!prevPickedPlaces) {
        prevPickedPlaces = [];
      }
      if (prevPickedPlaces.some((place) => place.id === selectedPlace.id)) {
        return prevPickedPlaces;
      }
      return [selectedPlace, ...prevPickedPlaces];
    });

    try {
      await updateUserPlaces([selectedPlace, ...userPlaces]); //cannot directly pass the updated state immediately in this next line since state update has been scheduled for now
    } catch (error) {
      setUserPlaces(userPlaces); //if something goes wrong, we rollback to the previous state
      setErrorUpdatingPlaces({ message: error || "Failed to update places." });
    }
  }

  const handleRemovePlace = useCallback(
    async function handleRemovePlace() {
      setUserPlaces((prevPickedPlaces) =>
        prevPickedPlaces.filter(
          (place) => place.id !== selectedPlace.current.id
        )
      );

      try {
        await updateUserPlaces(
          userPlaces.filter((place) => place.id !== selectedPlace.current.id)
        );
      } catch (error) {
        setUserPlaces(userPlaces);
        setErrorUpdatingPlaces({
          message: error.message || "Failed to delete place.",
        });
      }

      setModalIsOpen(false);
    },
    [userPlaces]
  );

  function handleError() {
    setErrorUpdatingPlaces(null);
  }

  return (
    <>
      <Modal open={errorUpdatingPlaces} onClose={handleError}>
        {errorUpdatingPlaces && (
          <Error
            title="An error occurred!"
            message={errorUpdatingPlaces.message}
            onConfirm={handleError}
          />
        )}
      </Modal>
      <Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        <Places
          title="I'd like to visit ..."
          fallbackText="Select the places you would like to visit below."
          isLoading={isLoading}
          places={userPlaces}
          loadingText="Loading user places.."
          onSelectPlace={handleStartRemovePlace}
        />

        <AvailablePlaces onSelectPlace={handleSelectPlace} />
      </main>
    </>
  );
}

export default App;
