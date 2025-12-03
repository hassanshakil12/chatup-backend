import NodeGeocoder from "node-geocoder";

const options = {
  provider: "openstreetmap",
  formatter: null,
};

const geocoder = NodeGeocoder(options);

export default geocoder;
