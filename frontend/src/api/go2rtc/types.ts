export interface Go2RtcStreams {
    [key: string]: {
        producers: Array<object>;
        consumers: Array<object>;
    };
}
