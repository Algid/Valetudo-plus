import { Grid2 } from "@mui/material";
import React from "react";
import { useGo2RtcStreamsQuery } from "../api/go2rtc";

const CameraStream = (props: { iframeStyle?: React.CSSProperties; setVisible?: (value: boolean) => void }): React.ReactElement => {
    const { data: streams, isError } = useGo2RtcStreamsQuery();
    const firstStreamKey = React.useMemo(() => !isError ? Object.keys(streams ?? {}).at(0) : undefined, [streams, isError]);

    React.useEffect(() => {
        if (props.setVisible) {
            props.setVisible(!!firstStreamKey);
        }
    });

    if (!firstStreamKey) {
        return <></>;
    }

    return (
        <Grid2 display="flex">
            <iframe
                style={{flexGrow: 1, border: 0, ...props.iframeStyle}}
                src={`/streamer/stream.html?src=${firstStreamKey}`}
            />
        </Grid2>
    );
};

export default CameraStream;
