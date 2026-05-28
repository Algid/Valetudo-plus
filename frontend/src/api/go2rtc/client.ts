import axios from "axios";
import { Go2RtcStreams } from "./types";

export const go2RtcAPIBaseURL = "./streamer/api/";
export const go2RtcAPI = axios.create({
    baseURL: go2RtcAPIBaseURL,
    timeout: 5000,
});

export const fetchStreams = (): Promise<Go2RtcStreams> => {
    return go2RtcAPI.get<Go2RtcStreams>("/streams").then(({data}) => {
        return data;
    });
};
