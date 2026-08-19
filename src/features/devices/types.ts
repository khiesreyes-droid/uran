export type Device = {
  id: string;        // ESP32 MAC address without colons e.g. "A4CF12345678"
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
};
