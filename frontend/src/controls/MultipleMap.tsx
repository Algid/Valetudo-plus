import { Map } from "@mui/icons-material";
import React from "react";
import { useMultipleMapMapsQuery, useMultipleMapSwitchMutation } from "../api";
import { SelectItem } from "../components/SelectItem";
import ControlsInlineCard from "./ControlsInlineCard";

type SelectItemOption = {
    value: string,
    label: string
}

const MultipleMap = (): React.ReactElement => {
    const {
        data: maps,
        isPending: mapsIsPending,
        isError: mapsIsError
    } = useMultipleMapMapsQuery();

    const options: Array<SelectItemOption> = (
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
        <ControlsInlineCard icon={Map} title="Map">
            <SelectItem
                size="small"
                options={options}
                currentValue={currentValue}
                setValue={(e) => {
                    mutate(e.value);
                }}
                disabled={isSwitching}
                loadingOptions={mapsIsPending}
                loadError={mapsIsError}
            />
        </ControlsInlineCard>
    );
};

export default MultipleMap;
