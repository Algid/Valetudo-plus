import {Grid2} from "@mui/material";
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
import MultipleMap from "./MultipleMap";
import CameraPreview from "./CameraPreview";


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
        duststreamingSupported,
    ] = useCapabilitiesSupported(
        Capability.BasicControl,
        Capability.MultipleMap,
        Capability.FanSpeedControl,
        Capability.WaterUsageControl,
        Capability.OperationModeControl,
        Capability.AutoEmptyDockManualTrigger,
        Capability.MopDockCleanManualTrigger,
        Capability.MopDockDryManualTrigger,
        Capability.CurrentStatistics,
        Capability.Duststreaming
    );

    const {
        data: robotInformation,
    } = useRobotInformationQuery();


    return (
        <Grid2 container spacing={1.5} direction="column" sx={{userSelect: "none"}}>
            {duststreamingSupported && <CameraPreview />}

            {basicControls && <BasicControls />}

            <RobotStatus />

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
