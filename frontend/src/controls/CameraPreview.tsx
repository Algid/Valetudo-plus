import {Box, Paper} from "@mui/material";
import React from "react";
import {useDuststreamingConfigurationQuery, useDuststreamingPropertiesQuery} from "../api";
import {DuststreamCanvas} from "../robot/Duststream";

const CameraPreview = (): React.ReactElement | null => {
    const {data: properties} = useDuststreamingPropertiesQuery();
    const {data: configuration} = useDuststreamingConfigurationQuery();

    const [isFullscreen, setIsFullscreen] = React.useState(false);

    React.useEffect(() => {
        if (!isFullscreen) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };

        window.addEventListener("keydown", handler);
        return () => {
            window.removeEventListener("keydown", handler);
        };
    }, [isFullscreen]);

    if (!properties || configuration?.enabled !== true || !properties.duststreamerInstalled) {
        return null;
    }

    return (
        <Paper>
            <Box px={1.5} py={1.5}>
                <Box
                    onClick={() => {
                        setIsFullscreen((prev) => !prev);
                    }}
                    sx={{
                        position: isFullscreen ? "fixed" : "relative",
                        inset: isFullscreen ? 0 : undefined,
                        zIndex: isFullscreen ? 1300 : undefined,
                        width: "100%",
                        minHeight: "25vh",
                        bgcolor: "#000",
                        cursor: "pointer",
                    }}
                >
                    <DuststreamCanvas dimensions={properties}/>
                </Box>
            </Box>
        </Paper>
    );
};

export default CameraPreview;
