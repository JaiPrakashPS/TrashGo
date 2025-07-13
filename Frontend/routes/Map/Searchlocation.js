import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_MAPS_APIKEY } from '../config';

const Searchlocation = ({ setDestination }) => {
  return (
    <GooglePlacesAutocomplete
      placeholder="Search for a location"
      onPress={(data, details = null) => {
        const lat = details.geometry.location.lat;
        const lng = details.geometry.location.lng;
        setDestination({ latitude: lat, longitude: lng });
      }}
      query={{
        key: GOOGLE_MAPS_APIKEY,
        language: 'en',
      }}
      fetchDetails={true}
      styles={{ container: { flex: 0, zIndex: 1, position: "absolute", width: "100%" } }}
    />
  );
};

export default Searchlocation;