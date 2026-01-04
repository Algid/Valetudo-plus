import {
    Avatar,
    Box,
    CircularProgress,
    Container,
    Divider,
    Grid2,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
} from "@mui/material";
import React from "react";
import PaperContainer from "../components/PaperContainer";
import {
    ChangeHistory,
    ExpandLess,
    ExpandMore,
    SwapVert
} from "@mui/icons-material";
import DetailPageHeaderRow from "../components/DetailPageHeaderRow";
import { RawMapLayer, RawMapLayerType, useRobotMapQuery, useSegmentCleanOrderMutation } from "../api";
import { LoadingButton } from "@mui/lab";
import InfoBox from "../components/InfoBox";

const SegmentCleanOrderContent = (): React.ReactElement => {
    const {
        data: mapData,
        isPending: mapIsPending,
        isError: mapLoadError,
    } = useRobotMapQuery();

    const {
        mutate: updateCleanOrder,
        isPending: cleanOrderUpdating
    } = useSegmentCleanOrderMutation();

    const [segments, setSegments] = React.useState<RawMapLayer[]>([]);

    const [configurationModified, setConfigurationModified] = React.useState<boolean>(false);

    React.useMemo(() => {
        const newSegments = (mapData?.layers ?? [])
            .filter(entry => entry.type === RawMapLayerType.Segment)
            .sort((a, b) => (a.metaData.cleanOrder ?? 0) - (b.metaData.cleanOrder ?? 0));

        const newSegmentIds = newSegments.map(segment => segment.metaData.segmentId).sort();
        const oldSegmentIds = segments.map(segment => segment.metaData.segmentId).sort();

        let arraysEqual = newSegmentIds.length === oldSegmentIds.length;
        if (arraysEqual) {
            for (let i = 0; i < newSegmentIds.length; i++) {
                if (newSegmentIds[i] !== oldSegmentIds[i]) {
                    arraysEqual = false;
                    break;
                }
            }
        }

        if (!arraysEqual) {
            setSegments(newSegments);
            setConfigurationModified(false);
        }
    }, [mapData, segments]);

    const offsetSegment = (index: number, offset: number) => {
        const newSegments = segments.slice();

        const moveSegment = newSegments.splice(index, 1)[0];
        newSegments.splice(index + offset, 0, moveSegment);

        setSegments(newSegments);
        setConfigurationModified(true);
    };

    if (mapIsPending) {
        return (
            <CircularProgress />
        );
    }

    if (mapLoadError) {
        return (
            <Container>
                <Typography align="center">Failed to load map data</Typography>
            </Container>
        );
    }

    if (!mapData) {
        return (
            <Container>
                <Typography align="center">No map data</Typography>
            </Container>
        );
    }

    if (segments.length === 0) {
        return (
            <Container>
                <Typography align="center">No segments found</Typography>
            </Container>
        );
    }

    return (
        <>
            <List>
                {
                    segments.map((entry, index) => {
                        return (
                            <ListItem
                                key={entry.metaData.segmentId}
                                style={{ userSelect: "none" }}
                                secondaryAction={
                                    <Grid2 container direction="row" spacing={2}>
                                        <IconButton
                                            edge="end"
                                            disabled={index === 0}
                                            onClick={() => offsetSegment(index, -1)}
                                        >
                                            <ExpandLess />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            disabled={index === segments.length - 1}
                                            onClick={() => offsetSegment(index, 1)}
                                        >
                                            <ExpandMore />
                                        </IconButton>
                                    </Grid2>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>
                                        <ChangeHistory />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={entry.metaData.name ?? "Segment"}
                                    secondary={`ID: ${entry.metaData.segmentId}`}
                                />
                            </ListItem>
                        );
                    }).map((item, idx) => {
                        const divider = (<Divider variant="middle" component="li" key={idx + "_divider"} />);

                        if (
                            idx > 0
                        ) {
                            return [divider, item];
                        } else {
                            return item;
                        }
                    })
                }
            </List>

            <InfoBox
                boxShadow={5}
                style={{
                    marginTop: "1rem",
                    marginBottom: "2rem"
                }}
            >
                <Typography color="info">
                    Customize the clean order for the current map when performing a full clean.
                    This order will not be followed when performing custom segment or zone cleans.
                </Typography>
            </InfoBox>

            <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>

            <Grid2 container>
                <Grid2 style={{marginLeft: "auto"}}>
                    <LoadingButton
                        loading={cleanOrderUpdating}
                        color="primary"
                        variant="outlined"
                        disabled={!configurationModified}
                        onClick={() => {
                            updateCleanOrder(
                                segments
                                    .map(entry => entry.metaData.segmentId)
                                    .filter(segmentId => segmentId !== undefined) as string[]
                            );

                            setConfigurationModified(false);
                        }}
                    >
                        Save configuration
                    </LoadingButton>
                </Grid2>
            </Grid2>
        </>
    );
};

const SegmentCleanOrderPage = (): React.ReactElement => {
    return (
        <Container maxWidth="sm">
            <PaperContainer>
                <Grid2 container direction="row">
                    <Box style={{width: "100%"}}>
                        <DetailPageHeaderRow
                            title="Segment Clean Order"
                            icon={<SwapVert/>}
                        />

                        <Box m={1}/>

                        <SegmentCleanOrderContent />
                    </Box>
                </Grid2>
            </PaperContainer>
        </Container>
    );
};

export default SegmentCleanOrderPage;
