import {Box, Grid2, Paper} from "@mui/material";
import {
    AppRegistration as OperationModeIcon,
} from "@mui/icons-material";
import {Capability, useRobotInformationQuery} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import BasicControls from "./BasicControls";
import PresetSelectionControl from "./PresetSelection";
import RobotStatus from "./RobotStatus";
import Dock from "./Dock";
import CurrentStatistics from "./CurrentStatistics";
import Attachments from "./Attachments";
import {FanSpeedMediumIcon, WaterGradeLowIcon} from "../components/CustomIcons";
import React from "react";
import CameraStream from "./CameraStream";
import MultipleMap from "./MultipleMap";


const ControlsBody = (): React.ReactElement => {
    const [
        basicControls,
        multipleMapSupported,
        fanSpeed,
        waterControl,
        operationMode,
        triggerEmptySupported,
        mopDockCleanTriggerSupported,
        mopDockDryTriggerSupported,
        currentStatistics,
    ] = useCapabilitiesSupported(
        Capability.BasicControl,
        Capability.MultipleMap,
        Capability.FanSpeedControl,
        Capability.WaterUsageControl,
        Capability.OperationModeControl,
        Capability.AutoEmptyDockManualTrigger,
        Capability.MopDockCleanManualTrigger,
        Capability.MopDockDryManualTrigger,
        Capability.CurrentStatistics
    );

    const {
        data: robotInformation,
    } = useRobotInformationQuery();

    const [cameraVisible, setCameraVisible] = React.useState(false);

    return (
        <Grid2 container spacing={1.5} direction="column" sx={{userSelect: "none"}}>
            <Paper style={{display: !cameraVisible ? "none" : undefined}}>
                <Box px={1.5} py={1.5}>
                    <CameraStream iframeStyle={{minHeight: "25vh"}} setVisible={setCameraVisible} />
                </Box>
            </Paper>

            <RobotStatus />

            {basicControls && <BasicControls />}

            {operationMode && (
                <PresetSelectionControl
                    capability={Capability.OperationModeControl}
                    label="Mode"
                    icon={
                        <OperationModeIcon
                            fontSize="small"
                        />
                    }
                />
            )}

            {fanSpeed && (
                <PresetSelectionControl
                    capability={Capability.FanSpeedControl}
                    label="Fan"
                    icon={
                        <FanSpeedMediumIcon
                            fontSize="small"
                        />
                    }
                />
            )}
            {waterControl && (
                <PresetSelectionControl
                    capability={Capability.WaterUsageControl}
                    label="Water"
                    icon={<WaterGradeLowIcon fontSize="small" />}
                />
            )}

            {multipleMapSupported && <MultipleMap />}

            {
                (triggerEmptySupported || mopDockCleanTriggerSupported || mopDockDryTriggerSupported) &&

                <Dock/>
            }

            {
                robotInformation &&
                robotInformation.modelDetails.supportedAttachments.length > 0 &&

                <Attachments/>
            }

            {currentStatistics && <CurrentStatistics/>}
        </Grid2>
    );
};

export default ControlsBody;
