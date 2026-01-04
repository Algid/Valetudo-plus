import { LoadingButton } from "@mui/lab";
import { Grid2 } from "@mui/material";
import React, {FunctionComponent} from "react";
import {
    Capability,
    useSpeakerPlayAudioListQuery,
    useSpeakerPlayAudioTriggerMutation,
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import { SelectItem } from "../../components/SelectItem";
import { CapabilityItem } from "./CapabilityLayout";

type SelectItemOption = {
    value: string,
    label: string
}

const PlayAudioControl: FunctionComponent = () => {
    const {
        data: audioList,
        isPending: audioListIsPending,
        isError: audioListIsError
    } = useSpeakerPlayAudioListQuery();

    const options: Array<SelectItemOption> = (
        audioList ?? []
    ).map((entry) => {
        return {
            value: entry.id,
            label: entry.name
        };
    });

    const {mutate: trigger, isPending: isTriggering} = useSpeakerPlayAudioTriggerMutation();

    const noneOption = {value: "-1", label: "None"};

    const [currentValue, setCurrentValue] = React.useState(noneOption);

    if (currentValue.value === noneOption.value && options.length > 0) {
        setCurrentValue(options[0]);
    } else if (currentValue.value === noneOption.value) {
        options.unshift(noneOption);
    }

    return (
        <CapabilityItem title={"Play Audio"} loading={audioListIsPending}>
            <Grid2 container spacing={2} direction="column">
                <SelectItem
                    size="small"
                    options={options}
                    currentValue={currentValue}
                    setValue={setCurrentValue}
                    disabled={isTriggering}
                    loadingOptions={audioListIsPending}
                    loadError={audioListIsError}
                />
                <Grid2>
                    <LoadingButton
                        disabled={currentValue.value === "-1"}
                        loading={isTriggering}
                        variant="outlined"
                        color="success"
                        onClick={() => {
                            return trigger(currentValue.value);
                        }}
                    >
                        Play
                    </LoadingButton>
                </Grid2>
            </Grid2>
        </CapabilityItem>
    );
};

const PlayAudio: FunctionComponent = () => {
    const [speakerPlayAudio] = useCapabilitiesSupported(Capability.SpeakerPlayAudio);

    if (!speakerPlayAudio) {
        return null;
    }

    return <PlayAudioControl/>;
};

export default PlayAudio;
