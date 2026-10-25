import {
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    InputAdornment,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import {
    ArrowDropDown as ArrowDropDownIcon,
    Close as CancelIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import React from "react";
import {
    useDelayedStartCancelMutation,
    useDelayedStartMutation,
    useDelayedStartQuery,
    ValetudoTimerActionType,
} from "../api";

type Mode = "in" | "at";

const PRESET_MINUTES = [15, 30, 60, 120, 240];
const MAX_MINUTES = 24 * 60;

const formatDuration = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes} min`;
    }

    return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
};

const formatClockTime = (date: Date): string => {
    return date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
};

const isTomorrow = (date: Date): boolean => {
    return date.toDateString() !== new Date().toDateString();
};

const nextOccurrence = (time: string): Date | null => {
    const match = /^(\d{2}):(\d{2})$/.exec(time);
    if (!match) {
        return null;
    }

    const target = new Date();
    target.setHours(Number(match[1]), Number(match[2]), 0, 0);

    if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1);
    }

    return target;
};

const useNow = (intervalMs: number, enabled = true): number => {
    const [now, setNow] = React.useState(Date.now());

    React.useEffect(() => {
        if (!enabled) {
            return;
        }

        setNow(Date.now());
        const interval = setInterval(() => {
            setNow(Date.now());
        }, intervalMs);

        return () => {
            clearInterval(interval);
        };
    }, [intervalMs, enabled]);

    return now;
};

const DelayedStartDialog = (props: {open: boolean, onClose: () => void}): React.ReactElement => {
    const {open, onClose} = props;
    const [mode, setMode] = React.useState<Mode>("in");
    const [minutes, setMinutes] = React.useState("30");
    const [time, setTime] = React.useState(() => {
        const inAnHour = new Date(Date.now() + 60 * 60 * 1000);

        return `${String(inAnHour.getHours()).padStart(2, "0")}:${String(inAnHour.getMinutes()).padStart(2, "0")}`;
    });
    const {mutate: schedule, isPending} = useDelayedStartMutation();
    const now = useNow(15_000, open);

    let delaySeconds: number | null = null;
    let startsAt: Date | null = null;

    if (mode === "in") {
        const parsed = Number(minutes);

        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_MINUTES) {
            delaySeconds = parsed * 60;
            startsAt = new Date(now + delaySeconds * 1000);
        }
    } else {
        startsAt = nextOccurrence(time);

        if (startsAt !== null) {
            delaySeconds = Math.max(1, Math.round((startsAt.getTime() - now) / 1000));
        }
    }

    const summary = startsAt === null ?
        "Pick a valid time" :
        `Starts ${isTomorrow(startsAt) ? "tomorrow" : "today"} at ${formatClockTime(startsAt)}`;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Start later</DialogTitle>
            <DialogContent>
                <Stack spacing={2} pt={1}>
                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        fullWidth
                        size="small"
                        onChange={(_, value: Mode | null) => {
                            if (value !== null) {
                                setMode(value);
                            }
                        }}
                    >
                        <ToggleButton value="in">In</ToggleButton>
                        <ToggleButton value="at">At</ToggleButton>
                    </ToggleButtonGroup>

                    {
                        mode === "in" ? (
                            <>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {PRESET_MINUTES.map(preset => {
                                        return (
                                            <Chip
                                                key={preset}
                                                label={formatDuration(preset)}
                                                color={Number(minutes) === preset ? "primary" : "default"}
                                                onClick={() => {
                                                    setMinutes(String(preset));
                                                }}
                                            />
                                        );
                                    })}
                                </Stack>
                                <TextField
                                    label="Delay"
                                    type="number"
                                    value={minutes}
                                    onChange={(e) => {
                                        setMinutes(e.target.value);
                                    }}
                                    slotProps={{
                                        input: {
                                            endAdornment: <InputAdornment position="end">min</InputAdornment>
                                        },
                                        htmlInput: {min: 1, max: MAX_MINUTES}
                                    }}
                                />
                            </>
                        ) : (
                            <TextField
                                label="Time"
                                type="time"
                                value={time}
                                onChange={(e) => {
                                    setTime(e.target.value);
                                }}
                            />
                        )
                    }

                    <Typography variant="body2" color="text.secondary">
                        {summary}. Runs a full cleanup with the fan, water and mode settings active at that time.
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    disabled={delaySeconds === null || isPending}
                    onClick={() => {
                        if (delaySeconds === null) {
                            return;
                        }

                        schedule(
                            {
                                delay: delaySeconds,
                                action: {type: ValetudoTimerActionType.FULL_CLEANUP, params: {}}
                            },
                            {
                                onSuccess: onClose
                            }
                        );
                    }}
                >
                    Schedule
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export const DelayedStartMenuButton = (props: {disabled: boolean}): React.ReactElement => {
    const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <>
            <Button
                variant="outlined"
                size="medium"
                color="inherit"
                title="More start options"
                disabled={props.disabled}
                onClick={(e) => {
                    setMenuAnchor(e.currentTarget);
                }}
                style={{height: "3.5em", borderColor: "inherit"}}
                sx={{width: "auto", flex: "0 0 auto", minWidth: 0, px: 0.5}}
            >
                <ArrowDropDownIcon />
            </Button>

            <Menu
                anchorEl={menuAnchor}
                open={menuAnchor !== null}
                onClose={() => {
                    setMenuAnchor(null);
                }}
            >
                <MenuItem
                    onClick={() => {
                        setMenuAnchor(null);
                        setDialogOpen(true);
                    }}
                >
                    <ListItemIcon>
                        <ScheduleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Start later…</ListItemText>
                </MenuItem>
            </Menu>

            <DelayedStartDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
            />
        </>
    );
};

export const DelayedStartStatus = (): React.ReactElement | null => {
    const {data, dataUpdatedAt} = useDelayedStartQuery();
    const {mutate: cancel, isPending: isCancelling} = useDelayedStartCancelMutation();

    const pending = data?.pending ?? null;
    const startsAtMs = pending === null ? null : dataUpdatedAt + pending.remaining * 1000;
    const now = useNow(1_000, startsAtMs !== null);
    const remainingMinutes = startsAtMs === null ? 0 : Math.ceil((startsAtMs - now) / 60_000);
    const isDue = startsAtMs !== null && remainingMinutes <= 0;

    if (startsAtMs === null) {
        return null;
    }

    const startsAt = new Date(startsAtMs);

    return (
        <Stack direction="row" alignItems="center" spacing={1} pt={1}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" sx={{flexGrow: 1}}>
                {
                    isDue ?
                        "Starting…" :
                        `Starts in ${formatDuration(remainingMinutes)} (${isTomorrow(startsAt) ? "tomorrow " : ""}${formatClockTime(startsAt)})`
                }
            </Typography>
            <IconButton
                size="small"
                title="Cancel delayed start"
                disabled={isCancelling}
                onClick={() => {
                    cancel();
                }}
            >
                <CancelIcon fontSize="small" />
            </IconButton>
        </Stack>
    );
};
