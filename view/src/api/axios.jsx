import axios from 'axios';

export default axios.create(
    // TODO: Resolve IP of the raspberry from the client
    {baseURL: "http://192.168.0.19:5000"}
)