import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {
    Capability,
    useMapResetMutation,
    useMultipleMapDeleteMutation,
    useMultipleMapMapsQuery,
    useMultipleMapRenameMutation,
    useMultipleMapRotateMutation,
    useMultipleMapSwitchMutation,
    usePersistentMapMutation,
    usePersistentMapQuery,
    useRobotMapQuery,
    useStartMappingPassMutation,
    useValetudoInformationQuery
} from "../api";
import {
    Save as PersistentMapControlIcon,
    Layers as MappingPassIcon,
    LayersClear as MapResetIcon,
    Dashboard as SegmentEditIcon,
    Crop as CleanupCoverageIcon,
    Download as ValetudoMapDownloadIcon,
    Map,
    Delete,
    SwapVert,
    RotateRight,
} from "@mui/icons-material";
import React from "react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { LinkListMenuItem } from "../components/list_menu/LinkListMenuItem";
import { ButtonListMenuItem } from "../components/list_menu/ButtonListMenuItem";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import {ListMenu} from "../components/list_menu/ListMenu";
import {ToggleSwitchListMenuItem} from "../components/list_menu/ToggleSwitchListMenuItem";
import {MapManagementHelp} from "./res/MapManagementHelp";
import PaperContainer from "../components/PaperContainer";
import {MapUtilitiesHelp} from "./res/MapUtilitiesHelp";
import {RenameIcon, VirtualRestrictionsIcon} from "../components/CustomIcons";
import { SelectListMenuItem, SelectListMenuItemOption } from "../components/list_menu/SelectListMenuItem";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid2, TextField } from "@mui/material";
import { MultipleMapHelp } from "./res/MultipleMapHelp";

interface MapRenameDialogProps {
    open: boolean;
    onClose: () => void;
    currentName: string;
    onRename: (newName: string) => void;
}

interface MapRotateDialogProps {
    open: boolean;
    onClose: () => void;
    currentRotation: number;
    onSave: (newRotation: number) => void;
}

const MapRenameDialog = (props: MapRenameDialogProps) => {
    const {open, onClose, currentName, onRename} = props;
    const [name, setName] = React.useState(currentName);

    React.useEffect(() => {
        if (open) {
            setName(currentName);
        }
    }, [open, currentName]);

    return (
        <Dialog open={open} onClose={onClose} sx={{userSelect: "none"}}>
            <DialogTitle>Rename Map</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    What should the map &apos;{currentName}&apos; be called?
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    variant="standard"
                    label="Map name"
                    fullWidth
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onRename(name.trim());
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={() => {
                        onRename(name.trim());
                    }}
                >
                    Rename
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const MapRotateDialog = (props: MapRotateDialogProps) => {
    const {open, onClose, currentRotation, onSave} = props;
    const [rotation, setRotation] = React.useState(`${currentRotation}`);

    React.useEffect(() => {
        if (open) {
            setRotation(`${currentRotation}`);
        }
    }, [open, currentRotation]);

    return (
        <Dialog open={open} onClose={onClose} sx={{userSelect: "none"}}>
            <DialogTitle>Rotate Map</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    At what angle should the map be displayed?
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    variant="standard"
                    label="Map angle"
                    fullWidth
                    value={rotation}
                    onChange={(e) => {
                        setRotation(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onSave(Number(rotation));
                        }
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    disabled={isNaN(Number(rotation))}
                    onClick={() => {
                        onSave(Number(rotation));
                    }}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export const MappingPassButtonItem = (): React.ReactElement => {
    const {mutate: startMappingPass, isPending: mappingPassStarting} = useStartMappingPassMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Mapping Pass"
            secondaryLabel="Create a new map"
            icon={<MappingPassIcon/>}
            buttonLabel="Go"
            confirmationDialog={{
                title: "Start mapping pass?",
                body: "Do you really want to start a mapping pass?"
            }}
            action={startMappingPass}
            actionLoading={mappingPassStarting}
        />
    );
};

const MapResetButtonItem = (): React.ReactElement => {
    const {mutate: resetMap, isPending: mapResetting} = useMapResetMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Map Reset"
            secondaryLabel="Delete all maps"
            icon={<MapResetIcon/>}
            buttonLabel="Go"
            buttonColor={"error"}
            confirmationDialog={{
                title: "Reset maps?",
                body: "Do you really want to delete all maps?"
            }}
            action={resetMap}
            actionLoading={mapResetting}
        />
    );
};

export const PersistentMapSwitchListItem = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {
        data: persistentData,
        isFetching: persistentDataLoading,
        isError: persistentDataError,
    } = usePersistentMapQuery();

    const {mutate: mutatePersistentData, isPending: persistentDataChanging} = usePersistentMapMutation();
    const loading = persistentDataLoading || persistentDataChanging;
    const disabled = loading || persistentDataChanging || persistentDataError;

    return (
        <>
            <ToggleSwitchListMenuItem
                value={persistentData?.enabled ?? false}
                setValue={(value) => {
                    // Disabling requires confirmation
                    if (value) {
                        mutatePersistentData(true);
                    } else {
                        setDialogOpen(true);
                    }
                }}
                disabled={disabled}
                loadError={persistentDataError}
                primaryLabel={"Persistent maps"}
                secondaryLabel={"Store a persistent map"}
                icon={<PersistentMapControlIcon/>}
            />
            <ConfirmationDialog
                title="Disable persistent maps?"
                text={(
                    <>
                        Do you really want to disable persistent maps?<br/>
                        This will delete the currently stored map.
                    </>
                )}
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
                onAccept={() => {
                    mutatePersistentData(false);
                }}
            />
        </>
    );
};

const MultipleMapSelectListMenuItem = () => {
    const {
        data: maps,
        isPending: mapsIsPending,
        isError: mapsIsError
    } = useMultipleMapMapsQuery();

    const options: Array<SelectListMenuItemOption> = (
        maps ?? []
    ).map((entry) => {
        return {
            value: entry.id,
            label: entry.name
        };
    });

    const {mutate: mutate, isPending: isSwitching} = useMultipleMapSwitchMutation();

    const noneOption = {value: "-1", label: "None"};

    const activeMapId = (maps ?? []).find(entry => entry.active)?.id;
    const currentValue = options.find(mode => {
        return mode.value === activeMapId;
    }) ?? noneOption;

    if (currentValue === noneOption || options.length === 0) {
        options.unshift(noneOption);
    }

    return (
        <SelectListMenuItem
            options={options}
            currentValue={currentValue}
            setValue={(e) => {
                mutate(e.value);
            }}
            disabled={isSwitching}
            loadingOptions={mapsIsPending}
            loadError={mapsIsError}
            primaryLabel="Map"
            secondaryLabel="Current active map"
            icon={<Map/>}
        />
    );
};

const MultipleMapRenameButtonItem = (): React.ReactElement => {
    const { data: maps } = useMultipleMapMapsQuery();
    const activeMap = React.useMemo(() => (maps ?? []).find(entry => entry.active), [maps]);

    const [mapRenameDialogOpen, setMapRenameDialogOpen] = React.useState(false);
    const {
        mutate: renameMap,
        isPending: renameMapExecuting
    } = useMultipleMapRenameMutation();

    const handleMapRename = React.useCallback((name: string) => {
        setMapRenameDialogOpen(false);
        renameMap({
            id: activeMap?.id ?? "",
            name: name
        });
    }, [renameMap, activeMap]);

    return (
        <>
            <MapRenameDialog
                open={mapRenameDialogOpen}
                onClose={() => setMapRenameDialogOpen(false)}
                currentName={activeMap?.name ?? ""}
                onRename={handleMapRename}
            />
            <ButtonListMenuItem
                primaryLabel="Rename Map"
                secondaryLabel="Rename the current map"
                icon={<RenameIcon/>}
                buttonLabel="Go"
                action={() => setMapRenameDialogOpen(true)}
                actionLoading={renameMapExecuting}
            />
        </>
    );
};

const MultipleMapRotateButtonItem = (): React.ReactElement => {
    const { data: maps } = useMultipleMapMapsQuery();
    const activeMap = React.useMemo(() => (maps ?? []).find(entry => entry.active), [maps]);

    const { data: rawMap } = useRobotMapQuery();

    const [mapRenameDialogOpen, setMapRenameDialogOpen] = React.useState(false);
    const {
        mutate: rotateMap,
        isPending: rotateMapExecuting
    } = useMultipleMapRotateMutation();

    const handleMapRotate = React.useCallback((rotation: number) => {
        setMapRenameDialogOpen(false);
        rotateMap({
            id: activeMap?.id ?? "",
            angle: rotation
        });
    }, [rotateMap, activeMap]);

    return (
        <>
            <MapRotateDialog
                open={mapRenameDialogOpen}
                onClose={() => setMapRenameDialogOpen(false)}
                currentRotation={rawMap?.metaData.rotation ?? 0}
                onSave={handleMapRotate}
            />
            <ButtonListMenuItem
                primaryLabel="Rotate Map"
                secondaryLabel="Rotate the current map"
                icon={<RotateRight/>}
                buttonLabel="Go"
                action={() => setMapRenameDialogOpen(true)}
                actionLoading={rotateMapExecuting}
            />
        </>
    );
};

const MultipleMapDeleteButtonItem = (): React.ReactElement => {
    const { data: maps } = useMultipleMapMapsQuery();
    const activeMap = React.useMemo(() => (maps ?? []).find(entry => entry.active), [maps]);

    const {mutate: deleteMap, isPending: deleteMapExecuting} = useMultipleMapDeleteMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Delete Map"
            secondaryLabel="Delete the current map"
            icon={<Delete/>}
            buttonLabel="Go"
            buttonColor={"error"}
            confirmationDialog={{
                title: "Delete map?",
                body: "Do you really want to delete the current map?"
            }}
            action={() => deleteMap(activeMap?.id ?? "")}
            actionLoading={deleteMapExecuting}
        />
    );
};

const ValetudoMapDataExportButtonItem = (): React.ReactElement => {
    const {
        data: valetudoInformation,
        isPending: valetudoInformationPending
    } = useValetudoInformationQuery();

    const {
        data: mapData,
        isPending: mapPending,
    } = useRobotMapQuery();


    return (
        <ButtonListMenuItem
            primaryLabel="Export ValetudoMap"
            secondaryLabel="Download a ValetudoMap data export to use with other tools"
            icon={<ValetudoMapDownloadIcon/>}
            buttonLabel="Go"
            action={() => {
                if (valetudoInformation && mapData) {
                    const timestamp = new Date().toISOString().replaceAll(":","-").split(".")[0];
                    const mapExportBlob = new Blob(
                        [JSON.stringify(mapData, null, 2)],
                        { type: "application/json" }
                    );

                    const linkElement = document.createElement("a");

                    linkElement.href = URL.createObjectURL(mapExportBlob);
                    linkElement.download = `ValetudoMapExport-${valetudoInformation.systemId}-${timestamp}.json`;

                    linkElement.click();
                }
            }}
            actionLoading={valetudoInformationPending || mapPending}
        />
    );
};

const MapManagement = (): React.ReactElement => {
    const [
        persistentMapControlCapabilitySupported,
        multipleMapCapabilitySupported,
        multipleMapRenameCapabilitySupported,
        multipleMapRotateCapabilitySupported,
        multipleMapDeleteCapabilitySupported,
        mappingPassCapabilitySupported,
        mapResetCapabilitySupported,

        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported,
        mapSegmentCleanOrderCapabilitySupported,

        combinedVirtualRestrictionsCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.PersistentMapControl,
        Capability.MultipleMap,
        Capability.MultipleMapRename,
        Capability.MultipleMapRotate,
        Capability.MultipleMapDelete,
        Capability.MappingPass,
        Capability.MapReset,

        Capability.MapSegmentEdit,
        Capability.MapSegmentRename,

        Capability.MapSegmentCleanOrder,

        Capability.CombinedVirtualRestrictions
    );

    const multipleMapListItems = React.useMemo(() => {
        const items = [];

        if (multipleMapCapabilitySupported) {
            items.push(
                <MultipleMapSelectListMenuItem key="multipleMapSelect"/>
            );
        }

        if (multipleMapRenameCapabilitySupported) {
            items.push(
                <MultipleMapRenameButtonItem key="multipleMapRename"/>
            );
        }

        if (multipleMapRotateCapabilitySupported) {
            items.push(
                <MultipleMapRotateButtonItem key="multipleMapRotate"/>
            );
        }

        if (multipleMapDeleteCapabilitySupported) {
            items.push(
                <MultipleMapDeleteButtonItem key="multipleMapDelete"/>
            );
        }

        return items;
    }, [
        multipleMapCapabilitySupported,
        multipleMapRenameCapabilitySupported,
        multipleMapRotateCapabilitySupported,
        multipleMapDeleteCapabilitySupported,
    ]);

    const robotManagedListItems = React.useMemo(() => {
        const items = [];

        if (
            persistentMapControlCapabilitySupported ||
            mappingPassCapabilitySupported ||
            mapResetCapabilitySupported
        ) {
            if (persistentMapControlCapabilitySupported) {
                items.push(
                    <PersistentMapSwitchListItem key="persistentMapSwitch"/>
                );
            }

            if (mappingPassCapabilitySupported) {
                items.push(
                    <MappingPassButtonItem key="mappingPass"/>
                );
            }

            if (mapResetCapabilitySupported) {
                items.push(
                    <MapResetButtonItem key="mapReset"/>
                );
            }

            if (
                mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported ||
                mapSegmentCleanOrderCapabilitySupported ||
                combinedVirtualRestrictionsCapabilitySupported
            ) {
                items.push(<SpacerListMenuItem key={"spacer1"}/>);
            }
        }


        if (mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported) {
            items.push(
                <LinkListMenuItem
                    key="segmentManagement"
                    url="/options/map_management/segments"
                    primaryLabel="Segment Management"
                    secondaryLabel="Modify the maps segments"
                    icon={<SegmentEditIcon/>}
                />
            );
        }

        if (mapSegmentCleanOrderCapabilitySupported) {
            items.push(
                <LinkListMenuItem
                    key="segmentCleanOrder"
                    url="/options/map_management/segment_clean_order"
                    primaryLabel="Segment Clean Order"
                    secondaryLabel="Modify the clean order of maps segments"
                    icon={<SwapVert/>}
                />
            );
        }

        if (combinedVirtualRestrictionsCapabilitySupported) {
            items.push(
                <LinkListMenuItem
                    key="virtualRestrictionManagement"
                    url="/options/map_management/virtual_restrictions"
                    primaryLabel="Virtual Restriction Management"
                    secondaryLabel="Create, modify and delete various virtual restrictions"
                    icon={<VirtualRestrictionsIcon/>}
                />
            );
        }

        return items;
    }, [
        persistentMapControlCapabilitySupported,
        mappingPassCapabilitySupported,
        mapResetCapabilitySupported,

        combinedVirtualRestrictionsCapabilitySupported,
        mapSegmentCleanOrderCapabilitySupported,
        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported
    ]);

    const utilityMapItems = React.useMemo(() => {
        return [
            <LinkListMenuItem
                key="robotCoverageMap"
                url="/options/map_management/robot_coverage"
                primaryLabel="Robot Coverage Map"
                secondaryLabel="Check the robots coverage"
                icon={<CleanupCoverageIcon/>}
            />,
            <ValetudoMapDataExportButtonItem key="valetudoMapDataExport" />
        ];
    }, []);

    return (
        <PaperContainer>
            <Grid2 container spacing={2} direction="column">
                {multipleMapListItems.length > 0 && (
                    <ListMenu
                        primaryHeader={"Multiple Map Management"}
                        secondaryHeader={"These features can be used to manage independent maps stored on the robot"}
                        listItems={multipleMapListItems}
                        helpText={MultipleMapHelp}
                    />
                )}
                <ListMenu
                    primaryHeader={"Robot-managed Map Features"}
                    secondaryHeader={"These features are managed and provided by the robot's firmware"}
                    listItems={robotManagedListItems}
                    helpText={MapManagementHelp}
                />
                <ListMenu
                    primaryHeader={"Map Utilities"}
                    secondaryHeader={"Do neat things with the map"}
                    listItems={utilityMapItems}
                    helpText={MapUtilitiesHelp}
                />
            </Grid2>
        </PaperContainer>
    );
};

export default MapManagement;
