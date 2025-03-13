import config from "../config";

export const auth0Config = {
    domain: config.auth0_domain,
    clientId: config.auth0_clientId,
    redirectUri: window.location.origin,
    //audience: "YOUR_API_IDENTIFIER", // Optional: Only needed if you have a backend API
    scope: "openid profile email"
  };