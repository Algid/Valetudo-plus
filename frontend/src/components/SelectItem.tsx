import React from "react";
import {
    CircularProgress,
    MenuItem,
    Select,
    Typography
} from "@mui/material";

export type SelectItemOption = {
    value: string,
    label: string
}

export const SelectItem: React.FunctionComponent<{
    size?: "small" | "medium"
    options: Array<SelectItemOption>
    currentValue: SelectItemOption,
    setValue: (newValue: SelectItemOption) => void,
    disabled: boolean,
    loadingOptions: boolean,
    loadError: boolean
}> = ({
    size,
    options,
    currentValue,
    setValue,
    disabled,
    loadingOptions,
    loadError,
}): React.ReactElement => {
    if (loadingOptions) {
        return (
            <CircularProgress/>
        );
    }

    if (loadError) {
        return (
            <Typography variant="body2" color="error">Error</Typography>
        );
    }


    return (
        <Select
            size={size}
            disabled={disabled}
            value={currentValue.value}
            onChange={(e) => {
                const selectedOption = options.find(option => option.value === e.target.value);

                if (selectedOption) {
                    setValue(selectedOption);
                }
            }}
        >
            {
                options.map((o, i) => {
                    return (
                        <MenuItem
                            value={o.value}
                            key={`${o}_${i}`}
                        >
                            {o.label}
                        </MenuItem>
                    );
                })
            }
        </Select>
    );
};
