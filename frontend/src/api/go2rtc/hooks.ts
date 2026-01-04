import { useQuery } from "@tanstack/react-query";
import { fetchStreams } from "./client";

// Always prepend with go2rtc to avoid conflicts with Valetudo queries
enum QueryKey {
    Streams = "go2rtc_streams"
}

export const useGo2RtcStreamsQuery = () => {
    return useQuery({
        queryKey: [QueryKey.Streams],
        queryFn: fetchStreams,

        staleTime: Infinity
    });
};
