import { Grid2 } from "@mui/material";
import React from "react";
import { useGo2RtcStreamsQuery } from "../api/go2rtc";

const CameraStream = (props: { iframeStyle?: React.CSSProperties; setVisible?: (value: boolean) => void }): React.ReactElement => {
    const { data: streams } = useGo2RtcStreamsQuery();
    const firstStreamKey = React.useMemo(() => Object.keys(streams ?? {}).at(0), [streams]);

    React.useEffect(() => {
        if (props.setVisible) {
            props.setVisible(!!firstStreamKey);
        }
    });

    const StreamIFrame: React.FunctionComponent = (): React.ReactElement => {
        return (
            <Grid2 display="flex">
                <iframe
                    style={{flexGrow: 1, border: 0, ...props.iframeStyle}}
                    src={`/streamer/stream.html?src=${firstStreamKey}`}
                />
            </Grid2>
        );
    };

    if (!firstStreamKey) {
        return <></>;
    }

    return (
        <StreamIFrame />
    );
};

export default CameraStream;
