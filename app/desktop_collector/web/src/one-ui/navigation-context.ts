import { createContext, useContext } from "react";

// Internal shell state also reaches floating content rendered through portals.
export const NavigationOverlayContext = createContext(false);
export const useNavigationOverlay = () => useContext(NavigationOverlayContext);
