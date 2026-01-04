import {Box, Grid2, Paper, Skeleton, SvgIconProps, Typography} from "@mui/material";
import React, {ReactNode} from "react";

interface ControlsInlineCardProps {
    icon: React.ComponentType<SvgIconProps>;
    title: string;
    children: ReactNode;
    isLoading?: boolean
}

const ControlsInlineCard: React.FC<ControlsInlineCardProps> = ({ icon: Icon, title, children, isLoading }) => (
    <Grid2>
        <Paper>
            <Grid2 container direction="column">
                <Box px={1.5} py={1.5}>
                    <Grid2 container alignItems="center" spacing={1}>
                        <Grid2 display="flex" alignItems="center" justifyContent="center">
                            <Icon fontSize="small" />
                        </Grid2>
                        <Grid2 style={{paddingTop: 0}}>
                            <Typography variant="subtitle1">
                                {title}
                            </Typography>
                        </Grid2>
                        <Grid2 display="flex" justifyContent="end" size="grow">
                            {
                                isLoading ? (
                                    <Skeleton height="4rem" />
                                ) : (
                                    children
                                )
                            }
                        </Grid2>
                    </Grid2>
                </Box>
            </Grid2>
        </Paper>
    </Grid2>
);

export default ControlsInlineCard;
