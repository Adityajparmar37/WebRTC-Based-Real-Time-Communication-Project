import React, { createContext } from "react";
import { useContext } from "react";
import { useMemo } from "react";
import io from "socket.io-client";

// context create
const SocketContext = createContext(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
};

console.log(import.meta.env.VITE_API_BASE_URL);

// Provider function to provide socketContext value to children
export const SocketProvider = ({ children }) => {
  const socket = useMemo(() => io(import.meta.env.VITE_API_BASE_URL), []);
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
