import { Store, registerInDevtools } from "pullstate";

export const LocationStore = new Store({
    lat: 10.1735,
    lng: 123.5407,
});

registerInDevtools({ LocationStore });
