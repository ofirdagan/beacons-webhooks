import axios from 'axios';

export const log = (message) => {
  axios.get(`https://firebase-hooks.azurewebsites.net/api/remote-log?message=${message}`);
};